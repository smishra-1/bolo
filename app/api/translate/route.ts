import { generateText, Output } from "ai";
import { z } from "zod";
import { chatModel } from "@/lib/ai/model";
import { translatePrompt } from "@/lib/ai/prompts";
import { apiError, guardAiRequest, readJson } from "@/lib/api";
import { NATIVE_LANGS } from "@/lib/languages";

const bodySchema = z.object({
  text: z.string().trim().min(1).max(500),
  // NATIVE_LANGS includes every language Bolo teaches.
  from: z.union([z.literal("auto"), z.enum(NATIVE_LANGS)]),
  to: z.enum(NATIVE_LANGS),
});

const resultSchema = z.object({
  translation: z.string(),
  romanization: z.string().nullable(),
  note: z.string().nullable(),
});

export async function POST(request: Request) {
  const body = await readJson(request, bodySchema);
  if (!body) return apiError("bad_request");

  const guard = await guardAiRequest(request);
  if (guard instanceof Response) return guard;

  try {
    const { output } = await generateText({
      model: chatModel(),
      system: translatePrompt(body.from, body.to),
      prompt: body.text,
      output: Output.object({ schema: resultSchema }),
      maxOutputTokens: 600,
    });
    return Response.json({
      translation: output.translation.trim().slice(0, 1000),
      romanization: output.romanization?.trim().slice(0, 1000) || null,
      note: output.note?.trim().slice(0, 300) || null,
    });
  } catch (error) {
    console.error("translate failed", error);
    return apiError("failed");
  }
}
