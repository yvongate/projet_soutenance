import { Module } from '@nestjs/common';
import { EmpruntsService } from './emprunts.service';
import { EmpruntsController } from './emprunts.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';

@Module({
  controllers: [EmpruntsController, ReservationsController],
  providers: [EmpruntsService, ReservationsService],
})
export class EmpruntsModule {}
