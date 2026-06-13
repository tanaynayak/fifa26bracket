# [World Cup 26 Bracket](https://fifa26bracket.vercel.app/#)

A mobile- and laptop-friendly World Cup 2026 bracket predictor: rank the groups,
pick the 8 best third-placed teams, build the knockout tree, then save it,
compare with friends in a league, and export a shareable infographic.

Built with Vite + React + TypeScript + Tailwind. Backend is **Supabase**
(Postgres + Auth). The app runs fully in **local guest mode** when Supabase isn't
configured, so it deploys and previews without any backend.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173  (guest mode, no backend needed)
```

## Features

- **Group stage** — drag to rank each of the 12 groups.
- **Best third-placed** — choose 8 of 12; they're slotted into the Round of 32
  per the official allowed-group rules.
- **Knockout** — full bracket; tap to advance teams to a champion.
- **Accounts** — Google sign-in; your bracket auto-saves to the cloud.
- **Leagues** — create a league, share its code, and view friends' brackets.
- **Share** — export a designed PNG infographic (native share / copy / download).

## Deploy to Vercel

1. Push this repo to GitHub and **Import** it in Vercel. Framework preset: **Vite**
   (build `npm run build`, output `dist`). `vercel.json` already handles SPA
   routing.
2. Add the two env vars below (Vercel → Project → Settings → Environment Variables).
3. Redeploy.

Without the env vars the site still works — just in guest mode (no accounts).

## Backend setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. **Database:** open SQL Editor → paste and run [`supabase/schema.sql`](supabase/schema.sql).
   It creates the `profiles`, `brackets`, `leagues`, `league_members` tables with
   row-level security and the auto-profile trigger.
3. **Google auth:** Dashboard → Authentication → Providers → **Google** → enable,
   and add your Google OAuth client ID/secret
   ([Google Cloud Console](https://console.cloud.google.com) → OAuth consent +
   credentials). Set the authorized redirect URI to
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
4. **Allowed URLs:** Authentication → URL Configuration → add your Vercel domain
   (and `http://localhost:5173`) to Site URL / redirect allow-list.
5. **Env vars** (`.env.local` locally, Vercel settings in prod):

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```

   (Project Settings → API.) The anon key is safe to expose; data is protected by
   the row-level-security policies in the schema.

## Brand assets

Drop the official transparent emblem at `public/brand/emblem.png` to show it in
the header (a custom "26" mark is used as a fallback). See
[`public/brand/README.md`](public/brand/README.md). The FIFA World Cup 26™ emblem
is trademarked — only use it if your deployment is licensed/permitted.

## Data model

Each user has one `brackets` row holding a JSON blob
(`{ standings, thirdQualifiers, picks }`). Leagues are a code + membership table;
RLS lets league co-members read each other's brackets (and nobody else's).
