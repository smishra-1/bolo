import type { NativeLang } from "../languages";
import { en } from "./en";
import { es } from "./es";
import { hi } from "./hi";
import type { Messages } from "./types";

export type { Messages };

/** Interface languages with a full translation. Others fall back to English. */
export const UI_LOCALES = { en, hi, es } satisfies Record<string, Messages>;
export type UiLocale = keyof typeof UI_LOCALES;

export function uiLocaleFor(lang: NativeLang): UiLocale {
  return lang in UI_LOCALES ? (lang as UiLocale) : "en";
}

export function getMessages(lang: NativeLang): Messages {
  return UI_LOCALES[uiLocaleFor(lang)];
}

/** Fills `{name}` placeholders. Unknown placeholders are left as they are. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(vars, key) ? String(vars[key]) : match,
  );
}
