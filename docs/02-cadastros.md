# Detox Body Max — Manual de Cadastros (operacional)

Tudo é feito em `https://detox7dias.vercel.app/admin` com a **senha master** (guardada no gerenciador de senhas do dono; nunca por e-mail/chat). Sem ela, as telas voltam para `/admin/login`.

## 1. Produto de conteúdo (a "caixa" que o cliente abre)

`/admin` → **Produtos** → **+ Novo Produto**.

1. **Nome do produto** (ex: `Detox Body Max - 14 dias`).
2. **Descrição** (opcional; aparece dentro do produto, no app).
3. **Capa do produto**: Escolher ficheiro (imagem; sobe sozinha ao Salvar).
4. **Salvar produto**.
5. Na lista: **Mostrar/Ocultar produto** (oculto some do app com tudo dentro), **✏️ Editar**, **Excluir** (as aulas ficam soltas, não são apagadas).

Onde aparece: `/inicio` → **Meus produtos** (capa → clica → `/produto/[id]` com as aulas separadas por tipo). Contador no dashboard.

## 2. Conteúdo: e-book, áudio ou vídeo (a "aula")

`/admin` → **Conteúdos** → **+ Novo Conteúdo**.

1. **Tipo**: `E-book (PDF)` | `Áudio (MP3)` | `Vídeo`.
2. **Título**.
3. **Produto**: em qual produto fica a aula (ou `Sem produto` → cai em "Avulsos" no Início).
4. **Arquivo** (sobe para o armazenamento privado):
   - E-book → PDF | Áudio → MP3 | Vídeo → MP4 **ou** deixe vazio e use a URL abaixo.
5. **URL do vídeo** (só tipo Vídeo, quando não há arquivo): YouTube (`youtube.com/watch?v=...` ou `youtu.be/...`), Vimeo (`vimeo.com/...`) ou Gumlet **MP4** (recomendado; ative MP4 em *processing settings* no Gumlet e cole o MP4, não o `.m3u8` — o `.m3u8` com token dá tela preta).
6. **Capa** (imagem opcional; aparece no card do app).
7. **Salvar conteúdo** → nasce **Visível** (use o 👁 para ocultar sem apagar).
8. Na lista: filtro por produto (`Todos` | cada produto | `Sem produto`); selos de tipo (`pdf`, `mp3`, `vídeo`), `Visível/Oculto` e produto dono; ações 👁 mostrar/ocultar, **✏️ editar** (tipo, título, descrição, URL, categoria, plano, produto), 🗑 excluir.

Onde aparece: dentro do produto (`/produto/[id]`) ou Avulsos; e-book abre o PDF em nova aba; áudio/vídeo abrem `/assistir/[id]`.

## 3. Banner (carrossel do Início)

`/admin` → **Banners** → **+ Novo Banner**.

1. **1. Imagem do banner** (upload; use 1600×600 ou similar).
2. **2. Para onde vai quando o cliente clica** (opcional; pode ficar vazio).
3. **Salvar banner**. Na lista: prévia da imagem, selo **Ativo/Inativo**, **Ativar/Desativar**, **Excluir**.

Onde aparece: topo do `/inicio`, com setas ‹ › e dots (troca sozinho a cada 5s).

## 4. Quiz (perguntas de entrada)

`/admin` → **Quiz**.

- Cada cartão = 1 pergunta: texto (edita direto, salva ao sair do campo), toggle verde (ativa/desativa), 🗑 exclui (apaga as alternativas junto).
- **Alternativas**: edita direto, 🗑 exclui, campo `+ Adicionar alternativa` (Enter adiciona).
- **+ Adicionar pergunta** cria com texto provisório (edite em seguida).
- Ordem = ordem de cadastro (`sort_order`).

Onde aparece: `/quiz` no 1º acesso (só perguntas ativas); responder tudo libera o `/inicio`.

## 5. Blog (artigos)

`/admin` → **Blog**.

1. **+ Novo artigo** (form no topo): **Título**, **texto em Markdown**, **capa** (opcional), ☑ **Publicado**.
2. **Salvar** → nasce como rascunho salvo; marque Publicado para ir ao ar (ou use o 👁 na lista).
3. ✏️ edita (carrega no form), 👁 publica/despublica, 🗑 exclui. O link `/slug` é gerado sozinho.

Onde aparece: `/blog` (lista pública com capa e data) → `/blog/[slug]` (artigo).

## 6. Loja (produtos à venda)

`/admin` → **Loja** → **+ Novo Produto**.

1. **Nome**, **descrição** (opcional).
2. **Botão de compra**: 💬 **WhatsApp** (link `https://wa.me/55DDDNUMERO?text=Quero%20comprar%20...` com mensagem pronta) ou 🔗 **Link externo** (site/afiliado).
3. **Preço (texto exibido)** (ex: `R$ 97`; é só texto, a cobrança é no destino).
4. **Libera o app?**: `Não, só vende` ou Essencial/Completo/Vitalício (selo "Libera o app" no card; a liberação de venda WhatsApp é manual — item 7).
5. **Foto do produto** (upload).
6. **Salvar** → 👁 mostrar/ocultar, ✏️ editar, 🗑 excluir.

Onde aparece: `/loja` (cards com foto, preço e botão que abre WhatsApp/externo em nova aba).

## 7. Usuários (liberar quem comprou fora da Stripe)

`/admin` → **Usuários**.

- **Liberar venda WhatsApp**: digite o e-mail do cliente + plano → **Liberar** (conta nova recebe e-mail de convite para definir a senha).
- **Buscar** por e-mail; cada linha mostra plano e status.
- **Revogar** (corta o acesso) / **Reativar** (último acesso).

Vendas pela Stripe liberam sozinhas (webhook); aqui é só para vendas manuais.

## 8. Conferência rápida (após cada cadastro)

| Cadastrei... | Confiro em... | Espero ver... |
|---|---|---|
| Produto (visível) | `/inicio` | Card com capa em Meus produtos |
| Aula (visível, com produto) | `/produto/[id]` | Card na seção do tipo |
| Aula (visível, sem produto) | `/inicio` → Avulsos | Link Ler/Ouvir/Assistir |
| Banner (ativo) | topo do `/inicio` | Imagem no carrossel |
| Artigo (publicado) | `/blog` | Card com título |
| Produto de loja (visível) | `/loja` | Card com botão de compra |
| Acesso manual | login do cliente | entra e vê o conteúdo |

## 9. Problemas comuns

- **Upload falha**: aguarde o redeploy mais recente; o envio agora é direto ao Storage (sem limite de 4,5 MB). Erros aparecem em português na tela.
- **Vídeo preto (Gumlet `.m3u8`)**: troque pela URL **MP4** (ative MP4 no Gumlet) ou por link do **YouTube**.
- **Cadastrei e não aparece**: confira selo `Visível/Publicado/Ativo` (+ toggle 👁), produto dono correto e, no app, `Ctrl+F5` (cache).
- **Cliente não entra**: confira em Usuários se há acesso `ativo`; senha se define pelo convite/recuperar senha (não existe mais link mágico).

## 10. Pagamentos — alternar TESTE / LIVE (Stripe)

`/admin` → **Pagamentos**. O modo ativo aparece no dashboard.

1. **Simular vendas sem cobrar**: clique em **🧪 Teste** (modo ativo). Cadastre em "Chaves de TESTE": `Secret key` (`sk_test_...`), `Webhook secret` (`whsec_...` do endpoint de teste no Dashboard Stripe) e os 3 **Price IDs de teste** (crie os preços com Test mode ligado no Stripe). Salve e clique **Testar conexão**.
2. **Compra de teste**: abra `/vendas.html`, clique no plano e pague com `4242 4242 4242 4242` (qualquer data futura/CVC). O webhook de teste precisa estar encaminhando: `stripe listen --forward-to localhost...` (local) ou endpoint de teste apontando para a URL pública.
3. **Voltar a cobrar de verdade**: clique em **💳 Live** (as chaves live já estão salvas). Confirme com **Testar conexão**.
4. Campos vazios ao salvar **mantêm** o valor atual; segredos aparecem só como `••••últimos4`. O mesmo URL de webhook serve nos dois modos, mas cada modo (teste/live) tem seu próprio `whsec` no Dashboard Stripe.
