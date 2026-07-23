import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly push: PushService) {}

  /** Clé publique VAPID pour l'abonnement côté navigateur. */
  @Get('public-key')
  publicKey() {
    return this.push.getPublicKey();
  }

  /** Enregistrer l'abonnement push de cet appareil. */
  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto, @CurrentUser('id') userId: string) {
    return this.push.sauvegarder(userId, dto);
  }

  /** Se désabonner. */
  @Post('unsubscribe')
  unsubscribe(@Body('endpoint') endpoint: string) {
    return this.push.supprimer(endpoint);
  }
}
