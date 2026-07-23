import { Module } from '@nestjs/common';
import { RecommandationsService } from './recommandations.service';
import { RecommandationsController } from './recommandations.controller';

@Module({
  controllers: [RecommandationsController],
  providers: [RecommandationsService],
})
export class RecommandationsModule {}
