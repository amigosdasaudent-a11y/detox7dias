# Detox Body Max — Documento Técnico (lógica do programa)

Data: 08/10/2026. Estado: produção em `https://detox7dias.vercel.app`.

## 1. Visão geral

| Camada | Tecnologia / serviço |
|---|---|
| App | Next.js 16 (App Router) + Tailwind, PWA (`/manifest.webmanifest`) |
| Banco, login e arquivos | Supabase Postgres + Auth + Storage (projeto `hlowcolyzkvipmdobskk`) |
| Pagamento | Stripe Checkout + Webhook (modo LIVE) |
| IA do IMC (preparada, não ativa no app) | JEV (`https://www.jevai.org`, decisão/guardrail) + endpoint `/api/jev-test` |
| Vídeos | YouTube (embed), Vimeo (embed), Gumlet/MP4/HLS (player próprio `hls.js`) |
| Deploy | Vercel (projeto `detox7dias`), código no GitHub `amigosdasaudent-a11y/detox7dias`, branch `main` |
| E-mail transacional | SMTP próprio do Supabase (convite, recuperação de senha). Sem Resend. |

Repositório local: `F:\Projeto detox\detox-app` (branch `master` → push para `a11y/main`).

## 2. Ambientes e variáveis

- Local: `http://localhost:3000` (`npm run dev`), env em `.env.local` (**nunca commitado**; `.gitignore` cobre `.env*`).
- Produção: `https://detox7dias.vercel.app`, env em Vercel → Settings → Environment Variables.
- Variáveis (nomes; valores só nos cofres): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JEV_API_KEY`, `JEV_BASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ESSENCIAL`, `STRIPE_PRICE_COMPLETO`, `STRIPE_PRICE_VITALICIO`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD`, `RESEND_API_KEY` (reservada, vazia).
- `NEXT_PUBLIC_*` exige rebuild/redeploy após alteração.

## 3. Mapa de telas e links

### 3.1 Públicas (sem login)
| Rota | O que é |
|---|---|
| `/` | Página inicial simples do app (placeholder com links) |
| `/vendas.html` | **Página de vendas real** (HTML estático em `public/`). Botões "Quero o Essencial/Completo/Vitalício" chamam `POST /api/checkout {plan}` e redirecionam ao Checkout Stripe |
| `/login` | Só e-mail + senha. Sem cadastro público, sem link mágico. Link para `/recuperar-senha` |
| `/recuperar-senha` | Envia e-mail de redefinição (volta para `/definir-senha`) |
| `/definir-senha` | Troca `?code=` por sessão (`exchangeCodeForSession`) e define a senha. Serve convite e recuperação |
| `/sucesso?session_id=...` | Pós-pagamento: orienta a abrir o e-mail de convite |
| `/blog` | Lista pública de artigos publicados |
| `/blog/[slug]` | Artigo em Markdown |

### 3.2 Área do cliente (exige login; layout com sidebar escura)
Sidebar: Início, Loja, Blog, IMC, Módulos salvos, Meu progresso, Instalar App, Pesquisar, Alterar senha, Sair. Menu mobile vira gaveta ☰.

| Rota | Estado |
|---|---|
| `/inicio` | ✅ Banner rotativo (setas + dots) + grade **Meus produtos** (capa → abre) + Avulsos + card IMC |
| `/produto/[id]` | ✅ Capa do produto + aulas separadas (E-books, Áudios, Vídeos) |
| `/assistir/[id]` | ✅ Player universal (YouTube/Vimeo/MP4/HLS) ou `<audio>`; arquivos via URL assinada 10 min |
| `/quiz` | ✅ 5 perguntas ativas; salva em `quiz_answers` e marca `profiles.quiz_completed` |
| `/loja` | ✅ Cards da loja (WhatsApp/externo), selo "Libera o app" |
| `/imc`, `/salvos`, `/progresso`, `/instalar`, `/pesquisar`, `/alterar-senha` | ❌ Ainda não criadas (404). Sidebar aponta, telas pendentes |

Regra de acesso: `/inicio`, `/produto/*`, `/assistir/*` exigem `entitlements` com `status=active`; sem acesso mostra "Acesso não encontrado". Sem login redireciona a `/login`. Primeiro acesso com `quiz_completed=false` vai ao `/quiz`.

### 3.3 Admin (só senha master, cookie httpOnly 12h)
| Rota | O que faz |
|---|---|
| `/admin/login` | Digita a senha master (`POST /api/admin/session` grava cookie HMAC) |
| `/admin` | Dashboard com contadores + atalhos |
| `/admin/banners` | Upload de imagem (Storage `covers`) + link opcional + Ativo/Inativo + excluir. Prévia da imagem |
| `/admin/produtos` | CRUD de produtos de conteúdo (capa, título, descrição) + **Mostrar/Ocultar produto** (some do app com tudo dentro) + editar/excluir |
| `/admin/conteudos` | E-book (PDF upload), áudio (MP3 upload), vídeo (MP4 upload **ou** URL YouTube/Vimeo/Gumlet) + capa + produto dono + plano mínimo + filtro por produto + editar (modal com tipo) + 👁 ocultar + excluir |
| `/admin/quiz` | Editor pergunta a pergunta: texto (salva ao sair do campo), toggle ativo, excluir, adicionar alternativa/excluir, adicionar pergunta |
| `/admin/blog` | Novo artigo (título, Markdown, capa, publicado), editar, publicar/despublicar, excluir |
| `/admin/loja` | CRUD da loja: foto, nome, descrição, botão 💬 WhatsApp (`wa.me` com mensagem) ou 🔗 externo, preço em texto, "libera o app?" (não/essencial/completo/vitalício), mostrar/ocultar, editar, excluir |
| `/admin/usuarios` | Busca por e-mail, **liberar acesso manual** (plano; conta nova recebe convite), revogar/reativar |

Uploads: navegador → Supabase direto via URL assinada (`POST /api/admin/upload-url` + `PUT`), sem limite de 4,5 MB da Vercel (`lib/admin-upload.ts`). Arquivos antigos iam pelo servidor (`/api/admin/upload`, mantida).

## 4. Fluxo de compra (Stripe)

```
vendas.html --POST /api/checkout {plan}--> sessão Checkout (mode auto: subscription se preço recorrente)
  --> cliente paga --> Stripe POST /api/stripe/webhook (assinatura whsec verificada)
    --> idempotência (stripe_events) --> cria usuário (e-mail do checkout)
    --> grava entitlements(active) --> inviteUserByEmail (define senha)
  --> /sucesso --> /login (senha) --> /quiz (1º acesso) --> /inicio
```

- **Só preço de plano libera acesso** (`lib/stripe.ts::planFromPriceId`; preço desconhecido = evento registrado e ignorado).
- Eventos: `checkout.session.completed` (libera), `invoice.paid` (renova + conta 12x), `customer.subscription.deleted` (Vitalício mantém; demais revogam), `charge.refunded`/`charge.dispute.created` (revoga).

## 5. Regras de cobrança

- **Essencial**: mensalidade contínua (preço recorrente). Cancelar → revoga.
- **Completo/Vitalício**: 12 cobranças mensais, cartão cadastrado 1 vez. Webhook conta faturas pagas e agenda o fim após a 12ª (`cancel_at_period_end`). Fim das 12x: Vitalício mantém acesso para sempre; Completo encerra (12 meses).
- Loja (WhatsApp/externo): sem Stripe; liberação manual em `/admin/usuarios` (ou futura Evogo via `grants_plan`).

## 6. Banco (Supabase)

Tabelas: `profiles` (1 por `auth.users`, trigger `handle_new_user`), `entitlements`, `stripe_events`, `banners`, `collections` (produtos; migration `002`), `contents` (+`collection_id`; migration `002`), `quiz_questions`, `quiz_options`, `quiz_answers`, `favorites`, `progress`, `posts`, `products` (+`kind`,`target_url`,`grants_plan`; migration `003`), `imc_history`.
Schema base: `supabase/schema.sql`; migrations: `supabase/migrations/002_collections.sql`, `003_store.sql` (aplicar via `node scripts/apply-sql.mjs <arq>` com `DATABASE_URL` do pooler).
Segurança: RLS ativo; leitura pública só de publicados; escrita de conteúdo só admin; buckets `covers` e `content-files` **privados** (entrega por URL assinada); `service_role` e segredos só no servidor. Recomendado: desligar cadastro público (Auth → Sign In/Up).

## 7. Scripts (`scripts/`, todos leem `.env.local`, nada hardcoded)

`apply-schema.mjs` (schema inicial), `apply-sql.mjs <arq>` (migration), `check-stripe.mjs` (lista preços, só leitura), `make-price.mjs` (cria preço), `make-webhook.mjs <url>` (cria endpoint + mostra `whsec`), `test-webhook.mjs [email]` (POST assinado local no webhook).

## 8. Pendências conhecidas

- Telas do menu ainda 404: `/imc` (+IA JEV Fase 5), `/salvos` (favoritos), `/progresso`, `/instalar`, `/pesquisar`, `/alterar-senha`.
- `ADMIN_PASSWORD` e segredos: só em `.env.local` + Vercel + gerenciador de senhas. Nunca no git/chat.
- Webhook produção registrado: `https://detox7dias.vercel.app/api/stripe/webhook` (Stripe Dashboard → Developers → Webhooks).
- Supabase Auth → URL Configuration: Site `https://detox7dias.vercel.app`, redirects com `/inicio`.
