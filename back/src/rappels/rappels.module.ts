import { Module } from '@nestjs/common';
import { RappelsService } from './rappels.service';
import { RappelsController } from './rappels.controller';

@Module({
  controllers: [RappelsController],
  providers: [RappelsService],
})
export class RappelsModule {}
