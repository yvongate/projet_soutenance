import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private fmtDate(d: Date | null): string {
    return d ? new Date(d).toLocaleDateString('fr-FR') : '';
  }

  /** Tableau de bord : chiffres clés + top livres/catégories. */
  async dashboard() {
    const maintenant = new Date();

    const [
      totalLivres,
      totalExemplaires,
      exemplairesParStatut,
      empruntsEnCours,
      empruntsEnRetard,
      totalUtilisateurs,
      totalEtudiants,
      reservationsEnAttente,
      ticketsOuverts,
      emprunts,
    ] = await Promise.all([
      this.prisma.livre.count(),
      this.prisma.exemplaire.count(),
      this.prisma.exemplaire.groupBy({ by: ['statut'], _count: true }),
      this.prisma.emprunt.count({ where: { dateRetourEffective: null } }),
      this.prisma.emprunt.count({
        where: {
          dateRetourEffective: null,
          dateRetourPrevue: { lt: maintenant },
        },
      }),
      this.prisma.utilisateur.count(),
      this.prisma.utilisateur.count({ where: { roles: { has: 'ETUDIANT' } } }),
      this.prisma.reservation.count({
        where: { statut: { in: ['EN_ATTENTE', 'NOTIFIEE'] } },
      }),
      this.prisma.ticket.count({ where: { statut: { not: 'FERME' } } }),
      this.prisma.emprunt.findMany({
        include: {
          exemplaire: {
            include: { livre: { select: { titre: true, categorie: true } } },
          },
        },
      }),
    ]);

    // Top livres et catégories (par nombre d'emprunts)
    const compteLivre = new Map<string, number>();
    const compteCategorie = new Map<string, number>();
    for (const e of emprunts) {
      const { titre, categorie } = e.exemplaire.livre;
      compteLivre.set(titre, (compteLivre.get(titre) ?? 0) + 1);
      compteCategorie.set(categorie, (compteCategorie.get(categorie) ?? 0) + 1);
    }
    const top = (m: Map<string, number>) =>
      [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nom, emprunts]) => ({ nom, emprunts }));

    const parStatut = (s: string) =>
      exemplairesParStatut.find((x) => x.statut === s)?._count ?? 0;

    return {
      catalogue: {
        livres: totalLivres,
        exemplaires: totalExemplaires,
        disponibles: parStatut('DISPONIBLE'),
        empruntes: parStatut('EMPRUNTE'),
        reserves: parStatut('RESERVE'),
      },
      emprunts: {
        enCours: empruntsEnCours,
        enRetard: empruntsEnRetard,
        total: emprunts.length,
      },
      utilisateurs: {
        total: totalUtilisateurs,
        etudiants: totalEtudiants,
      },
      reservationsEnAttente,
      ticketsOuverts,
      topLivres: top(compteLivre),
      topCategories: top(compteCategorie),
    };
  }

  // ----------------------- EXPORTS CSV -----------------------

  private toCsv(entetes: string[], lignes: (string | number)[][]): string {
    const echapper = (v: string | number) => {
      const s = String(v ?? '');
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const contenu = [entetes, ...lignes]
      .map((ligne) => ligne.map(echapper).join(';'))
      .join('\r\n');
    return '﻿' + contenu; // BOM UTF-8 pour Excel
  }

  async exportEmpruntsCsv(): Promise<string> {
    const emprunts = await this.prisma.emprunt.findMany({
      include: {
        user: {
          select: { matricule: true, nom: true, prenom: true, email: true },
        },
        exemplaire: {
          select: {
            qrCode: true,
            livre: { select: { titre: true, auteur: true } },
          },
        },
      },
      orderBy: { dateEmprunt: 'desc' },
    });

    const lignes = emprunts.map((e) => [
      e.user.matricule ?? '',
      e.user.nom,
      e.user.prenom,
      e.user.email,
      e.exemplaire.livre.titre,
      e.exemplaire.livre.auteur,
      e.exemplaire.qrCode,
      this.fmtDate(e.dateEmprunt),
      this.fmtDate(e.dateRetourPrevue),
      this.fmtDate(e.dateRetourEffective),
      e.dateRetourEffective ? 'Rendu' : 'En cours',
    ]);

    return this.toCsv(
      [
        'Matricule',
        'Nom',
        'Prenom',
        'Email',
        'Livre',
        'Auteur',
        'QR Exemplaire',
        'Date emprunt',
        'Retour prevu',
        'Retour effectif',
        'Statut',
      ],
      lignes,
    );
  }

  async exportLivresCsv(): Promise<string> {
    const livres = await this.prisma.livre.findMany({
      include: { exemplaires: { select: { statut: true } } },
      orderBy: { titre: 'asc' },
    });

    const lignes = livres.map((l) => [
      l.titre,
      l.auteur,
      l.isbn ?? '',
      l.categorie,
      l.cote ?? '',
      l.exemplaires.length,
      l.exemplaires.filter((e) => e.statut === 'DISPONIBLE').length,
    ]);

    return this.toCsv(
      [
        'Titre',
        'Auteur',
        'ISBN',
        'Categorie',
        'Cote',
        'Exemplaires',
        'Disponibles',
      ],
      lignes,
    );
  }

  async exportUtilisateursCsv(): Promise<string> {
    const users = await this.prisma.utilisateur.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const lignes = users.map((u) => [
      u.matricule ?? '',
      u.nom,
      u.prenom,
      u.email,
      u.roles.join(' + '),
      u.actif ? 'Actif' : 'Desactive',
    ]);

    return this.toCsv(
      ['Matricule', 'Nom', 'Prenom', 'Email', 'Roles', 'Statut'],
      lignes,
    );
  }
}
