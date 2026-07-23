import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { PushModule } from './push/push.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogueModule } from './catalogue/catalogue.module';
import { EmpruntsModule } from './emprunts/emprunts.module';
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RappelsModule } from './rappels/rappels.module';
import { RecommandationsModule } from './recommandations/recommandations.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    // Charge le .env et rend ConfigService disponible partout
    ConfigModule.forRoot({ isGlobal: true }),
    // Limitation de débit globale : 100 requêtes / minute / IP (anti-abus).
    // Les routes sensibles (login, mot de passe) sont bridées plus fort localement.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    // Tâches planifiées (rappels J-3)
    ScheduleModule.forRoot(),
    // Accès base de données (global)
    PrismaModule,
    // Services transverses (globaux) : email + push
    MailModule,
    PushModule,
    // Notifications (dispatcher global : base + push + email)
    NotificationsModule,
    // Fonctionnalités
    AuthModule,
    UsersModule,
    CatalogueModule,
    EmpruntsModule,
    TicketsModule,
    RappelsModule,
    RecommandationsModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Applique le ThrottlerGuard à toutes les routes.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
