# Motion Society — cloud + deploy setup

Motion Society works fully offline with zero setup. Follow this to make it **persistent
across devices** (Supabase) and **live on the web** (Vercel), so it's there whenever
you're on the go. These steps need your accounts — do them yourself; nothing here
is automated for you.

## 1. Cloud sync — pick any free backend

The whole app state is a single JSON blob, so it doesn't need Postgres. `/api/state`
auto-detects whichever you configure (Upstash first, then Supabase, else local-only).

### Option A — Upstash Redis (recommended, free, easiest)

1. Create a database at **upstash.com** (free tier).
2. On the database page, copy the **REST URL** and **REST TOKEN**.
3. Put them in `.env.local`:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Restart `npm run dev`. Your data now saves to one key (`baseline:me`) and hydrates
   on any device. (On Vercel you can add Upstash via the Marketplace and it sets these
   env vars for you.)

### Option B — Supabase (alt, free)

1. Create a project at supabase.com → **SQL Editor** → run `supabase/migrations/0001_state.sql`.
2. **Project Settings → API**: copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`, and the
   **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, keep secret).

Other free options that would drop straight in (single JSON blob): **Neon** (serverless
Postgres), **Turso** (SQLite), **Vercel Blob**. Ask and I'll wire any of them.

> How it works: the cloud holds one JSON blob, synced by `/api/state` (server-only, REST,
> no client deps). Local storage stays the offline cache; the cloud is the source of truth
> on boot. No login, single user — just you.

## 2. Vercel (run it anywhere)

1. Push this repo to GitHub (ask first — no auto-push).
2. In Vercel, **Import Project** → pick the repo. Framework auto-detects Next.js.
3. Add the same env vars from step 1 under **Settings → Environment Variables**
   (plus `ANTHROPIC_API_KEY` if you want the AI server-side; otherwise paste it in
   the app under **Settings → Add AI**).
4. **Deploy.** Open the URL on your phone — it's the same you, same data.

## 3. Connect the AI

Settings → **Add AI** → paste your Anthropic key (`sk-ant-…`). Then use the "Tell me
anything" bar on Overview. It remembers what you say and auto-fills your dashboard.

## Env reference

See `.env.example`. Nothing is required to run locally; each block unlocks a feature.
