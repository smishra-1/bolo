import { generateSpeech } from "ai";
import { z } from "zod";
import { speechModel } from "@/lib/ai/model";
import { apiError, guardAiRequest, readJson } from "@/lib/api";
import { LANGS, NATIVE_LANGS } from "@/lib/languages";

const bodySchema = z.object({
  text: z.string().trim().min(1).max(500),
  // NATIVE_LANGS includes every language Bolo teaches.
  lang: z.enum(NATIVE_LANGS),
});

/** Reads text aloud with a cloud voice, for devices that have no voice of their own for the language. */
export async function POST(request: Request) {
  const body = await readJson(request, bodySchema);
  if (!body) return apiError("bad_request");

  const guard = await guardAiRequest(request);
  if (guard instanceof Response) return guard;

  try {
    const { audio } = await generateSpeech({
      model: speechModel(),
      text: body.text,
      language: LANGS[body.lang].speech,
    });
    return new Response(new Blob([new Uint8Array(audio.uint8Array)], { type: audio.mediaType }), {
      headers: { "Content-Type": audio.mediaType, "Cache-Control": "private, max-age=86400" },
    });
  } catch (error) {
    console.error("speech failed", error);
    return apiError("failed");
  }
}
