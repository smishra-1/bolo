import type { Messages } from "./i18n";

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Only allows redirects to a path on this site, so a crafted `?next=` link
 * cannot send a learner to another website after signing in.
 */
export function safeNext(value: string | null | undefined, fallback = "/start"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\") || [...value].some((c) => c.charCodeAt(0) < 0x20)) return fallback;
  return value;
}

/** Turns a Supabase auth error code into a friendly message. Never shows raw server text. */
export function authErrorMessage(code: string | undefined, m: Messages): string {
  switch (code) {
    case "invalid_credentials":
      return m.auth.wrong;
    case "email_not_confirmed":
      return m.auth.notConfirmed;
    case "weak_password":
      return m.auth.weak;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return m.auth.tooMany;
    default:
      return m.common.errorGeneric;
  }
}
