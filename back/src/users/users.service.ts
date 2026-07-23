import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, Utilisateur } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { skipTake } from '../common/pagination';
import { UsersQueryDto } from './dto/users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';

/** Résultat de création : le compte + le mot de passe temporaire en clair (à communiquer). */
export interface CreatedUser {
  user: Omit<Utilisateur, 'motDePasse'>;
  motDePasseTemporaire: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Génère un mot de passe temporaire lisible (10 caractères). */
  private genererMotDePasseTemporaire(): string {
    return randomBytes(8).toString('base64url').slice(0, 10);
  }

  /** Retire le hash du mot de passe avant de renvoyer un utilisateur. */
  private sansMotDePasse(user: Utilisateur): Omit<Utilisateur, 'motDePasse'> {
    const { motDePasse: _omis, ...reste } = user;
    return reste;
  }

  /**
   * Crée un compte (provisioning).
   * - ADMINISTRATEUR : peut créer n'importe quel rôle.
   * - BIBLIOTHECAIRE : peut créer uniquement des comptes ETUDIANT.
   */
  async create(dto: CreateUserDto, createur: AuthUser): Promise<CreatedUser> {
    const roles = dto.roles?.length ? dto.roles : [Role.ETUDIANT];

    // Contrôle des droits selon le créateur (option 2 du cahier des charges)
    const estAdmin = createur.roles.includes(Role.ADMINISTRATEUR);
    if (!estAdmin) {
      // Le créateur est bibliothécaire : uniquement des étudiants
      const uniquementEtudiant =
        roles.length === 1 && roles[0] === Role.ETUDIANT;
      if (!uniquementEtudiant) {
        throw new ForbiddenException(
          'Un bibliothécaire ne peut créer que des comptes étudiant',
        );
      }
    }

    // Un étudiant doit avoir un matricule
    if (roles.includes(Role.ETUDIANT) && !dto.matricule) {
      throw new BadRequestException('Le matricule est requis pour un étudiant');
    }

    const motDePasseTemporaire = this.genererMotDePasseTemporaire();
    const hash = await bcrypt.hash(motDePasseTemporaire, 10);

    try {
      const user = await this.prisma.utilisateur.create({
        data: {
          matricule: dto.matricule,
          nom: dto.nom,
          prenom: dto.prenom,
          email: dto.email,
          roles,
          motDePasse: hash,
          premiereConnexion: true,
          actif: true,
        },
      });
      // Envoi des identifiants par email (mode démo Ethereal si pas de SMTP)
      await this.mail.identifiants(
        user.email,
        user.prenom,
        motDePasseTemporaire,
      );
      return { user: this.sansMotDePasse(user), motDePasseTemporaire };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Un compte existe déjà avec cet email ou ce matricule',
        );
      }
      throw e;
    }
  }

  async findAll(query: UsersQueryDto) {
    const q = query.q?.trim();
    const where: Prisma.UtilisateurWhereInput = q
      ? {
          OR: [
            { nom: { contains: q, mode: 'insensitive' } },
            { prenom: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { matricule: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...skipTake(query),
      }),
      this.prisma.utilisateur.count({ where }),
    ]);
    return {
      items: users.map((u) => this.sansMotDePasse(u)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findOne(id: string): Promise<Omit<Utilisateur, 'motDePasse'>> {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.sansMotDePasse(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<Utilisateur, 'motDePasse'>> {
    await this.findOne(id); // vérifie l'existence
    const user = await this.prisma.utilisateur.update({
      where: { id },
      data: dto,
    });
    return this.sansMotDePasse(user);
  }

  /** Désactivation (on ne supprime pas : on garde l'historique des emprunts). */
  async desactiver(id: string): Promise<Omit<Utilisateur, 'motDePasse'>> {
    await this.findOne(id);
    const user = await this.prisma.utilisateur.update({
      where: { id },
      data: { actif: false },
    });
    return this.sansMotDePasse(user);
  }
}
