# Detox Body Max — Módulo "Meu acompanhamento" (dia a dia dos desafios)

Atualizado em 25/10/2026. Versão em produção: Detox **7 Dias** (o Detox 15 Dias ainda não tem módulo criado).

## 1. O que é

Um tipo de módulo novo que vive **dentro do produto**: guia a pessoa do dia 1 ao último dia com plano do dia, jejum, contadores, checklist, medidas, check-in e resultado final.

- A pessoa compra/ganha acesso ao produto normalmente (Stripe ou liberação manual).
- O card **📅 Meu acompanhamento** aparece na página do produto quando `collections.program_id` aponta para um programa.
- **Acesso ao conteúdo continua sendo por `entitlements`**; a inscrição no programa é separada (a pessoa pode ter acesso e nunca iniciar).

## 2. Onde fica cada coisa

| Peça | Caminho |
|---|---|
| Definição do programa (dados) | `lib/programs/detox7.ts` |
| Tipos do programa | `lib/programs/types.ts` |
| Registro de programas + cálculos | `lib/programs/index.ts` |
| IMC (6 faixas) | `lib/imc.ts` |
| API do acompanhamento | `app/api/acompanhamento/route.ts` |
| API de upload das fotos | `app/api/acompanhamento/upload-url/route.ts` |
| Upload no navegador | `lib/progress-upload.ts` |
| Telas | `app/(app)/acompanhamento/[programId]/...` |
| Histórico | `app/(app)/progresso/page.tsx` |
| Componentes | `components/acompanhamento/` |
| Banco (tabelas + RLS) | `supabase/migrations/011_programas.sql` |

## 3. Rotas do cliente

Todas exigem login. O acesso ao **conteúdo** exige `entitlements` ativo; o programa exige triagem aprovada + inscrição.

| Rota | O que faz |
|---|---|
| `/acompanhamento/[programId]` | Painel: progresso, sequência de dias, card do dia de hoje, jornada dos 7 dias, medidas iniciais, líquidos permitidos, avisos |
| `/acompanhamento/[programId]/iniciar` | Wizard em 3 passos: triagem → medidas iniciais/fotos → configuração |
| `/acompanhamento/[programId]/dia/[dia]` | Dia: refeições marcáveis, jejum, contador de ovos/maçãs, checklist, água, concluir dia |
| `/acompanhamento/[programId]/checkin/[dia]` | Check-in: água, sono, energia, humor, sintomas, nota, peso/cintura opcionais |
| `/acompanhamento/[programId]/resultado` | Medidas finais, comparativo início × fim, IMC, médias, gráfico de peso, fotos privadas |
| `/progresso` | Histórico de todos os programas (antes era 404) |

`[programId]` inválido → 404. Programa válido sem inscrição → redireciona para `iniciar`.

## 4. Fluxo da pessoa

```
produto → card "Meu acompanhamento" → Iniciar
  → 1. Triagem (6 perguntas de segurança)
       bloqueia: menor de 18, gestante/lactante, diabetes, doença renal/hepática,
                 histórico de transtorno alimentar
       medicação contínua: exige confirmação "conversei com meu médico/nutricionista"
  → 2. Medidas iniciais (altura, peso, cintura) + fotos opcionais
       IMC < 18,5 → bloqueia o início do desafio de 7 dias
  → 3. Configuração (data de início, intolerância a ovo, hora de acordar/dormir)
  → Painel → dia a dia → check-in diário → resultado no último dia
```

A triagem é gravada em `program_screenings` e a API `iniciar` **revalida** `approved` no servidor — não dá para pular a triagem pelo navegador. O IMC também é recalculado no servidor.

## 5. Conteúdo do programa (Detox 7 Dias)

- **Dias 1, 2 e 6** — dieta líquida: 5 sucos/sopas por dia, jejum 20h (véspera) → 08h (12h).
- **Dias 3, 4 e 5** — dia do ovo: mínimo 6 ovos, alerta ao passar **5h** sem comer ovo, 2 ovos às 18h, checklist de 9 regras.
  - Quem marcou **intolerância a ovo** vê a alternativa de dieta líquida no lugar (ids próprios para não misturar marcações).
- **Dia 7** — dia da maçã: jejum até 12h, 6 maçãs no dia, checklist.
- **Água** — contador de 8 copos (referência), teto de 40.
- Líquidos permitidos: água, café e chás sem açúcar ou adoçante.

As **receitas completas não estão no app** — o JSON de origem não traz o texto; a tela remete ao e-book do produto.

## 6. API

`GET /api/acompanhamento?program=detox-7` → `{ enrollment, screening, measures, progress, checkins }`

`POST /api/acompanhamento` com `{ action, program, ... }`:

| `action` | Campos | Regra |
|---|---|---|
| `triagem` | `answers`, `confirmed` | Grava respostas; `approved` só se nenhuma pergunta de bloqueio = sim e a confirmação (quando exigida) foi marcada |
| `iniciar` | `startDate`, `heightCm`, `weightKg`, `waistCm`, `photoFrontPath`, `photoSidePath`, `eggIntolerance`, `wakeTime`, `sleepTime` | Exige triagem aprovada; recusa IMC < 18,5 (HTTP 422) |
| `progresso` | `day`, `meals`, `counters`, `fastingStartedAt`, `fastingEndedAt`, `completed` | Refeições marcadas, contadores e jejum do dia |
| `checkin` | `day`, `weightKg`, `waistCm`, `waterCups`, `sleep`, `energy`, `mood`, `symptoms`, `note` | 1 por dia (upsert) |
| `medidas` | `weightKg`, `waistCm`, `photoFrontPath`, `photoSidePath` | Grava o momento `fim` e marca a inscrição como `concluido` |
| `sintoma` | `day`, `symptom` | Botão "Estou me sentindo mal"; funciona **sem** inscrição |
| `pausar` / `retomar` | — | Muda `status` da inscrição |

Todas validam sessão + `entitlements` ativo. Campos numéricos passam por faixa (`numIn`/`intIn`), textos por limite de tamanho e os contadores são sanitizados no servidor.

## 7. Banco (`supabase/migrations/011_programas.sql`)

| Tabela | Papel |
|---|---|
| `collections.program_id` (coluna) | Liga o produto ao programa; a migration preenche `detox-7` pelo título |
| `program_enrollments` | Inscrição: `start_date`, `status` (`triagem`/`ativo`/`pausado`/`concluido`/`interrompido`), `egg_intolerance`, `wake_time`, `sleep_time` |
| `program_screenings` | Respostas da triagem + `approved` + `status` |
| `program_measures` | Momento `inicio` e `fim`: peso, cintura, altura, IMC, caminhos das fotos |
| `program_day_progress` | Por dia: refeições, contadores (`jsonb`), jejum, `completed` |
| `program_checkins` | Check-in diário (escalas 1–5, sintomas, nota, medidas opcionais) |
| `program_symptom_logs` | Registro do botão de segurança |

Todas têm **RLS por dono** (`user_id = auth.uid() or is_admin()`) e chave única por `(user_id, program_id[, day|moment])`. Fotos ficam no bucket privado `content-files` em `progress/{userId}/`, entregues por URL assinada.

## 8. Regras de segurança (não remover)

1. **Triagem bloqueia** antes de qualquer início — checada no servidor, não só na tela.
2. **IMC < 18,5 bloqueia** o desafio de 7 dias (tela e API).
3. **Botão fixo "⚠️ Estou me sentindo mal"** em todas as telas do acompanhamento (painel, iniciar, dia, check-in, resultado) — registra o sintoma e oferece pausar o desafio.
4. **Sem promessa de emagrecimento**: nenhuma tela promete quilos ou prazo; o resultado mostra variação e, se a perda passar de ~1,5 kg/semana, aparece aviso para procurar profissional.
5. **Rodapé informativo fixo** em todas as telas: "Conteúdo informativo. Não substitui médico ou nutricionista. Os resultados variam de pessoa para pessoa." (`SAFETY_FOOTER` em `lib/programs/index.ts`).
6. **Dados privados**: RLS por dono + bucket privado; nada é publicado ou comparado entre pessoas.

## 9. Como adicionar um programa novo (ex.: Detox 15 Dias)

Quando o módulo de 15 dias existir:

1. Criar `lib/programs/detox15.ts` exportando um `Program` (mesmo contrato de `lib/programs/types.ts`: `screening`, `days`, `meals`, `counter`, `rules`, `alerts`, `alternative`).
2. Registrar em `lib/programs/index.ts`:
   ```ts
   const PROGRAMS: Record<string, Program> = {
     [detox7.id]: detox7,
     [detox15.id]: detox15,
   };
   ```
3. Se precisar de tabela nova, criar `supabase/migrations/012_*.sql` — **não** editar a `011` (já aplicada).
4. No admin, abrir o produto do desafio de 15 dias e escolher o programa em **Acompanhamento**.
5. Nada mais precisa mudar: rotas, API, `/progresso` e o card do produto são genéricos por `programId`.

O `duracao_dias` do programa controla o cálculo do dia atual e o limite de `day` aceito pela API (1..duração).

## 10. Teste rápido (roteiro)

1. **Admin → Produtos → Desafio Detox 7 dias → Acompanhamento** = "Desafio Detox 7 Dias" → Salvar.
2. Login com usuário de acesso ativo → abrir o produto → card **📅 Meu acompanhamento**.
3. **Iniciar** → responder tudo "Não" → medidas com IMC ≥ 18,5 → data de início hoje → iniciar.
4. Painel deve mostrar **Dia 1 de 7**; abrir o dia, marcar as 5 refeições, mexer na água e concluir.
5. Fazer o check-in do dia 1 (sono/energia/humor) e voltar.
6. Testar o botão **⚠️ Estou me sentindo mal** (registrar sem pausar) e conferir que o desafio continua ativo.
7. Em `/progresso`, conferir o card do programa com progresso e medidas.
8. Para ver o resultado: abrir `/acompanhamento/detox-7/resultado` — antes do último dia mostra aviso; no dia 7 (ou após concluir) libera as medidas finais.
9. Testar bloqueios: gestante = "Sim" → não libera; IMC < 18,5 → botão Continuar desabilitado e API responde 422.

## 11. Fora de escopo (consciente)

- **Notificações push/WhatsApp** dos lembretes: os horários aparecem na tela (1º ovo até 30 min após acordar, última refeição 3h antes de dormir, 2 ovos às 18h), mas não há envio automático.
- **Sincronização offline**.
- **Link direto para a receita** no PDF (o JSON não traz o texto das receitas).
- **Detox 15 Dias** — aguardando o módulo.
