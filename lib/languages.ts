export const TARGET_LANGS = ["es", "fr", "de", "ja", "hi"] as const;
export const NATIVE_LANGS = ["en", "hi", "es", "fr", "de", "ja"] as const;

export type TargetLang = (typeof TARGET_LANGS)[number];
export type NativeLang = (typeof NATIVE_LANGS)[number];
export type AnyLang = TargetLang | NativeLang;

type LangInfo = {
  /** Short badge shown on cards, e.g. "ES". */
  badge: string;
  /** The language's name written in itself. */
  endonym: string;
  /** Name in English, used in AI prompts. */
  english: string;
  /** BCP 47 tag for speech synthesis and recognition. */
  speech: string;
  /** Short greeting shown on the picker card. */
  greeting: string;
  /** Card colour class (Tailwind). */
  card: string;
  /** Name of the chat buddy for this language. */
  buddy: string;
};

export const LANGS: Record<AnyLang, LangInfo> = {
  en: { badge: "EN", endonym: "English", english: "English", speech: "en-US", greeting: "Hello!", card: "bg-sky-100 border-sky-400", buddy: "Sam" },
  es: { badge: "ES", endonym: "Español", english: "Spanish", speech: "es-ES", greeting: "¡Hola!", card: "bg-orange-100 border-orange-400", buddy: "Paco" },
  fr: { badge: "FR", endonym: "Français", english: "French", speech: "fr-FR", greeting: "Bonjour !", card: "bg-sky-100 border-sky-400", buddy: "Amélie" },
  de: { badge: "DE", endonym: "Deutsch", english: "German", speech: "de-DE", greeting: "Hallo!", card: "bg-yellow-100 border-yellow-400", buddy: "Lena" },
  ja: { badge: "JP", endonym: "日本語", english: "Japanese", speech: "ja-JP", greeting: "こんにちは!", card: "bg-pink-100 border-pink-400", buddy: "Yuki" },
  hi: { badge: "IN", endonym: "हिन्दी", english: "Hindi", speech: "hi-IN", greeting: "नमस्ते!", card: "bg-green-100 border-green-400", buddy: "Aarav" },
};

export function isTargetLang(value: unknown): value is TargetLang {
  return typeof value === "string" && (TARGET_LANGS as readonly string[]).includes(value);
}

export function isNativeLang(value: unknown): value is NativeLang {
  return typeof value === "string" && (NATIVE_LANGS as readonly string[]).includes(value);
}

/** Languages a learner can pick, given the language they already speak. */
export function learnableFor(native: NativeLang): TargetLang[] {
  return TARGET_LANGS.filter((lang) => lang !== native);
}
