import { Module } from '@nestjs/common';
import { CatalogueService } from './catalogue.service';
import { QrService } from './qr.service';
import { CatalogueController } from './catalogue.controller';
import { ExemplairesController } from './exemplaires.controller';

@Module({
  controllers: [CatalogueController, ExemplairesController],
  providers: [CatalogueService, QrService],
  exports: [CatalogueService],
})
export class CatalogueModule {}
