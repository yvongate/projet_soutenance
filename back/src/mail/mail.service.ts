import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Envoi d'emails via Nodemailer.
 * - Si MAIL_HOST est configuré dans .env → SMTP réel.
 * - Sinon → compte de test Ethereal (emails non réels mais prévisualisables via une URL).
 * - En dernier recours (hors-ligne) → transport JSON (aucun envoi, pas de crash).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: nodemailer.Transporter<nodemailer.SentMessageInfo>;
  private from = 'BiblioSmart <no-reply@bibliosmart.local>';
  private ethereal = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.from = this.config.get<string>('MAIL_FROM') ?? this.from;
    const host = this.config.get<string>('MAIL_HOST');

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get<string>('MAIL_PORT') ?? 587),
        auth: {
          user: this.config.get<string>('MAIL_USER'),
          pass: this.config.get<string>('MAIL_PASS'),
        },
      });
      this.logger.log(`Email : SMTP ${host}`);
      return;
    }

    try {
      const test = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: test.user, pass: test.pass },
      });
      this.ethereal = true;
      this.logger.warn(
        'Email : aucun SMTP configuré → mode démo Ethereal (aperçu par URL)',
      );
    } catch {
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.logger.warn(
        'Email : Ethereal indisponible → transport JSON (aucun envoi)',
      );
    }
  }

  /** Envoi générique. Retourne l'URL d'aperçu en mode Ethereal. */
  async envoyer(to: string, sujet: string, html: string) {
    try {
      // nodemailer type le retour de sendMail de façon lâche (any selon le transport)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject: sujet,
        html,
      });
      if (this.ethereal) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const url = nodemailer.getTestMessageUrl(info);
        this.logger.log(`Email « ${sujet} » → ${to} | aperçu : ${url}`);
        return { apercu: url };
      }
      this.logger.log(`Email « ${sujet} » envoyé à ${to}`);
      return {};
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Échec email à ${to} : ${msg}`);
      return {};
    }
  }

  /** Email d'identifiants à la création d'un compte. */
  async identifiants(to: string, prenom: string, motDePasseTemporaire: string) {
    const html = `
      <h2>Bienvenue sur BiblioSmart 📚</h2>
      <p>Bonjour ${prenom},</p>
      <p>Votre compte a été créé. Voici vos identifiants de première connexion :</p>
      <ul>
        <li><b>Email</b> : ${to}</li>
        <li><b>Mot de passe temporaire</b> : <code>${motDePasseTemporaire}</code></li>
      </ul>
      <p>À votre première connexion, vous devrez choisir un nouveau mot de passe.</p>`;
    return this.envoyer(to, 'Vos identifiants BiblioSmart', html);
  }

  /** Email de réinitialisation de mot de passe. */
  async reinitialisation(to: string, prenom: string, lien: string) {
    const html = `
      <h2>Réinitialisation de mot de passe 🔑</h2>
      <p>Bonjour ${prenom},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe BiblioSmart.
      Cliquez sur le lien ci-dessous (valable 1 heure) :</p>
      <p><a href="${lien}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">Choisir un nouveau mot de passe</a></p>
      <p style="color:#666;font-size:12px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.</p>`;
    return this.envoyer(to, 'Réinitialisation de votre mot de passe', html);
  }
}
