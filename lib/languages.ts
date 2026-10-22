/**
 * Every language Bolo teaches is also one a learner can speak, so the two
 * lists are the same. They stay separate names to keep call sites readable.
 * Keep in sync with public.supported_langs() in supabase/schema.sql.
 */
export const LANG_CODES = [
  "en", "es", "fr", "de", "it", "pt", "nl", "sv", "pl", "ru", "el", "tr",
  "ja", "ko", "zh", "vi", "th", "id", "ar", "sw",
  "hi", "bn", "ta", "te", "mr", "gu", "pa", "ur", "kn", "ml",
] as const;

export const TARGET_LANGS = LANG_CODES;
export const NATIVE_LANGS = LANG_CODES;

export type AnyLang = (typeof LANG_CODES)[number];
export type TargetLang = AnyLang;
export type NativeLang = AnyLang;

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
  /** Name of the chat buddy for this language. */
  buddy: string;
  /** Right-to-left script. */
  rtl?: true;
};

const INFO: Record<AnyLang, LangInfo> = {
  en: { badge: "EN", endonym: "English", english: "English", speech: "en-US", greeting: "Hello!", buddy: "Sam" },
  es: { badge: "ES", endonym: "Español", english: "Spanish", speech: "es-ES", greeting: "¡Hola!", buddy: "Paco" },
  fr: { badge: "FR", endonym: "Français", english: "French", speech: "fr-FR", greeting: "Bonjour !", buddy: "Amélie" },
  de: { badge: "DE", endonym: "Deutsch", english: "German", speech: "de-DE", greeting: "Hallo!", buddy: "Lena" },
  it: { badge: "IT", endonym: "Italiano", english: "Italian", speech: "it-IT", greeting: "Ciao!", buddy: "Giulia" },
  pt: { badge: "PT", endonym: "Português", english: "Portuguese", speech: "pt-BR", greeting: "Olá!", buddy: "Tiago" },
  nl: { badge: "NL", endonym: "Nederlands", english: "Dutch", speech: "nl-NL", greeting: "Hallo!", buddy: "Daan" },
  sv: { badge: "SV", endonym: "Svenska", english: "Swedish", speech: "sv-SE", greeting: "Hej!", buddy: "Elsa" },
  pl: { badge: "PL", endonym: "Polski", english: "Polish", speech: "pl-PL", greeting: "Cześć!", buddy: "Kasia" },
  ru: { badge: "RU", endonym: "Русский", english: "Russian", speech: "ru-RU", greeting: "Привет!", buddy: "Misha" },
  el: { badge: "EL", endonym: "Ελληνικά", english: "Greek", speech: "el-GR", greeting: "Γεια σου!", buddy: "Nikos" },
  tr: { badge: "TR", endonym: "Türkçe", english: "Turkish", speech: "tr-TR", greeting: "Merhaba!", buddy: "Elif" },
  ja: { badge: "JP", endonym: "日本語", english: "Japanese", speech: "ja-JP", greeting: "こんにちは!", buddy: "Yuki" },
  ko: { badge: "KR", endonym: "한국어", english: "Korean", speech: "ko-KR", greeting: "안녕!", buddy: "Min-jun" },
  zh: { badge: "CN", endonym: "中文", english: "Mandarin Chinese", speech: "zh-CN", greeting: "你好!", buddy: "Mei" },
  vi: { badge: "VN", endonym: "Tiếng Việt", english: "Vietnamese", speech: "vi-VN", greeting: "Xin chào!", buddy: "Lan" },
  th: { badge: "TH", endonym: "ไทย", english: "Thai", speech: "th-TH", greeting: "สวัสดี!", buddy: "Somchai" },
  id: { badge: "ID", endonym: "Bahasa Indonesia", english: "Indonesian", speech: "id-ID", greeting: "Halo!", buddy: "Sari" },
  ar: { badge: "AR", endonym: "العربية", english: "Arabic", speech: "ar-SA", greeting: "مرحبا!", buddy: "Layla", rtl: true },
  sw: { badge: "SW", endonym: "Kiswahili", english: "Swahili", speech: "sw-KE", greeting: "Jambo!", buddy: "Zawadi" },
  hi: { badge: "IN", endonym: "हिन्दी", english: "Hindi", speech: "hi-IN", greeting: "नमस्ते!", buddy: "Aarav" },
  bn: { badge: "BN", endonym: "বাংলা", english: "Bengali", speech: "bn-IN", greeting: "নমস্কার!", buddy: "Riya" },
  ta: { badge: "TA", endonym: "தமிழ்", english: "Tamil", speech: "ta-IN", greeting: "வணக்கம்!", buddy: "Kavin" },
  te: { badge: "TE", endonym: "తెలుగు", english: "Telugu", speech: "te-IN", greeting: "నమస్కారం!", buddy: "Sneha" },
  mr: { badge: "MR", endonym: "मराठी", english: "Marathi", speech: "mr-IN", greeting: "नमस्कार!", buddy: "Omkar" },
  gu: { badge: "GU", endonym: "ગુજરાતી", english: "Gujarati", speech: "gu-IN", greeting: "નમસ્તે!", buddy: "Meera" },
  pa: { badge: "PA", endonym: "ਪੰਜਾਬੀ", english: "Punjabi", speech: "pa-IN", greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ!", buddy: "Jasleen" },
  ur: { badge: "UR", endonym: "اردو", english: "Urdu", speech: "ur-PK", greeting: "السلام علیکم!", buddy: "Zain", rtl: true },
  kn: { badge: "KN", endonym: "ಕನ್ನಡ", english: "Kannada", speech: "kn-IN", greeting: "ನಮಸ್ಕಾರ!", buddy: "Vinay" },
  ml: { badge: "ML", endonym: "മലയാളം", english: "Malayalam", speech: "ml-IN", greeting: "നമസ്കാരം!", buddy: "Anjali" },
};

/** Card colours (Tailwind needs whole class names), handed out in order. */
const CARD_COLOURS = [
  "bg-sky-100 border-sky-400",
  "bg-orange-100 border-orange-400",
  "bg-yellow-100 border-yellow-400",
  "bg-pink-100 border-pink-400",
  "bg-green-100 border-green-400",
  "bg-violet-100 border-violet-400",
  "bg-rose-100 border-rose-400",
  "bg-teal-100 border-teal-400",
];

export const LANGS = Object.fromEntries(
  LANG_CODES.map((code, i) => [code, { ...INFO[code], card: CARD_COLOURS[i % CARD_COLOURS.length] }]),
) as Record<AnyLang, LangInfo & { /** Card colour class (Tailwind). */ card: string }>;

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
