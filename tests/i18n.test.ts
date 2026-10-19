import { describe, expect, it } from "vitest";
import { UI_LOCALES, fmt, getMessages } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";
import { NATIVE_LANGS } from "@/lib/languages";
import { UNITS } from "@/lib/units";

function shape(value: unknown, path = ""): string[] {
  if (typeof value === "string") return [`${path}:string`];
  if (Array.isArray(value)) return [`${path}:array(${value.length})`];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => shape(v, `${path}.${k}`));
}

function placeholders(value: unknown, path = ""): string[] {
  if (typeof value === "string") return [...value.matchAll(/\{(\w+)\}/g)].map((m) => `${path}{${m[1]}}`).sort();
  if (Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => placeholders(v, `${path}.${k}`));
}

describe("dictionaries", () => {
  for (const [locale, messages] of Object.entries(UI_LOCALES)) {
    it(`${locale} has the same keys as English`, () => {
      expect(shape(messages)).toEqual(shape(en));
    });

    it(`${locale} uses the same placeholders as English`, () => {
      expect(placeholders(messages)).toEqual(placeholders(en));
    });

    it(`${locale} has no empty strings`, () => {
      expect(JSON.stringify(messages)).not.toContain('""');
    });
  }

  it("names every unit and language", () => {
    for (const unit of UNITS) expect(en.units[unit.id]).toBeTruthy();
    for (const lang of NATIVE_LANGS) expect(en.languages[lang]).toBeTruthy();
  });

  it("falls back to English for languages without a UI translation", () => {
    expect(getMessages("ja")).toBe(en);
    expect(getMessages("hi")).toBe(UI_LOCALES.hi);
  });
});

describe("fmt", () => {
  it("fills known placeholders and leaves others", () => {
    expect(fmt("{n} of {total} {x}", { n: 1, total: 5 })).toBe("1 of 5 {x}");
  });

  it("does not read inherited properties", () => {
    expect(fmt("{toString}", {})).toBe("{toString}");
  });
});
