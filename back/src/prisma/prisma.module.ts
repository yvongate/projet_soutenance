import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module global : rend PrismaService injectable dans tous les autres modules
 * sans avoir à le réimporter à chaque fois.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
