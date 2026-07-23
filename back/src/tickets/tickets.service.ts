import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StatutTicket } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { skipTake } from '../common/pagination';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketsQueryDto } from './dto/tickets-query.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private estStaff(roles: Role[]): boolean {
    return (
      roles.includes(Role.BIBLIOTHECAIRE) || roles.includes(Role.ADMINISTRATEUR)
    );
  }

  /** Notifie tous les membres du staff actifs (base + push). */
  private async notifierStaff(message: string) {
    const staff = await this.prisma.utilisateur.findMany({
      where: {
        actif: true,
        roles: { hasSome: [Role.BIBLIOTHECAIRE, Role.ADMINISTRATEUR] },
      },
      select: { id: true },
    });
    await this.notifications.notifierPlusieurs(
      staff.map((s) => s.id),
      'MESSAGE',
      message,
      { titrePush: 'BiblioSmart — Ticket' },
    );
  }

  /** Récupère un ticket et vérifie que l'utilisateur y a accès. */
  private async getTicketAutorise(ticketId: string, user: AuthUser) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable');
    const staff = this.estStaff(user.roles);
    if (!staff && ticket.etudiantId !== user.id) {
      throw new ForbiddenException("Ce n'est pas votre ticket");
    }
    return ticket;
  }

  // -------------------- ÉTUDIANT --------------------

  /** Ouvre un ticket (sujet + 1er message). Notifie le staff. */
  async creerTicket(etudiantId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.ticket.create({
      data: {
        etudiantId,
        sujet: dto.sujet,
        messages: {
          create: { expediteurId: etudiantId, contenu: dto.message },
        },
      },
      include: { messages: true },
    });
    await this.notifierStaff(`Nouveau ticket : « ${dto.sujet} »`);
    return ticket;
  }

  /** Les tickets de l'étudiant (avec dernier message + non lus). */
  async mesTickets(etudiantId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { etudiantId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    return Promise.all(
      tickets.map(async (t) => {
        const nonLus = await this.prisma.message.count({
          where: {
            ticketId: t.id,
            expediteurId: { not: etudiantId }, // messages du staff
            lu: false,
          },
        });
        return {
          id: t.id,
          sujet: t.sujet,
          statut: t.statut,
          updatedAt: t.updatedAt,
          dernierMessage: t.messages[0]?.contenu ?? null,
          nonLus,
        };
      }),
    );
  }

  /** Badge étudiant : messages du staff non lus. */
  async compteNonLusEtudiant(etudiantId: string) {
    const nonLus = await this.prisma.message.count({
      where: {
        lu: false,
        ticket: { etudiantId },
        expediteurId: { not: etudiantId },
      },
    });
    return { nonLus };
  }

  // -------------------- STAFF --------------------

  /** Tous les tickets (boîte partagée), filtrable par statut. */
  async tousLesTickets(query: TicketsQueryDto) {
    const where = query.statut ? { statut: query.statut } : {};
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          etudiant: { select: { nom: true, prenom: true, matricule: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        ...skipTake(query),
      }),
      this.prisma.ticket.count({ where }),
    ]);

    const items = await Promise.all(
      tickets.map(async (t) => {
        const nonLus = await this.prisma.message.count({
          where: {
            ticketId: t.id,
            expediteurId: t.etudiantId, // messages de l'étudiant
            lu: false,
          },
        });
        return {
          id: t.id,
          sujet: t.sujet,
          statut: t.statut,
          updatedAt: t.updatedAt,
          etudiant: t.etudiant,
          dernierMessage: t.messages[0]?.contenu ?? null,
          nonLus,
        };
      }),
    );

    return { items, total, page: query.page, limit: query.limit };
  }

  /** Badge staff : messages d'étudiants non lus (toute la boîte partagée). */
  async compteNonLusStaff() {
    const tickets = await this.prisma.ticket.findMany({
      select: {
        etudiantId: true,
        messages: { where: { lu: false }, select: { expediteurId: true } },
      },
    });
    let nonLus = 0;
    for (const t of tickets) {
      nonLus += t.messages.filter(
        (m) => m.expediteurId === t.etudiantId,
      ).length;
    }
    return { nonLus };
  }

  // -------------------- COMMUN --------------------

  /** Détail d'un ticket + messages. Marque comme lus les messages reçus. */
  async voirTicket(ticketId: string, user: AuthUser) {
    const acces = await this.getTicketAutorise(ticketId, user);
    const staff = this.estStaff(user.roles);

    // Marque comme lus les messages venant de l'autre partie
    await this.prisma.message.updateMany({
      where: staff
        ? { ticketId, expediteurId: acces.etudiantId, lu: false }
        : { ticketId, expediteurId: { not: acces.etudiantId }, lu: false },
      data: { lu: true },
    });

    return this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        etudiant: {
          select: { id: true, nom: true, prenom: true, matricule: true },
        },
        prisEnCharge: { select: { id: true, nom: true, prenom: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            expediteur: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
    });
  }

  /** Ajoute un message au ticket (étudiant propriétaire ou staff). */
  async repondre(ticketId: string, user: AuthUser, dto: AddMessageDto) {
    const ticket = await this.getTicketAutorise(ticketId, user);
    if (ticket.statut === StatutTicket.FERME) {
      throw new ConflictException(
        'Ce ticket est fermé — rouvrez-le pour répondre',
      );
    }

    const message = await this.prisma.message.create({
      data: { ticketId, expediteurId: user.id, contenu: dto.contenu },
    });

    if (this.estStaff(user.roles)) {
      // Un membre du staff répond : le ticket passe EN_COURS
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          statut: StatutTicket.EN_COURS,
          prisEnChargeParId: ticket.prisEnChargeParId ?? user.id,
        },
      });
      await this.notifications.notifier(
        ticket.etudiantId,
        'MESSAGE',
        `Réponse à votre ticket : « ${ticket.sujet} »`,
        { titrePush: 'Réponse à votre ticket' },
      );
    } else {
      // L'étudiant relance : on remonte le ticket et on notifie le staff
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });
      await this.notifierStaff(
        `Nouveau message sur le ticket : « ${ticket.sujet} »`,
      );
    }

    return message;
  }

  /** Ferme un ticket (étudiant propriétaire ou staff). */
  async fermer(ticketId: string, user: AuthUser) {
    await this.getTicketAutorise(ticketId, user);
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { statut: StatutTicket.FERME },
    });
    return { message: 'Ticket fermé' };
  }

  /** Rouvre un ticket fermé. */
  async rouvrir(ticketId: string, user: AuthUser) {
    await this.getTicketAutorise(ticketId, user);
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { statut: StatutTicket.EN_COURS },
    });
    return { message: 'Ticket rouvert' };
  }
}
