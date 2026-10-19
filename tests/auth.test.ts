import { describe, expect, it } from "vitest";
import { authErrorMessage, safeNext } from "@/lib/auth";
import { en } from "@/lib/i18n/en";

describe("safeNext", () => {
  it("keeps paths on this site", () => {
    expect(safeNext("/map")).toBe("/map");
    expect(safeNext("/lesson/colors?x=1")).toBe("/lesson/colors?x=1");
  });

  it("refuses anything that could leave the site", () => {
    for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "/x\\y", "javascript:alert(1)", "map", "/\nx", ""]) {
      expect(safeNext(value), value).toBe("/");
    }
    expect(safeNext(null, "/map")).toBe("/map");
  });
});

describe("authErrorMessage", () => {
  it("maps known codes to friendly text", () => {
    expect(authErrorMessage("invalid_credentials", en)).toBe(en.auth.wrong);
    expect(authErrorMessage("email_not_confirmed", en)).toBe(en.auth.notConfirmed);
    expect(authErrorMessage("over_request_rate_limit", en)).toBe(en.auth.tooMany);
  });

  it("never shows unknown server errors", () => {
    expect(authErrorMessage("something_new", en)).toBe(en.common.errorGeneric);
    expect(authErrorMessage(undefined, en)).toBe(en.common.errorGeneric);
  });
});
