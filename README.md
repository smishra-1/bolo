# Bolo 🦜

An AI-powered language buddy for young learners. You pick the language you speak and the one you want to learn. Bolo then gives you short, game-like lessons, checks your pronunciation as you speak, and helps you in real conversations with a chat buddy and a translator.

Learners sign in with an email and password (Supabase Auth). Built with Next.js 16, React 19, Tailwind CSS 4, Supabase, and the AI SDK. All model calls go through [Vercel AI Gateway](https://vercel.com/docs/ai-gateway): `openai/gpt-4.1-mini` for lessons, chat and translation, and `openai/whisper-1` for speech. You can change both with `AI_GATEWAY_MODEL` and `AI_GATEWAY_TRANSCRIBE_MODEL`.

## Screens

| Route | What it does |
| --- | --- |
| `/login` | Sign in or create an account with email and password |
| `/forgot-password`, `/reset-password` | Reset a forgotten password by email |
| `/` | Pick the language you speak and the language you want to learn |
| `/check` | A 5-question level check that gets easier or harder as you answer |
| `/map` | Learning map with stars, locked units, today's pick and the streak |
| `/lesson/[unit]` | Match, pick, listen, fill-the-blank and say-it steps, with Yay/Oops feedback and AI tips |
| `/chat` | Chat buddy with tap-to-translate and "Help me reply" |
| `/translate` | Instant translator with voice input and read-aloud |

The interface is translated into English, Hindi and Spanish (`lib/i18n`). Learners who speak French, German or Japanese see the English interface, but AI explanations still come in their own language.

## Setup

1. **Supabase**
   - Create a project.
   - Go to Authentication → Sign In / Providers. Make sure **Email** is on and **Allow anonymous sign-ins** is off.
   - Go to Authentication → URL Configuration. Set the Site URL, and add `http://localhost:3000/auth/callback` (and your production `/auth/callback`) to Redirect URLs. Confirmation and password-reset emails link there.
   - Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. If you already ran an earlier version, run [`supabase/migrations/002_email_accounts_only.sql`](supabase/migrations/002_email_accounts_only.sql) instead.
2. **Keys.** Fill in `.env.local` (see [`.env.example`](.env.example)):
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (server only, used for the shared lesson cache)
   - `AI_GATEWAY_API_KEY`, created in the Vercel dashboard under AI Gateway → API Keys. You don't need it on Vercel deployments, where the project's OIDC token is used.
3. Run it:

```bash
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev`: start the dev server
- `pnpm build`: production build
- `pnpm test`: unit tests (Vitest)
- `pnpm lint`: ESLint
- `pnpm typecheck`: TypeScript

## Security notes

- Every table has Row Level Security turned on, and learners can read only their own rows. Restrictive policies, the API routes and the app all refuse anonymous sessions.
- After sign-in, `?next=` redirects are limited to paths on this site (`safeNext`), so a link can't send learners elsewhere.
- Sign-in errors are shown as friendly messages, never raw server text. The password-reset form says the same thing whether or not the email has an account.
- Stars, points and learned words are written only by the `complete_lesson` database function, which checks its input and does the scoring itself.
- The AI routes check four things before calling a model: the request comes from the same origin, the learner is signed in, the input passes a Zod schema with size limits, and the learner is under their daily AI quota (`consume_ai_quota`, set with `AI_DAILY_LIMIT`).
- The secret key is used only in `lib/supabase/admin.ts`, which is marked `server-only`.
- Prompts tell the model to keep content child-safe and never to ask for personal details.
