/** Mots vides français/anglais fréquents, ignorés lors de l'analyse TF-IDF. */
const STOPWORDS = new Set([
  'le',
  'la',
  'les',
  'un',
  'une',
  'des',
  'de',
  'du',
  'et',
  'ou',
  'ni',
  'que',
  'qui',
  'quoi',
  'dont',
  'ce',
  'cet',
  'cette',
  'ces',
  'son',
  'sa',
  'ses',
  'leur',
  'leurs',
  'pour',
  'par',
  'sur',
  'sous',
  'dans',
  'avec',
  'sans',
  'en',
  'au',
  'aux',
  'plus',
  'moins',
  'tres',
  'the',
  'of',
  'and',
  'to',
  'in',
  'is',
  'it',
  'for',
  'on',
  'with',
  'edition',
  'tome',
  'vol',
  'volume',
]);

/** Supprime les accents (marques combinantes U+0300–U+036F) après normalisation NFD. */
function sansAccents(texte: string): string {
  return texte
    .normalize('NFD')
    .split('')
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code < 0x300 || code > 0x36f;
    })
    .join('');
}

/**
 * Découpe un texte en mots normalisés : minuscules, sans accents,
 * sans ponctuation, sans mots vides, longueur > 2.
 */
export function tokeniser(texte: string): string[] {
  return sansAccents(texte ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}
