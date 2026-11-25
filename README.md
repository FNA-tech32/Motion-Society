# Motion Society

Motion Society is a tennis-first training and nutrition dashboard for home workouts (pull-up bar, dumbbells, and bodyweight). It reads the daily check-in and builds a session that favors speed and explosiveness on court, with a lean athletic physique alongside that.

The sidebar and mobile header show the Motion Society name. A footer on every page lists the studio address, phone numbers, and email addresses.

> Not medical advice. The plans are technique-first and youth-safe, and they spare the legs on tennis days. Stop on pain and loop in a parent, coach, or doctor.

## Pages

- **Overview** (`/`) — readiness, today’s session type, streak, calorie and protein targets, the session card, a fuel snapshot, and movement balance.
- **Training** (`/training`) — the full session (warm-up, main work, cool-down), easier options, and a link to today’s check-in.
- **Check-in** (`/checkin`) — tennis (none, practice, or match), energy, sleep, soreness, time available, and a note. Saving it rebuilds today’s plan.
- **Nutrition** (`/nutrition`) — daily fuel targets, meals, and water.
- **Progress** (`/progress`) — consistency, readiness trend, session mix, movement balance, fuel split, and weekly volume.
- **Coach** (`/coach`) — tell the coach a result, a feeling, or a goal; ask it to research a plan; or send a training video.
- **Memory** (`/memory`) — facts the app already knows, plus notes you or the coach add.
- **Your week** (`/week`) — recent sessions, newest first.
- **Settings** (`/settings`) — connect an Anthropic key, edit the profile, and reset data on this device. `/onboarding` redirects here.

## Contact

These details appear in the footer on every page:

- **Address:** 9 Court Avenue, Indiranagar, Bengaluru 560038
- **Phone:** +91 80 4120 6600
- **Alternative phone:** +91 80 4120 6601
- **Email:** hello@motionsociety.fit
- **Alternative email:** support@motionsociety.fit

The alternative phone and email are for follow-up when the main line is busy.

## How the plans are built

1. **Training engine** (`src/lib/engine`) — turns the profile, daily check-in, and calendar into targets and a session from the exercise library (`src/lib/exercises/library.ts`). It runs without API keys and keeps load and volume inside safe bounds.
2. **Coach** — polishes cues and can remember what you say. It does not invent movements or raise the load the engine set.

Profile, check-ins, plans, and metrics stay in the browser (`localStorage`) and work offline. Cloud sync and deploy steps are in `SETUP.md`.

## Stack

Next.js 16 · React 19 · Tailwind v4 · TypeScript · Framer Motion · GSAP · Lenis · anime.js · Vitest.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No API key is required for training, nutrition, and progress.

## Scripts

- `npm run dev` starts the development server
- `npm run build` creates a production build
- `npm start` serves the production build
- `npm test` runs the engine unit tests
- `npm run lint` runs ESLint
