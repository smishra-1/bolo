import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { z } from "zod";
import { isAiConfigured } from "./ai/model";
import { createSupabaseServerClient } from "./supabase/server";

export type ApiErrorCode = "bad_request" | "unauthorized" | "forbidden" | "quota" | "not_configured" | "failed";

const STATUS: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  quota: 429,
  not_configured: 503,
  failed: 502,
};

export function apiError(code: ApiErrorCode): Response {
  return Response.json({ error: code }, { status: STATUS[code] });
}

/**
 * Rejects cross-site requests. Browsers always send Origin on POST, so a
 * missing or foreign Origin means the call did not come from this app.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const DAILY_LIMIT = Math.min(1000, Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 200));

type Learner = { supabase: SupabaseClient; user: User };

/** Same-origin request from a signed-in learner, or a Response to return. */
export async function requireLearner(request: Request): Promise<Learner | Response> {
  if (!isSameOrigin(request)) return apiError("forbidden");

  let supabase: SupabaseClient;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return apiError("not_configured");
  }

  const { data, error } = await supabase.auth.getUser();
  // Only email-and-password accounts may use the app.
  if (error || !data.user || data.user.is_anonymous) return apiError("unauthorized");
  return { supabase, user: data.user };
}

/** Counts one AI call against today's limit. Returns a Response when it must stop. */
export async function chargeAiQuota(supabase: SupabaseClient): Promise<Response | null> {
  if (!isAiConfigured()) return apiError("not_configured");
  const quota = await supabase.rpc("consume_ai_quota", { p_limit: DAILY_LIMIT });
  if (quota.error) {
    console.error("consume_ai_quota failed", quota.error.message);
    return apiError("failed");
  }
  return quota.data === true ? null : apiError("quota");
}

/** Learner check plus one unit of AI quota, for routes that always call the model. */
export async function guardAiRequest(request: Request): Promise<Learner | Response> {
  const learner = await requireLearner(request);
  if (learner instanceof Response) return learner;
  const stop = await chargeAiQuota(learner.supabase);
  return stop ?? learner;
}

/** Parses a JSON body against a schema. Returns null if it is missing or invalid. */
export async function readJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T> | null> {
  if (!request.headers.get("content-type")?.includes("application/json")) return null;
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 32_000) return null;
  try {
    const parsed = schema.safeParse(await request.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
