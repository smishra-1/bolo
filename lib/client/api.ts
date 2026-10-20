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

/** Posts JSON and calls `onText` with the reply so far as a plain-text stream arrives. */
export async function postJsonStream(path: string, body: unknown, onText: (text: string) => void, signal?: AbortSignal): Promise<string> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) return handle<never>(response);
  if (!response.body) throw new ApiError("failed");
  let text = "";
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += value;
    onText(text);
  }
  if (!text.trim()) throw new ApiError("failed");
  return text;
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
