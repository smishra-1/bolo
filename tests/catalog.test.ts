import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LANGS, LANG_CODES, learnableFor } from "@/lib/languages";
import { UNITS, tierStart } from "@/lib/units";

describe("languages", () => {
  it("describes every language", () => {
    expect(new Set(LANG_CODES).size).toBe(LANG_CODES.length);
    for (const code of LANG_CODES) {
      const lang = LANGS[code];
      expect(lang.endonym, code).toBeTruthy();
      expect(lang.english, code).toBeTruthy();
      expect(lang.greeting, code).toBeTruthy();
      expect(lang.buddy, code).toBeTruthy();
      expect(lang.card, code).toBeTruthy();
      expect(lang.speech.startsWith(code), code).toBe(true);
    }
  });

  it("offers every other language to learn", () => {
    expect(learnableFor("hi")).toHaveLength(LANG_CODES.length - 1);
    expect(learnableFor("hi")).not.toContain("hi");
  });

  it("matches the list the database accepts", () => {
    const sql = readFileSync("supabase/schema.sql", "utf8");
    const body = sql.match(/supported_langs\(\)[\s\S]*?array\[([^\]]+)\]/)![1];
    const inDb = [...body.matchAll(/'(\w+)'/g)].map((m) => m[1]);
    expect(inDb).toEqual([...LANG_CODES]);
  });
});

describe("units", () => {
  it("has unique ids the database accepts", () => {
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(UNITS.length);
    for (const unit of UNITS) expect(unit.id).toMatch(/^[a-z_]{1,32}$/);
  });

  it("gives every unit six topic words", () => {
    for (const unit of UNITS) expect(unit.seeds, unit.id).toHaveLength(6);
  });

  it("orders units by tier, with every tier present", () => {
    const tiers: number[] = UNITS.map((u) => u.tier);
    expect(tiers).toEqual([...tiers].sort());
    expect(new Set(tiers)).toEqual(new Set([1, 2, 3]));
    expect([tierStart(1), tierStart(2), tierStart(3)]).toEqual([0, 8, 16]);
  });
});
