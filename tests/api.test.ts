import { describe, expect, it } from "vitest";
import { z } from "zod";
import { isSameOrigin, readJson } from "@/lib/api";

const post = (headers: Record<string, string>, body?: string) =>
  new Request("http://localhost:3000/api/x", { method: "POST", headers, body });

describe("isSameOrigin", () => {
  it("accepts requests from this host", () => {
    expect(isSameOrigin(post({ origin: "http://localhost:3000", host: "localhost:3000" }))).toBe(true);
  });

  it("rejects missing, foreign or malformed origins", () => {
    expect(isSameOrigin(post({ host: "localhost:3000" }))).toBe(false);
    expect(isSameOrigin(post({ origin: "https://evil.example", host: "localhost:3000" }))).toBe(false);
    expect(isSameOrigin(post({ origin: "not a url", host: "localhost:3000" }))).toBe(false);
  });
});

describe("readJson", () => {
  const schema = z.object({ text: z.string().max(5) });

  it("parses a valid body", async () => {
    expect(await readJson(post({ "content-type": "application/json" }, '{"text":"hi"}'), schema)).toEqual({ text: "hi" });
  });

  it("rejects the wrong content type, bad JSON and invalid data", async () => {
    expect(await readJson(post({ "content-type": "text/plain" }, '{"text":"hi"}'), schema)).toBeNull();
    expect(await readJson(post({ "content-type": "application/json" }, "{"), schema)).toBeNull();
    expect(await readJson(post({ "content-type": "application/json" }, '{"text":"too long"}'), schema)).toBeNull();
  });
});
