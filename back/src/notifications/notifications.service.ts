import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TypeNotification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { MailService } from '../mail/mail.service';

interface NotifierOptions {
  /** Envoyer aussi un email. */
  email?: boolean;
  /** Sujet de l'email (si email = true). */
  sujet?: string;
  /** Titre de la notification push. */
  titrePush?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly mail: MailService,
  ) {}

  /**
   * Point d'entrée unique : crée la notification en base, envoie le push,
   * et éventuellement un email.
   */
  async notifier(
    userId: string,
    type: TypeNotification,
    message: string,
    options: NotifierOptions = {},
  ) {
    const notif = await this.prisma.notification.create({
      data: { userId, type, message },
    });

    // Push (silencieux si l'utilisateur n'est pas abonné)
    await this.push.envoyer(userId, {
      title: options.titrePush ?? 'BiblioSmart',
      body: message,
    });

    // Email optionnel
    if (options.email) {
      const user = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
        select: { email: true, prenom: true },
      });
      if (user) {
        await this.mail.envoyer(
          user.email,
          options.sujet ?? 'BiblioSmart',
          `<p>Bonjour ${user.prenom},</p><p>${message}</p>`,
        );
      }
    }

    return notif;
  }

  /** Notifie plusieurs utilisateurs (ex : tout le staff). */
  async notifierPlusieurs(
    userIds: string[],
    type: TypeNotification,
    message: string,
    options: NotifierOptions = {},
  ) {
    await Promise.all(
      userIds.map((id) => this.notifier(id, type, message, options)),
    );
  }

  // -------------------- lecture --------------------

  async mesNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { dateEnvoi: 'desc' },
      take: 50,
    });
  }

  async compteNonLues(userId: string) {
    const nonLues = await this.prisma.notification.count({
      where: { userId, lu: false },
    });
    return { nonLues };
  }

  async marquerLue(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('Notification introuvable');
    if (notif.userId !== userId) {
      throw new ForbiddenException("Ce n'est pas votre notification");
    }
    await this.prisma.notification.update({
      where: { id },
      data: { lu: true },
    });
    return { message: 'Notification marquée comme lue' };
  }

  async toutMarquerLu(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, lu: false },
      data: { lu: true },
    });
    return { message: 'Toutes les notifications sont marquées comme lues' };
  }
}
