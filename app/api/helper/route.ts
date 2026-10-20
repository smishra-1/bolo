import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { z } from "zod";
import { chatModel } from "@/lib/ai/model";
import { helperSystemPrompt } from "@/lib/ai/prompts";
import { apiError, guardAiRequest, readJson } from "@/lib/api";
import { NATIVE_LANGS, TARGET_LANGS } from "@/lib/languages";

const bodySchema = z.object({
  target: z.enum(TARGET_LANGS).nullable(),
  native: z.enum(NATIVE_LANGS),
  level: z.number().int().min(1).max(3),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1000) }))
    .min(1)
    .max(20)
    .refine((list) => list.at(-1)?.role === "user"),
});

/** The floating "Ask Bolo" helper: streams a short plain-text answer. */
export async function POST(request: Request) {
  const body = await readJson(request, bodySchema);
  if (!body) return apiError("bad_request");

  const guard = await guardAiRequest(request);
  if (guard instanceof Response) return guard;

  try {
    const result = streamText({
      model: chatModel(),
      system: helperSystemPrompt(body.target, body.native, body.level),
      messages: body.messages,
      maxOutputTokens: 400,
      abortSignal: request.signal,
      onError: ({ error }) => console.error("helper stream failed", error),
    });
    return createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) });
  } catch (error) {
    console.error("helper failed", error);
    return apiError("failed");
  }
}
