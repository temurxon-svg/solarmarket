# SolarMarket — instructions for Claude Code

B2B solar equipment marketplace for Uzbekistan. Next.js 16 (App Router, TypeScript, Tailwind v4, next-intl) + hosted Supabase.
The database is already deployed and seeded (project ref `encmqyoekvmfotjhwxyp`, region eu-central-1). `.env.local` holds the public URL + anon key.

## Deploy pipeline (set up once, then automatic)
1. Ensure `gh` (GitHub CLI) and `vercel` CLI are installed: `brew install gh vercel-cli` (or `npm i -g vercel`). Run `gh auth login` and `vercel login` — the user completes these in the browser.
2. `git init && git add -A && git commit -m "SolarMarket v3"`
3. `gh repo create solarmarket --private --source=. --push`
4. `vercel link` (create new project "solarmarket"), then add env vars for production+preview:
   `vercel env add NEXT_PUBLIC_SUPABASE_URL` and `vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY` using the values in `.env.local`.
   Optionally `ANTHROPIC_API_KEY` (enables datasheet extraction) — ask the user for it, never invent it.
5. `vercel --prod` → report the live URL. Then connect the GitHub repo in the Vercel dashboard (Project → Settings → Git) so every `git push` redeploys; or just run `vercel --prod` after each change.

## After changes
`npm run build` must pass before committing. Then `git add -A && git commit -m "..." && git push` (and `vercel --prod` if Git integration isn't connected).

## Database changes
Migrations live in `supabase/migrations/`. The hosted DB was migrated by the assistant in chat; new migrations should be applied via the Supabase SQL editor or `supabase db push` after `supabase link --project-ref encmqyoekvmfotjhwxyp`.

## Demo accounts (password `Demo1234!`)
buyer@solarmarket.uz · seller@solarmarket.uz (owner of 3 demo companies) · admin@solarmarket.uz

## Conventions
- Trilingual UI: strings in `src/messages/{uz,ru,en}.json`; DB text fields are JSONB `{uz,ru,en}` read via `t()` in `src/lib/i18n-text.ts`.
- Server actions in `src/lib/actions/*`; Supabase clients in `src/lib/supabase/*`; RLS enforces access.
- Prices: stored in original currency + `price_uzs`; quantity tiers in `listing_price_tiers`; `effective_price_uzs(listing, qty, buyer_org)` RPC.
- Design: IBM Plex Sans, tabular numerals, amber only for best price / primary CTA. Tables over cards.
