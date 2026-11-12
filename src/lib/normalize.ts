/**
 * Normalizes a search string for accent-insensitive matching.
 *
 * Uses Unicode NFD decomposition to separate base letters from combining
 * diacritic marks (U+0300–U+036F), then strips the marks and lowercases.
 *
 * "Maíz" → "maiz"   "Ñoño" → "nono"   "Çà" → "ca"
 *
 * This must produce the same output as the SQL `normalize_search()` function
 * in 012_unaccent_search.sql, which uses translate() on the same character set.
 */
export function normalizeSearch(str: string): string {
  return str
    .normalize('NFD')                // decompose: "á" → "a" + U+0301
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .toLowerCase()
}
