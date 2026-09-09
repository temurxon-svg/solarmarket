# SolarMarket

B2B solar equipment marketplace for Uzbekistan. Next.js 16 + Supabase (hosted).

## Run on your computer (no Docker needed)
```bash
npm install
npm run dev
```
Open http://localhost:3000. The database is hosted on Supabase (`.env.local` is already filled in).

## Demo accounts (password for all: `Demo1234!`)
| Role | Email |
|---|---|
| Buyer | buyer@solarmarket.uz |
| Seller (owner of SolarTech, Bukhara Energy, Fergana Solar) | seller@solarmarket.uz |
| Platform admin | admin@solarmarket.uz |

## Layout
```
supabase/migrations/   schema (already applied to the hosted project)
supabase/seed_hosted.sql  demo data (already applied)
src/app/[locale]/(shop)   public site: home, catalog, product, compare, sellers
src/app/[locale]/account  buyer: orders/RFQ, messages, favorites
src/app/[locale]/dashboard seller: companies, listings, catalog requests
src/app/[locale]/admin    platform admin
```
