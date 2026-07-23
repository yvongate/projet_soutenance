import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginationDto, skipTake } from '../common/pagination';

@Injectable()
export class EmpruntsService {
  /** Durée d'un emprunt (jours) et validité du QR de transaction (minutes). */
  private readonly DUREE_EMPRUNT_JOURS = 30;
  private readonly DUREE_TRANSACTION_MIN = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * ÉTAPE 1 — L'étudiant scanne le QR du livre.
   * Génère un QR de transaction temporaire (token, valable 5 min).
   */
  async scannerLivre(qrCode: string, userId: string) {
    const exemplaire = await this.prisma.exemplaire.findUnique({
      where: { qrCode },
      include: { livre: { select: { titre: true } } },
    });
    if (!exemplaire) throw new NotFoundException('QR Code de livre inconnu');
    if (exemplaire.statut !== 'DISPONIBLE') {
      throw new ConflictException("Cet exemplaire n'est pas disponible");
    }

    const token = randomBytes(16).toString('hex');
    const expireAt = new Date(
      Date.now() + this.DUREE_TRANSACTION_MIN * 60 * 1000,
    );

    await this.prisma.transactionQR.create({
      data: { exemplaireId: exemplaire.id, userId, token, expireAt },
    });

    return {
      token, // l'app affiche ce token sous forme de QR pour le guichet
      expireAt,
      expireDansSecondes: this.DUREE_TRANSACTION_MIN * 60,
      livre: exemplaire.livre.titre,
    };
  }

  /**
   * ÉTAPE 2 — Le bibliothécaire scanne le QR de transaction.
   * Vérifie le jeton, crée l'emprunt (J+30), passe l'exemplaire à EMPRUNTE,
   * satisfait une éventuelle réservation et notifie l'étudiant.
   */
  async validerEmprunt(token: string) {
    const transaction = await this.prisma.transactionQR.findUnique({
      where: { token },
      include: { exemplaire: true },
    });
    if (!transaction) throw new NotFoundException('QR de transaction inconnu');
    if (transaction.utilise) {
      throw new ConflictException('Ce QR de transaction a déjà été utilisé');
    }
    if (transaction.expireAt < new Date()) {
      throw new ConflictException(
        'QR de transaction expiré — veuillez le régénérer',
      );
    }
    if (transaction.exemplaire.statut !== 'DISPONIBLE') {
      throw new ConflictException("L'exemplaire n'est plus disponible");
    }

    const dateRetourPrevue = new Date(
      Date.now() + this.DUREE_EMPRUNT_JOURS * 24 * 60 * 60 * 1000,
    );

    const emprunt = await this.prisma.$transaction(async (tx) => {
      const emp = await tx.emprunt.create({
        data: {
          exemplaireId: transaction.exemplaireId,
          userId: transaction.userId,
          dateRetourPrevue,
        },
      });
      await tx.exemplaire.update({
        where: { id: transaction.exemplaireId },
        data: { statut: 'EMPRUNTE' },
      });
      await tx.transactionQR.update({
        where: { id: transaction.id },
        data: { utilise: true },
      });
      // Si l'étudiant avait réservé ce livre, la réservation est satisfaite
      await tx.reservation.updateMany({
        where: {
          livreId: transaction.exemplaire.livreId,
          userId: transaction.userId,
          statut: { in: ['EN_ATTENTE', 'NOTIFIEE'] },
        },
        data: { statut: 'SATISFAITE' },
      });
      return emp;
    });

    // Notification (base + push + email) après la transaction
    await this.notifications.notifier(
      transaction.userId,
      'EMPRUNT',
      `Emprunt confirmé. À rendre avant le ${dateRetourPrevue.toLocaleDateString('fr-FR')}.`,
      {
        email: true,
        sujet: 'Confirmation d’emprunt',
        titrePush: 'Emprunt confirmé',
      },
    );

    return { message: 'Emprunt validé', emprunt, dateRetourPrevue };
  }

  /**
   * RETOUR — Le bibliothécaire scanne le QR du livre rendu.
   * Clôture l'emprunt, repasse l'exemplaire en DISPONIBLE, et notifie le
   * premier réservataire de la file (FIFO) s'il en existe un.
   */
  async enregistrerRetour(qrCode: string) {
    const exemplaire = await this.prisma.exemplaire.findUnique({
      where: { qrCode },
    });
    if (!exemplaire) throw new NotFoundException('QR Code de livre inconnu');

    const emprunt = await this.prisma.emprunt.findFirst({
      where: { exemplaireId: exemplaire.id, dateRetourEffective: null },
      orderBy: { dateEmprunt: 'desc' },
    });
    if (!emprunt) {
      throw new ConflictException('Aucun emprunt en cours pour cet exemplaire');
    }

    const { reservataireNotifie } = await this.prisma.$transaction(
      async (tx) => {
        await tx.emprunt.update({
          where: { id: emprunt.id },
          data: { dateRetourEffective: new Date() },
        });
        await tx.exemplaire.update({
          where: { id: exemplaire.id },
          data: { statut: 'DISPONIBLE' },
        });

        // Premier réservataire en attente sur ce livre (FIFO)
        const prochaine = await tx.reservation.findFirst({
          where: { livreId: exemplaire.livreId, statut: 'EN_ATTENTE' },
          orderBy: { dateReservation: 'asc' },
        });

        let reservataireNotifie: string | null = null;
        if (prochaine) {
          await tx.reservation.update({
            where: { id: prochaine.id },
            data: { statut: 'NOTIFIEE' },
          });
          reservataireNotifie = prochaine.userId;
        }
        return { reservataireNotifie };
      },
    );

    // Notification du réservataire (base + push + email) après la transaction
    if (reservataireNotifie) {
      await this.notifications.notifier(
        reservataireNotifie,
        'DISPONIBILITE',
        'Un livre que vous aviez réservé est maintenant disponible.',
        {
          email: true,
          sujet: 'Votre réservation est disponible',
          titrePush: 'Livre disponible',
        },
      );
    }

    return { message: 'Retour enregistré', reservataireNotifie };
  }

  /** Emprunts d'un étudiant (en cours + historique). */
  async mesEmprunts(userId: string) {
    return this.prisma.emprunt.findMany({
      where: { userId },
      include: {
        exemplaire: {
          include: { livre: { select: { titre: true, auteur: true } } },
        },
      },
      orderBy: { dateEmprunt: 'desc' },
    });
  }

  /** Historique global (bibliothécaire / admin). */
  async historique(pagination: PaginationDto) {
    const [items, total] = await Promise.all([
      this.prisma.emprunt.findMany({
        include: {
          exemplaire: {
            include: { livre: { select: { titre: true } } },
          },
          user: { select: { nom: true, prenom: true, matricule: true } },
        },
        orderBy: { dateEmprunt: 'desc' },
        ...skipTake(pagination),
      }),
      this.prisma.emprunt.count(),
    ]);
    return { items, total, page: pagination.page, limit: pagination.limit };
  }
}
