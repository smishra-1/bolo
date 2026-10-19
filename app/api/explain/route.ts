import { generateText } from "ai";
import { z } from "zod";
import { chatModel } from "@/lib/ai/model";
import { explainPrompt } from "@/lib/ai/prompts";
import { apiError, guardAiRequest, readJson } from "@/lib/api";
import { NATIVE_LANGS, TARGET_LANGS } from "@/lib/languages";

const bodySchema = z.object({
  target: z.enum(TARGET_LANGS),
  native: z.enum(NATIVE_LANGS),
  question: z.string().trim().min(1).max(300),
  correctAnswer: z.string().trim().min(1).max(160),
  learnerAnswer: z.string().trim().max(160).nullable(),
});

export async function POST(request: Request) {
  const body = await readJson(request, bodySchema);
  if (!body) return apiError("bad_request");

  const guard = await guardAiRequest(request);
  if (guard instanceof Response) return guard;

  try {
    const { text } = await generateText({
      model: chatModel(),
      maxOutputTokens: 200,
      ...explainPrompt(body.target, body.native, body),
    });
    return Response.json({ explanation: text.trim().slice(0, 600) });
  } catch (error) {
    console.error("explain failed", error);
    return apiError("failed");
  }
}
