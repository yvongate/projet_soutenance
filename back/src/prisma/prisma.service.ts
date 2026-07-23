import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Service Prisma : point d'accès unique à la base de données.
 * Se connecte au démarrage (avec réessais pour tolérer un démarrage lent de
 * la base, ex : Render free), et se déconnecte proprement à l'arrêt.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const maxTentatives = 5;
    for (let tentative = 1; tentative <= maxTentatives; tentative++) {
      try {
        await this.$connect();
        this.logger.log('Base de données connectée');
        return;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (tentative === maxTentatives) {
          this.logger.error(`Connexion BDD échouée définitivement : ${msg}`);
          throw e;
        }
        const delai = 2000 * tentative;
        this.logger.warn(
          `Connexion BDD échouée (tentative ${tentative}/${maxTentatives}), nouvel essai dans ${delai / 1000}s…`,
        );
        await new Promise((r) => setTimeout(r, delai));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
