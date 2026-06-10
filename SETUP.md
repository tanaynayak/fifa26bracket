# Setup — enable sign-in & deploy

Follow these in order. Total time ~20–30 min. The app already works without any
of this (local guest mode); this turns on **Google sign-in, cloud save, leagues,
and sharing** and puts it online.

You'll touch three dashboards: **Supabase** (database + auth), **Google Cloud**
(the Google login button), and **Vercel** (hosting).

---

## Part A — Supabase project & database

1. Go to <https://supabase.com> → **Start your project** → sign in with GitHub.
2. Click **New project**. Pick a name, a strong **database password** (save it
   somewhere), and a region near you. Wait ~2 min for it to provision.
3. In the left sidebar open **SQL Editor** → **New query**.
4. Open the file [`supabase/schema.sql`](supabase/schema.sql) from this repo,
   copy **all** of it, paste into the editor, and click **Run**.
   - You should see "Success. No rows returned." This created the tables
     (`profiles`, `brackets`, `leagues`, `league_members`), security rules, and
     the trigger that makes a profile when someone signs up.
5. Leave this tab open — you'll grab keys in Part D.

---

## Part B — Google OAuth credentials

This is the "Sign in with Google" button's backend.

1. Go to <https://console.cloud.google.com>. Create a project (top bar → project
   dropdown → **New Project**) if you don't have one. Select it.
2. Left menu → **APIs & Services** → **OAuth consent screen**:
   - User type: **External** → **Create**.
   - App name (e.g. "World Cup 26 Bracket"), your email for support & developer
     contact. Save and continue through the steps; you can skip scopes.
   - Under **Test users** you can add your own Google email so you can log in
     while the app is unverified. (Publishing later removes the test-user limit.)
3. Left menu → **APIs & Services** → **Credentials** → **Create credentials** →
   **OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins** — add:
     - `http://localhost:5173`
     - your Vercel URL once you have it (e.g. `https://your-app.vercel.app`)
   - **Authorized redirect URIs** — add **this exact Supabase callback**:
     - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
     - (Find `YOUR-PROJECT-REF` in Supabase → Project Settings → API → Project
       URL. It's the part before `.supabase.co`.)
   - Click **Create**. Copy the **Client ID** and **Client secret**.

---

## Part C — Connect Google to Supabase

1. In **Supabase** → **Authentication** → **Providers** → **Google**.
2. Toggle **Enable**, paste the **Client ID** and **Client secret** from Part B,
   click **Save**.
3. **Authentication** → **URL Configuration**:
   - **Site URL**: your production URL (e.g. `https://your-app.vercel.app`).
     Use `http://localhost:5173` for now if you haven't deployed yet.
   - **Redirect URLs** → add both:
     - `http://localhost:5173`
     - `https://your-app.vercel.app`
   - Save.

---

## Part D — Get your API keys

1. In **Supabase** → **Project Settings** (gear) → **API**.
2. Copy these two values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - (The anon key is meant to be public — your data is protected by the security
     rules from Part A. Do **not** use the `service_role` key in the frontend.)

### Test locally (optional but recommended)

1. In the project root create a file named `.env.local`:

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```

2. `npm run dev`, open <http://localhost:5173>, click **Sign in**. You should get
   the Google popup and land back signed in. Build a bracket → it saves to the
   cloud; create a league and the code appears.

---

## Part E — Deploy on Vercel

1. Push this repo to GitHub (if it isn't already):

   ```bash
   git init && git add -A && git commit -m "World Cup 26 bracket"
   git branch -M main
   git remote add origin https://github.com/YOU/your-repo.git
   git push -u origin main
   ```

2. Go to <https://vercel.com> → **Add New… → Project** → import your GitHub repo.
3. Vercel auto-detects **Vite** (Build `npm run build`, Output `dist`). Leave as
   is — `vercel.json` already handles client-side routing.
4. Expand **Environment Variables** and add the two from Part D:
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://YOUR-PROJECT-REF.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | your anon public key |
5. Click **Deploy**. You'll get a URL like `https://your-app.vercel.app`.

### After the first deploy — wire the real URL back

Now that you know your Vercel URL, go back and add it in the three spots that
need it (otherwise Google login will reject the redirect):

- **Google Cloud → Credentials → your OAuth client** → add the Vercel URL to
  **Authorized JavaScript origins**.
- **Supabase → Authentication → URL Configuration** → set **Site URL** to the
  Vercel URL and ensure it's in **Redirect URLs**.

Redeploy isn't needed for those (they're provider-side), but if you changed env
vars in Vercel, trigger a redeploy (Deployments → ⋯ → Redeploy).

---

## Verify it all works

- Open your Vercel URL on a phone and a laptop.
- **Sign in** with Google → succeeds and shows your avatar.
- Build a bracket, refresh → it persists (cloud save).
- **Leagues** → create one, copy the code. On another account/device, **join**
  with that code and confirm you can see each other's brackets.
- On the **Knockout** step → **Share bracket** → the image previews and the
  Share/Copy/Save buttons produce a PNG.

## Troubleshooting

- **"redirect_uri_mismatch" on Google login** — the Supabase callback URL in
  Part B step 3 must match **exactly** (`https://…supabase.co/auth/v1/callback`).
- **Login works but bounces to localhost** — set **Site URL** to your real domain
  in Supabase URL Configuration (Part C).
- **Sign in does nothing / "not configured"** — env vars missing or misspelled in
  Vercel; they must start with `VITE_`. Redeploy after adding.
- **Can't join a league by code from another account** — rerun
  [`supabase/schema.sql`](supabase/schema.sql) in Supabase SQL Editor. It installs
  the `join_league_by_code` database function used by the app.
- **Can't see a friend's bracket** — make sure you both joined the same league
  code; cross-member visibility is what unlocks it.
- **Google login blocked ("app not verified")** — add your email under OAuth
  consent screen → **Test users**, or publish the consent screen.
