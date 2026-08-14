# PantryPal — Setup Guide

Everything here is **free** except a one-time **~$5** prepaid balance on Anthropic
(pay-per-use for photo recognition + recipe generation). Do the steps in order.

---

## 1. Supabase (database + auth + photo storage)

1. Go to <https://supabase.com> → sign in with GitHub or email → **New project**.
   - Name: `pantrypal`. Choose a region near you. Set a strong database password (save it).
   - Wait ~2 min for it to provision.
2. **Run the schema.** Left sidebar → **SQL Editor** → **New query**.
   - Paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), click **Run**.
   - New query again → paste [`supabase/migrations/0002_storage.sql`](supabase/migrations/0002_storage.sql), click **Run**.
3. **(MVP convenience) Turn off email confirmation** so you can log in immediately:
   - **Authentication** → **Sign In / Providers** → **Email** → toggle **Confirm email** OFF → Save.
   - (Leave it ON later for real users; the confirmation callback is already built.)
4. **Grab your keys.** **Project Settings** (gear) → **API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (under "Project API keys", reveal it) → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Anthropic (the AI)

1. Go to <https://console.anthropic.com> → sign up.
2. **Billing** → add **$5** credit (pay-as-you-go, no subscription).
3. **API Keys** → **Create Key** → copy it → `ANTHROPIC_API_KEY`.

---

## 3. USDA FoodData Central (nutrition data — free)

1. Go to <https://fdc.nal.usda.gov/api-key-signup> → enter your email.
2. The key is emailed instantly → `USDA_API_KEY`.

---

## 4. Wire up local environment

1. Copy the template: `cp .env.example .env.local`
2. Paste the 5 values from steps 1–3 into `.env.local`.
3. Run it: `npm run dev` → open <http://localhost:3000>.
4. Create an account → you should land on the dashboard. 🎉

---

## 5. GitHub (source control)

Option A — web: create a new **private** repo named `pantrypal` at
<https://github.com/new> (don't add a README), then run the commands GitHub shows
under "…or push an existing repository".

Option B — CLI (if you install the GitHub CLI): `gh repo create pantrypal --private --source=. --push`

---

## 6. Vercel (hosting)

1. Go to <https://vercel.com> → sign in with GitHub → **Add New… → Project** → import `pantrypal`.
2. **Environment Variables**: add all 5 keys from `.env.local`, plus set
   `NEXT_PUBLIC_SITE_URL` to your Vercel URL once you know it (e.g. `https://pantrypal.vercel.app`).
3. **Deploy.**
4. Back in **Supabase → Authentication → URL Configuration**: set **Site URL** to your
   Vercel URL and add `https://<your-app>.vercel.app/auth/callback` to **Redirect URLs**.

> Tip: the **Supabase ↔ Vercel integration** (Vercel marketplace) can sync these env
> vars automatically if you prefer.

---

## Where each tool fits

| Tool | Role |
| --- | --- |
| Next.js (this repo) | The app — UI + server actions + API |
| Supabase | Postgres data, login, photo storage (row-level security per user) |
| Anthropic / Claude | Reads food photos, generates & filters recipes |
| USDA FoodData Central | Accurate calories/protein/carbs/fat per ingredient |
| GitHub | Source control; triggers Vercel deploys |
| Vercel | Hosting + preview URLs on every push |
