import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** Mes notifications. */
  @Get()
  mes(@CurrentUser('id') userId: string) {
    return this.notifications.mesNotifications(userId);
  }

  /** Compteur de non lues (badge). */
  @Get('non-lues')
  nonLues(@CurrentUser('id') userId: string) {
    return this.notifications.compteNonLues(userId);
  }

  /** Marquer une notification comme lue. */
  @Post(':id/lu')
  marquerLue(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notifications.marquerLue(id, userId);
  }

  /** Tout marquer comme lu. */
  @Post('tout-lu')
  toutMarquerLu(@CurrentUser('id') userId: string) {
    return this.notifications.toutMarquerLu(userId);
  }
}
