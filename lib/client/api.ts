import type { Messages } from "../i18n";

export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(body?.error ?? "failed");
  }
  return (await response.json()) as T;
}

export async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  return handle<T>(response);
}

export async function transcribeAudio(audio: Blob, lang: string): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, "speech");
  form.append("lang", lang);
  const response = await fetch("/api/transcribe", { method: "POST", body: form });
  return (await handle<{ text: string }>(response)).text;
}

/** A friendly message for an API failure, in the learner's language. */
export function errorMessage(error: unknown, m: Messages): string {
  if (error instanceof ApiError) {
    if (error.code === "quota") return m.common.quota;
    if (error.code === "not_configured") return m.common.setupNeeded;
  }
  return m.common.errorGeneric;
}
