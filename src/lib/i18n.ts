import es from "@/dictionaries/es.json";
import en from "@/dictionaries/en.json";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
const defaultLocale: Locale = "es";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export type Dictionary = typeof es;

const dictionaries: Record<Locale, Dictionary> = { es, en };

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];

/**
 * Picks the best supported locale from an Accept-Language header
 * (e.g. "en-US,en;q=0.9,es;q=0.8"), honoring q-values. Falls back to Spanish.
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? parseFloat(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (hasLocale(base)) return base;
  }
  return defaultLocale;
}
