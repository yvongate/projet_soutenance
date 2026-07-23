import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { skipTake } from '../common/pagination';
import { QrService } from './qr.service';
import { CreateLivreDto } from './dto/create-livre.dto';
import { UpdateLivreDto } from './dto/update-livre.dto';
import { SearchLivreDto } from './dto/search-livre.dto';

@Injectable()
export class CatalogueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qr: QrService,
  ) {}

  /** Code unique inscrit dans le QR Code d'un exemplaire (ex : BS-A1B2C3D4E5F6). */
  private genererCodeExemplaire(): string {
    return 'BS-' + randomBytes(6).toString('hex').toUpperCase();
  }

  // ----------------------- LIVRES -----------------------

  /** Crée un livre, avec éventuellement N exemplaires (chacun avec son QR Code). */
  async createLivre(dto: CreateLivreDto) {
    const n = dto.nombreExemplaires ?? 0;
    const exemplaires = Array.from({ length: n }, () => ({
      qrCode: this.genererCodeExemplaire(),
    }));

    return this.prisma.livre.create({
      data: {
        titre: dto.titre,
        auteur: dto.auteur,
        isbn: dto.isbn,
        categorie: dto.categorie,
        description: dto.description,
        couverture: dto.couverture,
        cote: dto.cote,
        exemplaires: n > 0 ? { create: exemplaires } : undefined,
      },
      include: { exemplaires: true },
    });
  }

  /** Liste du catalogue paginée, avec recherche + compteurs de disponibilité. */
  async findAllLivres(search: SearchLivreDto) {
    const where: Prisma.LivreWhereInput = {};

    if (search.q) {
      where.OR = [
        { titre: { contains: search.q, mode: 'insensitive' } },
        { auteur: { contains: search.q, mode: 'insensitive' } },
        { isbn: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.categorie) {
      where.categorie = { equals: search.categorie, mode: 'insensitive' };
    }

    const [livres, total] = await Promise.all([
      this.prisma.livre.findMany({
        where,
        include: { exemplaires: { select: { statut: true } } },
        orderBy: { titre: 'asc' },
        ...skipTake(search),
      }),
      this.prisma.livre.count({ where }),
    ]);

    return {
      items: livres.map(({ exemplaires, ...livre }) => ({
        ...livre,
        nbExemplaires: exemplaires.length,
        nbDisponibles: exemplaires.filter((e) => e.statut === 'DISPONIBLE')
          .length,
      })),
      total,
      page: search.page,
      limit: search.limit,
    };
  }

  /** Liste des catégories distinctes (pour les filtres). */
  async categories(): Promise<string[]> {
    const rows = await this.prisma.livre.findMany({
      distinct: ['categorie'],
      select: { categorie: true },
      orderBy: { categorie: 'asc' },
    });
    return rows.map((r) => r.categorie);
  }

  /** Détail d'un livre avec ses exemplaires. */
  async findOneLivre(id: string) {
    const livre = await this.prisma.livre.findUnique({
      where: { id },
      include: { exemplaires: true },
    });
    if (!livre) throw new NotFoundException('Livre introuvable');

    const nbDisponibles = livre.exemplaires.filter(
      (e) => e.statut === 'DISPONIBLE',
    ).length;
    return { ...livre, nbDisponibles };
  }

  async updateLivre(id: string, dto: UpdateLivreDto) {
    await this.findOneLivre(id);
    return this.prisma.livre.update({ where: { id }, data: dto });
  }

  async removeLivre(id: string) {
    await this.findOneLivre(id);
    try {
      await this.prisma.livre.delete({ where: { id } });
      return { message: 'Livre supprimé' };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'Impossible de supprimer : des emprunts ou réservations existent sur ce livre',
        );
      }
      throw e;
    }
  }

  // -------------------- EXEMPLAIRES --------------------

  /** Ajoute un exemplaire physique à un livre + génère son QR Code. */
  async addExemplaire(livreId: string) {
    await this.findOneLivre(livreId);
    return this.prisma.exemplaire.create({
      data: { livreId, qrCode: this.genererCodeExemplaire() },
    });
  }

  /** Renvoie le code + l'image PNG (Data URL) du QR d'un exemplaire, pour impression. */
  async getQrCode(exemplaireId: string) {
    const exemplaire = await this.prisma.exemplaire.findUnique({
      where: { id: exemplaireId },
      include: { livre: { select: { titre: true } } },
    });
    if (!exemplaire) throw new NotFoundException('Exemplaire introuvable');

    const image = await this.qr.toDataURL(exemplaire.qrCode);
    return {
      exemplaireId: exemplaire.id,
      qrCode: exemplaire.qrCode,
      titre: exemplaire.livre.titre,
      image, // data:image/png;base64,...
    };
  }

  async removeExemplaire(id: string) {
    const exemplaire = await this.prisma.exemplaire.findUnique({
      where: { id },
    });
    if (!exemplaire) throw new NotFoundException('Exemplaire introuvable');
    try {
      await this.prisma.exemplaire.delete({ where: { id } });
      return { message: 'Exemplaire supprimé' };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'Impossible de supprimer : cet exemplaire a un historique d’emprunt',
        );
      }
      throw e;
    }
  }
}
