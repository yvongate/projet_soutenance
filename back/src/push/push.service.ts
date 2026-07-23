import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Notifications push navigateur/téléphone via le protocole Web Push (VAPID). */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private actif = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.config.get<string>('VAPID_SUBJECT') ??
      'mailto:admin@bibliosmart.local';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.actif = true;
      this.logger.log('Push : VAPID configuré');
    } else {
      this.logger.warn('Push : clés VAPID absentes → push désactivé');
    }
  }

  /** Clé publique VAPID (le front en a besoin pour s'abonner). */
  getPublicKey() {
    return { publicKey: this.config.get<string>('VAPID_PUBLIC_KEY') ?? null };
  }

  /** Enregistre (ou met à jour) l'abonnement push d'un appareil. */
  async sauvegarder(userId: string, dto: SubscribeDto) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
      update: { userId },
    });
    return { message: 'Abonnement push enregistré' };
  }

  /** Supprime un abonnement (désabonnement). */
  async supprimer(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return { message: 'Désabonné des notifications push' };
  }

  /** Envoie une notification push à tous les appareils d'un utilisateur. */
  async envoyer(userId: string, payload: PushPayload) {
    if (!this.actif) return;

    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
          );
        } catch (e) {
          const statusCode = (e as { statusCode?: number }).statusCode;
          // Abonnement expiré/invalide → on le nettoie
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription
              .delete({ where: { id: s.id } })
              .catch(() => undefined);
          } else {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Push échoué pour ${userId} : ${msg}`);
          }
        }
      }),
    );
  }
}
