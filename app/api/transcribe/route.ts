import { transcribe } from "ai";
import { transcriptionModel } from "@/lib/ai/model";
import { apiError, guardAiRequest } from "@/lib/api";
import { isNativeLang, isTargetLang } from "@/lib/languages";

const MAX_AUDIO_BYTES = 2_000_000; // ~30s of compressed speech
const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav"];

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (!length || length > MAX_AUDIO_BYTES + 10_000) return apiError("bad_request");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("bad_request");
  }
  const audio = form.get("audio");
  const lang = form.get("lang");
  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) return apiError("bad_request");
  if (!AUDIO_TYPES.includes(audio.type.split(";")[0])) return apiError("bad_request");
  if (lang !== null && !isTargetLang(lang) && !isNativeLang(lang)) return apiError("bad_request");

  const guard = await guardAiRequest(request);
  if (guard instanceof Response) return guard;

  try {
    const result = await transcribe({
      model: transcriptionModel(),
      audio: new Uint8Array(await audio.arrayBuffer()),
      providerOptions: lang ? { openai: { language: lang } } : undefined,
    });
    return Response.json({ text: result.text.trim().slice(0, 500) });
  } catch (error) {
    console.error("transcribe failed", error);
    return apiError("failed");
  }
}
