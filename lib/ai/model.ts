import "server-only";

// Every model call goes through Vercel AI Gateway: the AI SDK routes plain
// "provider/model" strings there. Model IDs must exist in
// https://ai-gateway.vercel.sh/v1/models.

/** Locally an AI Gateway API key; on Vercel the deployment's OIDC token works too. */
export const isAiConfigured = () => Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);

export const chatModel = () => process.env.AI_GATEWAY_MODEL || "openai/gpt-4.1-mini";

export const transcriptionModel = () => process.env.AI_GATEWAY_TRANSCRIBE_MODEL || "openai/whisper-1";
