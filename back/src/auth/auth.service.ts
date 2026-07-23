import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Utilisateur } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  /** Fabrique le JWT signé à partir d'un utilisateur. */
  private signer(user: Utilisateur): string {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
  }

  /** Vue publique d'un utilisateur (sans le hash). */
  private profil(user: Utilisateur) {
    const { motDePasse: _omis, ...reste } = user;
    return reste;
  }

  /**
   * Connexion.
   * - Si premiereConnexion = true : PAS de JWT, on demande le changement de mot de passe.
   * - Sinon : JWT émis + profil.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.actif) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const motDePasseOk = await bcrypt.compare(dto.motDePasse, user.motDePasse);
    if (!motDePasseOk) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Première connexion : on force le changement de mot de passe
    if (user.premiereConnexion) {
      return {
        premiereConnexion: true,
        message: 'Vous devez changer votre mot de passe avant de continuer',
        email: user.email,
      };
    }

    return {
      premiereConnexion: false,
      access_token: this.signer(user),
      user: this.profil(user),
    };
  }

  /**
   * Changement de mot de passe. Revérifie l'ancien mot de passe,
   * passe premiereConnexion à false, puis émet le JWT (accès à l'app).
   */
  async changePassword(dto: ChangePasswordDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.actif) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const ancienOk = await bcrypt.compare(
      dto.ancienMotDePasse,
      user.motDePasse,
    );
    if (!ancienOk) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    if (dto.nouveauMotDePasse === dto.ancienMotDePasse) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent de l’ancien',
      );
    }

    const hash = await bcrypt.hash(dto.nouveauMotDePasse, 10);
    const maj = await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { motDePasse: hash, premiereConnexion: false },
    });

    return {
      message: 'Mot de passe changé avec succès',
      access_token: this.signer(maj),
      user: this.profil(maj),
    };
  }

  /**
   * Mot de passe oublié : génère un jeton de réinitialisation (1h, usage unique)
   * et envoie un email avec le lien. Réponse volontairement générique
   * (on ne révèle pas si l'email existe — anti-énumération).
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { email } });

    if (user && user.actif) {
      const token = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await this.prisma.utilisateur.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry },
      });

      const frontUrl =
        this.config.get<string>('FRONT_URL') ?? 'http://localhost:3000';
      const lien = `${frontUrl}/reset-password?token=${token}`;
      await this.mail.reinitialisation(user.email, user.prenom, lien);
    }

    return {
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    };
  }

  /** Réinitialise le mot de passe à partir d'un jeton valide (puis l'invalide). */
  async resetPassword(token: string, nouveauMotDePasse: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) {
      throw new BadRequestException('Lien invalide ou expiré');
    }

    const hash = await bcrypt.hash(nouveauMotDePasse, 10);
    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: {
        motDePasse: hash,
        resetToken: null,
        resetTokenExpiry: null,
        premiereConnexion: false,
      },
    });

    return {
      message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.',
    };
  }
}
