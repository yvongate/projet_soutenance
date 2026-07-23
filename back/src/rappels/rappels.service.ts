import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Rappels automatiques : notifie les étudiants dont un emprunt doit être rendu
 * dans 3 jours ou moins (et pas encore rendu).
 */
@Injectable()
export class RappelsService {
  private readonly logger = new Logger(RappelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Exécution automatique chaque jour à 8h. */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async rappelsQuotidiens() {
    const n = await this.executer();
    this.logger.log(`Rappels J-3 envoyés : ${n}`);
  }

  /** Cœur du rappel (aussi déclenchable manuellement pour la démo). */
  async executer(): Promise<number> {
    const maintenant = new Date();
    const dans3jours = new Date(maintenant.getTime() + 3 * 24 * 60 * 60 * 1000);

    const emprunts = await this.prisma.emprunt.findMany({
      where: {
        dateRetourEffective: null,
        dateRetourPrevue: { gte: maintenant, lte: dans3jours },
      },
      include: {
        exemplaire: { include: { livre: { select: { titre: true } } } },
      },
    });

    for (const e of emprunts) {
      await this.notifications.notifier(
        e.userId,
        'RAPPEL',
        `Rappel : « ${e.exemplaire.livre.titre} » est à rendre avant le ${e.dateRetourPrevue.toLocaleDateString('fr-FR')}.`,
        {
          email: true,
          sujet: 'Rappel de retour',
          titrePush: 'Rappel de retour',
        },
      );
    }

    return emprunts.length;
  }
}
