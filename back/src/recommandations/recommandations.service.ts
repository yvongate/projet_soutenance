import { Injectable } from '@nestjs/common';
import { Livre } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { tokeniser } from './tokenizer';

type Vecteur = Map<string, number>;

@Injectable()
export class RecommandationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Texte représentatif d'un livre (pour l'analyse TF-IDF). */
  private documentLivre(livre: Livre): string[] {
    return tokeniser(
      `${livre.titre} ${livre.auteur} ${livre.categorie} ${livre.description ?? ''}`,
    );
  }

  /** Similarité cosinus entre deux vecteurs creux. */
  private cosinus(a: Vecteur, b: Vecteur): number {
    let produit = 0;
    for (const [terme, poids] of a) {
      const autre = b.get(terme);
      if (autre) produit += poids * autre;
    }
    const norme = (v: Vecteur) =>
      Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0));
    const denom = norme(a) * norme(b);
    return denom === 0 ? 0 : produit / denom;
  }

  /**
   * Recommandations pour un étudiant, par 2 algorithmes internes :
   *  1. Catégories favorites (les plus empruntées)
   *  2. Similarité TF-IDF avec l'historique de lecture
   */
  async pourUtilisateur(userId: string) {
    // Historique : livres empruntés par l'utilisateur
    const emprunts = await this.prisma.emprunt.findMany({
      where: { userId },
      include: { exemplaire: { include: { livre: true } } },
    });

    const livresEmpruntes = emprunts.map((e) => e.exemplaire.livre);
    const idsEmpruntes = new Set(livresEmpruntes.map((l) => l.id));

    // Catalogue complet
    const tousLivres = await this.prisma.livre.findMany();
    const candidats = tousLivres.filter((l) => !idsEmpruntes.has(l.id));

    // Nouvel utilisateur sans historique → livres les plus populaires
    if (livresEmpruntes.length === 0) {
      const populaires = await this.populaires(6);
      return {
        aDesRecommandations: populaires.length > 0,
        raison: 'Aucun historique — suggestions populaires',
        parCategories: [],
        parSimilarite: populaires,
      };
    }

    // ---- Algorithme 1 : catégories favorites ----
    const scoreCategorie = new Map<string, number>();
    for (const l of livresEmpruntes) {
      scoreCategorie.set(
        l.categorie,
        (scoreCategorie.get(l.categorie) ?? 0) + 1,
      );
    }
    const categoriesTop = [...scoreCategorie.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    const parCategories = candidats
      .filter((l) => categoriesTop.includes(l.categorie))
      .sort(
        (a, b) =>
          (scoreCategorie.get(b.categorie) ?? 0) -
          (scoreCategorie.get(a.categorie) ?? 0),
      )
      .slice(0, 6)
      .map((l) => ({
        id: l.id,
        titre: l.titre,
        auteur: l.auteur,
        categorie: l.categorie,
        couverture: l.couverture,
      }));

    // ---- Algorithme 2 : TF-IDF ----
    const parSimilarite = this.recommanderTfIdf(
      tousLivres,
      livresEmpruntes,
      candidats,
    );

    return {
      aDesRecommandations: parCategories.length + parSimilarite.length > 0,
      raison: 'Basé sur votre historique de lecture',
      categoriesFavorites: categoriesTop.slice(0, 3),
      parCategories,
      parSimilarite,
    };
  }

  /** Cœur TF-IDF : construit les vecteurs, le profil utilisateur, puis classe par cosinus. */
  private recommanderTfIdf(
    corpus: Livre[],
    historique: Livre[],
    candidats: Livre[],
  ) {
    const N = corpus.length;
    if (N === 0) return [];

    // Fréquence documentaire (df) de chaque terme
    const df = new Map<string, number>();
    const tokensParLivre = new Map<string, string[]>();
    for (const l of corpus) {
      const tokens = this.documentLivre(l);
      tokensParLivre.set(l.id, tokens);
      for (const terme of new Set(tokens)) {
        df.set(terme, (df.get(terme) ?? 0) + 1);
      }
    }

    const idf = (terme: string) => Math.log(N / (df.get(terme) ?? 1)) + 1;

    // Vecteur TF-IDF d'un livre
    const vecteur = (id: string): Vecteur => {
      const tokens = tokensParLivre.get(id) ?? [];
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      const v: Vecteur = new Map();
      for (const [terme, count] of tf) {
        v.set(terme, (count / tokens.length) * idf(terme));
      }
      return v;
    };

    // Profil utilisateur = somme des vecteurs de son historique
    const profil: Vecteur = new Map();
    for (const l of historique) {
      for (const [terme, poids] of vecteur(l.id)) {
        profil.set(terme, (profil.get(terme) ?? 0) + poids);
      }
    }

    return candidats
      .map((l) => ({
        id: l.id,
        titre: l.titre,
        auteur: l.auteur,
        categorie: l.categorie,
        couverture: l.couverture,
        score: Number(this.cosinus(profil, vecteur(l.id)).toFixed(4)),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  /** Livres les plus empruntés (fallback pour les nouveaux utilisateurs). */
  private async populaires(limite: number) {
    const emprunts = await this.prisma.emprunt.findMany({
      include: { exemplaire: { include: { livre: true } } },
    });
    const compte = new Map<string, { livre: Livre; n: number }>();
    for (const e of emprunts) {
      const l = e.exemplaire.livre;
      const item = compte.get(l.id) ?? { livre: l, n: 0 };
      item.n++;
      compte.set(l.id, item);
    }
    return [...compte.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, limite)
      .map(({ livre, n }) => ({
        id: livre.id,
        titre: livre.titre,
        auteur: livre.auteur,
        categorie: livre.categorie,
        couverture: livre.couverture,
        emprunts: n,
      }));
  }
}
