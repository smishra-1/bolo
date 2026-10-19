import { generateText, Output } from "ai";
import { z } from "zod";
import { chatModel } from "@/lib/ai/model";
import { lessonPrompt } from "@/lib/ai/prompts";
import { apiError, chargeAiQuota, readJson, requireLearner } from "@/lib/api";
import { NATIVE_LANGS, TARGET_LANGS } from "@/lib/languages";
import { lessonContentSchema, normalizeLessonContent, type LessonContent } from "@/lib/lesson";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { UNITS, getUnit } from "@/lib/units";

const bodySchema = z
  .object({
    target: z.enum(TARGET_LANGS),
    native: z.enum(NATIVE_LANGS),
    unit: z.enum(UNITS.map((u) => u.id) as [string, ...string[]]),
    level: z.number().int().min(1).max(3),
  })
  .refine((b) => b.target !== b.native);

function lessonCache() {
  try {
    return getSupabaseAdmin();
  } catch {
    return null; // No secret key: lessons are generated every time.
  }
}

export async function POST(request: Request) {
  const learner = await requireLearner(request);
  if (learner instanceof Response) return learner;

  const body = await readJson(request, bodySchema);
  if (!body) return apiError("bad_request");
  const unit = getUnit(body.unit)!;
  const key = { target_lang: body.target, native_lang: body.native, unit_id: unit.id, level: body.level };

  const cache = lessonCache();
  if (cache) {
    const { data } = await cache.from("lessons").select("content").match(key).maybeSingle();
    const cached = data ? lessonContentSchema.safeParse(data.content) : null;
    if (cached?.success) return Response.json({ lesson: cached.data });
  }

  const stop = await chargeAiQuota(learner.supabase);
  if (stop) return stop;

  let lesson: LessonContent | null;
  try {
    const { output } = await generateText({
      model: chatModel(),
      output: Output.object({ schema: lessonContentSchema }),
      ...lessonPrompt(body.target, body.native, unit.seeds, body.level),
    });
    lesson = normalizeLessonContent(output);
  } catch (error) {
    console.error("lesson generation failed", error);
    return apiError("failed");
  }
  if (!lesson) return apiError("failed");

  if (cache) {
    const { error } = await cache.from("lessons").upsert({ ...key, content: lesson }, { onConflict: "target_lang,native_lang,unit_id,level", ignoreDuplicates: true });
    if (error) console.error("lesson cache write failed", error.message);
  }

  return Response.json({ lesson });
}
