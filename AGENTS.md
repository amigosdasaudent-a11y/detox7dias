# AGENTS.md — Detox Body Max

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 (via `@tailwindcss/turbopack`)
- Supabase (Auth, Postgres/RLS, Storage)
- Stripe (checkout + webhooks)
- Resend/JEV/pg/pdfjs/hls.js as used

## Commands
- `npm run dev` — dev server (Next 16)
- `npm run build` — production build
- `npm run start` — start built app
- `npm run lint` — ESLint (flat config, Next core-web-vitals + TS)

## Architecture
- App Router under `app/` (routes: `(app)`, `admin/`, `api/*`, auth flows `login/criar-conta/definir-senha/recuperar-senha`, `quiz`, `inicio`/protected area implied by middleware).
- Auth: Supabase SSR (`@supabase/ssr`) in `middleware.ts` (refreshes session on all non-static paths) and server client in `lib/supabase/server.ts`. Service role client for server-only privileged ops (webhook/admin).
- Access control: `entitlements` table + helpers `is_admin()`/`has_active_access()` in RLS; content gated by plan (`min_plan`) and published flags. Access is granted **only by Stripe webhook** (never on success page).
- Payments: `lib/stripe.ts` loads config from DB `settings` first (admin panel), falls back to env. Plans: `essencial|completo|vitalicio`. `checkout` route may use admin-set fixed sales links (`sales_link_{plan}`) before creating session. Webhook idempotent via `stripe_events`.
- Storage: private buckets `content-files` and `covers`. Access via signed URL API (`app/api/signed-url`); no public read policies. Uploads admin-only via service role/policies.
- DB schema/RLS/triggers in `supabase/schema.sql`; incremental changes in `supabase/migrations/` (note collections, settings, subscribers, IMC provider, `contents.is_free`, programs `011`).
- Acompanhamento (detox): program definitions live in `lib/programs/` (TS, not DB); user state in `program_*` tables (`supabase/migrations/011_programas.sql`). A product shows the "Meu acompanhamento" card when `collections.program_id` is set (admin: Produtos → Acompanhamento). Routes: `/acompanhamento/[programId]`, `/dia/[dia]`, `/checkin/[dia]`, `/iniciar`, `/resultado`; API: `POST/GET /api/acompanhamento`. Add new programs to `lib/programs/index.ts` registry. Access to the program is still gated by `entitlements`; enrollment is separate.

## Env (see `.env.local`)
Server-only secrets: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JEV_API_KEY`, `ADMIN_PASSWORD`. Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`. Stripe price IDs (`STRIPE_PRICE_*`) used as fallback; admin can override via settings.

## Gotchas
- **Webhook is source of truth**: do not grant entitlements on `sucesso` page. Webhook maps price→plan, creates user if missing, invites new users to set password, handles subscriptions (12x auto-cancel logic), refunds/disputes revoke access.
- **Stripe API version**: `lib/stripe.ts` pins `apiVersion: "2026-09-30.endive"`.
- **RLS**: `settings` has RLS enabled with no policies — only service role can read/write. Storage policies restrict to admin.
- **Middleware**: touches auth for almost all routes (matcher excludes static assets). Keep changes compatible with Supabase SSR cookie handling.
- **Next 16**: `layout.tsx` uses `LayoutProps<"/">`; `next.config.ts` has `cacheComponents: false` and Turbopack CSS rule for Tailwind. The top-of-file Next.js warning block is auto-managed by `next dev` — keep as-is.

## Where to look
- Routes: `app/api/checkout`, `app/api/stripe/webhook`, `app/api/signed-url`, `app/admin/*`
- Lib: `lib/stripe.ts`, `lib/supabase/*`, `lib/settings.ts`, `lib/admin.ts`
- Schema: `supabase/schema.sql`, `supabase/migrations/`

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
