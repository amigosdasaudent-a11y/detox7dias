# Detox Body Max — Manual Completo do Admin (sem saber programação)

> Válido para: `https://detox7dias.vercel.app/admin` + sua **senha master** (guardada no gerenciador de senhas do dono; nunca por e-mail/chat).

## 0. Antes de começar (3 regras de ouro)

- **É tudo cadastro e botão.** Nenhum código, nenhum terminal. Se algo não aparece na tela, o erro aparece na tela (em português).
- **Todo lugar de upload é a caixa tracejada** com 📤 "Clique aqui para escolher o arquivo ou arraste e solte". Depois de escolher, aparece **✓ nome-do-arquivo** em verde. Se não clicar nela, o cadastro fica sem imagem/arquivo.
- **Cadastrar ≠ aparecer.** Para o cliente ver, o item precisa estar com o selo/estado certo (Visível, Publicado, Ativo, produto Visível) **e** o plano dele precisa ser suficiente (Essencial < Completo < Vitalício).

---

## 1. Visão geral do painel (`/admin`)

Card com **contadores e atalhos**: Banners, Produtos, Conteúdos, Quiz, Blog, Pagamentos, Integrações, Novidades, Usuários. O modo do Stripe aparece no card **Pagamentos** (🧪 TESTE / 💳 LIVE).

---

## 2. Pagamentos (Stripe) — `/admin/pagamentos`

**Para que serve:** escolher onde o pagamento fala (Stripe) e em que modo (teste/live), sem mexer no código.

### 2.1 Modo ativo
- **🧪 Teste** = simula vendas (cartão `4242 4242 4242 4242`, qualquer data/CVC; na Stripe teste aparece "Verifique sua identidade" → digite `000000` ou pague sem Link).
- **💳 Live** = cobra de verdade (aviso vermelho quando ligado).
- O modo fica salvo no banco; checkout, webhook e preços usam esse modo.

### 2.2 Chaves por modo
| Campo | O que colocar | Onde pegar |
|---|---|---|
| **Secret** | `sk_test_...` ou `sk_live_...` | Dashboard Stripe (com Test mode ligado ou não) → Developers → API keys |
| **Webhook** | `whsec_...` | Developers → Webhooks → endpoint `https://detox7dias.vercel.app/api/stripe/webhook` (modo teste e live têm whsec **diferentes**) |
| **Price — essencial/completo/vitalício** | `price_...` do **mesmo modo** | Product Catalog (preços de teste e live são objetos diferentes) |

Regras de ouro:
- **Nunca** `pk_...` (chave pública) no campo Secret — a validação recusa.
- **Nunca** `sk_...` no campo Webhook.
- Campo **vazio** ao salvar = mantém o valor atual (para limpar link de vendas, apague e salve).
- Segredos aparecem só como `••••últimos4` no admin (nunca voltam completos para a tela).

**Testar conexão** valida a chave com leitura segura na Stripe (mostra modo e nº de preços). Se falhar, a mensagem vem em português claro.

### 2.3 Links da página de vendas (override por plano)
- **Vazio** = botão gera o checkout automático da Stripe (respeita teste/live). **Deixe assim no dia a dia.**
- **Preenchido** = botão pula direto para a URL colada (ex: Payment Link montado no Dashboard Stripe). Link fixo ignora o modo e só libera acesso sozinho se usar preço de plano; senão, libere em Usuários.

---

## 3. Produtos (caixas de aulas) — `/admin/produtos`

**Para que serve:** cada produto tem capa e guarda aulas dentro. Cliente abre o produto e vê E-books, Áudios e Vídeos.

**+ Novo Produto:**
1. Nome (ex: `Detox Body Max - 14 dias`)
2. Descrição (opcional)
3. Capa do produto (upload)
4. **Plano mínimo**: Essencial (todos veem) / Completo / Vitalício
5. Salvar

Lista: mostra prévia da capa, nº de aulas e "plano X+". Ações: **Mostrar/Ocultar produto** (oculto some do app com tudo dentro), **✏️ Editar**, **Excluir** (aulas ficam soltas, não apagam).

---

## 4. Conteúdos (as aulas) — `/admin/conteudos`

**+ Novo Conteúdo:**
1. **Tipo**: E-book (PDF) / Áudio (MP3) / Vídeo.
2. Título.
3. **Produto**: em qual produto fica (ou `Sem produto` → vira seção de categoria/Avulsos no Início).
4. Arquivo **ou** link, conforme o tipo:
   - **E-book**: upload PDF (fica no nosso armazenamento privado). Cliente escolhe **Ler aqui** (leitor próprio com zoom A-/A+ e aviso de girar o celular) ou **Baixar**.
   - **Áudio**: **só link** (ex: `https://audio.jukehost.co.uk/...`). Não usamos nosso espaço para áudio.
   - **Vídeo**: upload MP4 **ou** URL YouTube / Vimeo / Gumlet.
5. Capa (imagem opcional).
6. **Categoria** (texto livre — agrupa conteúdos avulsos com o mesmo nome, ex: `Sexualidade`). Cada grafia diferente vira uma seção — padronize.
7. **Plano mínimo** (Essencial/Completo/Vitalício).
8. Salvar → nasce **Visível**.

Lista: filtro por produto + selos (tipo, Visível/Oculto, produto, **🎁 Grátis** se amostra).

**Ações por linha:** 👁 mostrar/ocultar · 🎁 liberar grátis (amostra pública) · 🔗 copiar link público (só quando Grátis+Visível) · ✏️ editar (modal: tipo condicional, trocar arquivo, URL, categoria, plano, produto) · 🗑 excluir.

**Editar (modal):** mudar o tipo muda os campos (vídeo mostra URL; áudio mostra URL e esconde upload). Em áudio, **não há upload MP3**.

**Amostra grátis:** aula com 🎁 tem link `/ver/[id]` que abre tudo sem login (com CTA "Gostou? Ver planos"). Aula paga com plano insuficiente mostra teaser com 🔒 + botão de upgrade.

---

## 5. Banners (carrossel do Início) — `/admin/banners`

**+ Novo Banner:**
1. **1. Imagem do banner** (upload; 1600×600 ou similar)
2. **2. Para onde vai quando o cliente clica** (opcional, pode ficar vazio)
3. Salvar

Lista: prévia da imagem, selo **Ativo/Inativo**, **Ativar/Desativar**, **Excluir**. No Início, o carrossel tem setas ‹ ›, dots e troca sozinho a cada 5s.

---

## 6. Quiz (perguntas de entrada) — `/admin/quiz`

- Cada cartão = 1 pergunta. **Edite o texto direto nele** (salva ao sair do campo).
- Toggle verde = ativa/desativa. 🗑 exclui a pergunta **e** as alternativas.
- **Alternativas**: edite direto, 🗑 exclui, campo `+ Adicionar alternativa` (Enter adiciona).
- **+ Adicionar pergunta** cria com texto provisório (edite em seguida).
- Ordem = ordem de cadastro.

No 1º acesso, o cliente responde as 5 ativas → cai no Início. As respostas alimentam a IA do IMC e o contexto do app.

---

## 7. Blog (artigos) — `/admin/blog`

1. **+ Novo artigo** (form no topo): Título, **texto em Markdown** (`##` título, `-` bullet, `**negrito**`), capa (opcional), ☑ Publicado.
2. Salvar → rascunho; marque Publicado (ou use 👁) para ir ao ar.
3. ✏️ edita (carrega no form), 👁 publica/despublica, 🗑 exclui. Link `/blog/[slug]` gerado sozinho.

Onde aparece: `/blog` (lista pública com capa e data) → `/blog/[slug]` (artigo).

---

## 8. Loja — `/admin/loja`

**+ Novo Produto:**
1. Nome, descrição (opcional).
2. **Botão de compra**: 💬 **WhatsApp** (link `https://wa.me/55DDDNUMERO?text=...` com mensagem pronta) ou 🔗 **Link externo** (site/afiliado).
3. Preço em **texto** (ex: `R$ 97`) — a cobrança é no destino, não no app.
4. **Libera o app?** — Não, só vende / Essencial / Completo / Vitalício (selo no card; a liberação manual de WhatsApp é em Usuários).
5. Foto do produto (upload).

Lista: 👁 mostrar/ocultar, ✏️ editar, 🗑 excluir. No app: `/loja` (cards com botão que abre em nova aba).

---

## 9. Usuários — `/admin/usuarios`

Para vendas fora da Stripe (WhatsApp/WhatsApp Business):
1. Digite o e-mail do cliente + plano → **Liberar** (conta nova recebe e-mail de convite para definir a senha).
2. Busca por e-mail; cada linha mostra plano e status.
3. **Revogar** (corta acesso) / **Reativar** (último acesso).

Vendas pela Stripe liberam sozinhas (webhook). O cliente define a senha no `/sucesso` após pagar; o e-mail de convite é só backup.

---

## 10. Integrações — `/admin/integracoes`

### 10.1 Evolution (WhatsApp)
1. **URL do servidor**: `https://seu-servidor-evolution.com.br`
2. **Nome da instância**: ex: `rachadomsg` (o que aparece no painel Evolution GO)
3. **Token da instância** (não a key global): Evolution GO → Instâncias → Configurações → "Token da Instância"
4. **Salvar Evolution** → selo **open** = conectado (se aparecer "session already logged in", está conectado: QR não é necessário).
5. **Mensagem de teste**: número com DDI + texto → Enviar. Confira a resposta (enviados/falhas com motivo).

Número sem DDI no cadastro dos clientes é completado com **55** automaticamente.

### 10.2 IA (chat + IMC) — ordem automática
1. **Groq (grátis)**: `gsk_...` + modelo (padrão `openai/gpt-oss-120b`).
2. **Extra (grátis)**: URL base + modelo + chave (ex: OpenRouter, DeepSeek). Opcional.
3. **OpenAI (paga, último recurso)**: `sk-...`.

Se uma falhar, a próxima entra sozinha. Na calculadora, resposta pela **paga** limita a **1x/semana** (grátis = 5/dia). Menor de idade, JEV deny e IMC < 18,5 **nunca geram plano** (encaminham a profissional).

---

## 11. Novidades (broadcast WhatsApp) — `/admin/novidades`

1. **Mensagem** (use `{nome}` para personalizar).
2. **Imagem** (opcional, vai com a legenda) e/ou **Link do vídeo** (YouTube/Vimeo/Gumlet, abre prévia).
3. **Enviar para N** com seleção: lista com **caixa de marcação + Marcar todos** (seleciona só quem tem 🎁 e opt-in).
4. Relatório: ✅ Enviados / ❌ Falhas (com motivo, ex: número não existe no WhatsApp).

Clientes se inscrevem pelo card **🔔 QUER RECEBER NOVIDADES?** no Início (nome + celular, com saída a qualquer momento).

---

## 12. Conferência rápida

| Cadastrei... | Confiro em... | Espero ver... |
|---|---|---|
| Produto (Visível) | `/inicio` | Card em Meus produtos |
| Aula Visível com produto | `/produto/[id]` | Card na seção do tipo |
| Aula Visível sem produto | `/inicio` | Seção com o nome da categoria (ou Avulsos) |
| Aula 🎁 Grátis | link `/ver/[id]` | Abre sem login |
| Banner Ativo | topo do `/inicio` | Imagem no carrossel |
| Artigo Publicado | `/blog` | Card |
| Loja Visível | `/loja` | Card com botão |
| Acesso manual | login do cliente | Entra e vê o conteúdo |
| Integração WA | `/admin/integracoes` | Selo **open** + teste enviado |

---

## 13. Problemas comuns (e a causa)

- **Imagem/arquivo não envia**: use a caixa tracejada (não clique em "vazio"). Arquivo grande (>~50 MB) pode estourar — PDFs grandes, divida.
- **PDF não abre no celular**: use **"Tentar pelo Google"** na tela de erro, ou **Baixar**. O motivo aparece em cinza claro.
- **Cadastrei e não aparece**: confira selo Visível/Publicado/Ativo/🎁, plano mínimo, nome da categoria (grafias diferentes = seções diferentes) e faça **Ctrl+F5** no app.
- **Áudio não toca**: o link precisa ser MP3 direto ou provedor que aceite player (jukehost ok). YouTube não funciona em player de áudio.
- **Vídeo preto (Gumlet `.m3u8`)**: use URL **MP4** ou link do **YouTube**.
- **Mensagem WhatsApp falha**: leia o motivo (número não existe / token errado / sem login).
- **Pagamento não libera**: confira modo, `whsec` do modo, `price_...` do modo; webhook ativo na Stripe.
- **E-mail não checa (definição de senha)**: o cliente pode definir direto no `/sucesso`; confira spam. Resgate o acesso em `/admin/usuarios`.

---

## 14. Segurança

- **Segredos nunca no chat/git/planilha:** senha master, `sk_`, `whsec_`, `gsk_`, `sk-` OpenAI, token Evolution. Só no admin (mascarados) ou Vercel (env).
- **Login admin** = só senha master, cookie 12h.
- **Login cliente** = e-mail + senha. Não existe cadastro público, não existe link mágico.
- **Trava por plano:** Essencial < Completo < Vitalício. Aula/produto de plano superior aparece com 🔒 e só abre com upgrade.
- **Boas práticas:** senha master forte; troque o `ADMIN_PASSWORD` no Vercel se ela vazar; revogue tokens que vazaram; desligue o cadastro público no Supabase (Auth → Sign In/Up).
