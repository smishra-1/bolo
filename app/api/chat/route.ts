import { generateText, Output } from "ai";
import { z } from "zod";
import { chatModel } from "@/lib/ai/model";
import { chatSystemPrompt } from "@/lib/ai/prompts";
import { apiError, guardAiRequest, readJson } from "@/lib/api";
import { NATIVE_LANGS, TARGET_LANGS } from "@/lib/languages";

const bodySchema = z.object({
  target: z.enum(TARGET_LANGS),
  native: z.enum(NATIVE_LANGS),
  level: z.number().int().min(1).max(3),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(500) }))
    .max(20),
});

const replySchema = z.object({
  reply: z.string(),
  translation: z.string(),
  suggestions: z.array(z.object({ text: z.string(), translation: z.string() })),
});

export async function POST(request: Request) {
  const body = await readJson(request, bodySchema);
  if (!body) return apiError("bad_request");

  const guard = await guardAiRequest(request);
  if (guard instanceof Response) return guard;

  // An empty conversation asks the buddy to say hello first.
  const messages = body.messages.length > 0 ? body.messages : [{ role: "user" as const, content: "(The learner opened the chat. Greet them and ask their name.)" }];

  try {
    const { output } = await generateText({
      model: chatModel(),
      system: chatSystemPrompt(body.target, body.native, body.level),
      messages,
      output: Output.object({ schema: replySchema }),
      maxOutputTokens: 600,
    });
    return Response.json({
      reply: output.reply.trim().slice(0, 500),
      translation: output.translation.trim().slice(0, 500),
      suggestions: output.suggestions.slice(0, 3).map((s) => ({ text: s.text.trim().slice(0, 200), translation: s.translation.trim().slice(0, 200) })),
    });
  } catch (error) {
    console.error("chat failed", error);
    return apiError("failed");
  }
}
