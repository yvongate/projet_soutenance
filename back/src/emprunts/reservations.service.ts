import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** L'étudiant réserve un livre indisponible (file d'attente FIFO). */
  async reserver(livreId: string, userId: string) {
    const livre = await this.prisma.livre.findUnique({
      where: { id: livreId },
      include: { exemplaires: { select: { statut: true } } },
    });
    if (!livre) throw new NotFoundException('Livre introuvable');

    const disponible = livre.exemplaires.some((e) => e.statut === 'DISPONIBLE');
    if (disponible) {
      throw new ConflictException(
        'Ce livre est disponible : empruntez-le directement',
      );
    }

    const existante = await this.prisma.reservation.findFirst({
      where: { livreId, userId, statut: { in: ['EN_ATTENTE', 'NOTIFIEE'] } },
    });
    if (existante) {
      throw new ConflictException(
        'Vous avez déjà une réservation en cours sur ce livre',
      );
    }

    const actives = await this.prisma.reservation.count({
      where: { livreId, statut: { in: ['EN_ATTENTE', 'NOTIFIEE'] } },
    });

    return this.prisma.reservation.create({
      data: { livreId, userId, position: actives + 1, statut: 'EN_ATTENTE' },
    });
  }

  /** Réservations actives de l'étudiant, avec sa position réelle dans la file. */
  async mesReservations(userId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: { userId, statut: { in: ['EN_ATTENTE', 'NOTIFIEE'] } },
      include: { livre: { select: { titre: true, auteur: true } } },
      orderBy: { dateReservation: 'asc' },
    });

    return Promise.all(
      reservations.map(async (r) => {
        const devant = await this.prisma.reservation.count({
          where: {
            livreId: r.livreId,
            statut: { in: ['EN_ATTENTE', 'NOTIFIEE'] },
            dateReservation: { lt: r.dateReservation },
          },
        });
        return { ...r, positionActuelle: devant + 1 };
      }),
    );
  }

  /** Annulation d'une réservation par son propriétaire. */
  async annuler(id: string, userId: string) {
    const r = await this.prisma.reservation.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Réservation introuvable');
    if (r.userId !== userId) {
      throw new ForbiddenException("Ce n'est pas votre réservation");
    }
    if (r.statut !== 'EN_ATTENTE' && r.statut !== 'NOTIFIEE') {
      throw new ConflictException('Cette réservation est déjà terminée');
    }
    await this.prisma.reservation.update({
      where: { id },
      data: { statut: 'ANNULEE' },
    });
    return { message: 'Réservation annulée' };
  }
}
