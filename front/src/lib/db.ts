import Dexie, { type EntityTable } from 'dexie';
import type { LivreListItem } from '@/lib/types';

/** Base locale (IndexedDB) pour le mode hors-ligne. */
const db = new Dexie('bibliosmart') as Dexie & {
  livres: EntityTable<LivreListItem, 'id'>;
};

db.version(1).stores({
  livres: 'id, titre, auteur, categorie',
});

/** Met en cache les livres consultés (accumulés pour le mode hors-ligne). */
export async function cacheLivres(livres: LivreListItem[]): Promise<void> {
  try {
    await db.livres.bulkPut(livres);
  } catch {
    // IndexedDB indisponible (navigation privée, etc.) → on ignore
  }
}

/** Récupère le catalogue depuis le cache local. */
export async function livresDepuisCache(): Promise<LivreListItem[]> {
  try {
    return await db.livres.toArray();
  } catch {
    return [];
  }
}
