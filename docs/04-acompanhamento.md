# Detox Body Max — Módulo "Meu acompanhamento" (dia a dia dos desafios)

Atualizado em 07/11/2026. Programas em produção: Detox **7 Dias** e Detox **15 Dias**.

## 1. O que é

Um tipo de módulo novo que vive **dentro do produto**: guia a pessoa do dia 1 ao último dia com plano do dia, jejum, contadores, checklist, medidas, check-in e resultado final.

- A pessoa compra/ganha acesso ao produto normalmente (Stripe ou liberação manual).
- O card **📅 Meu acompanhamento** aparece na página do produto quando `collections.program_id` aponta para um programa.
- **Acesso ao conteúdo continua sendo por `entitlements`**; a inscrição no programa é separada (a pessoa pode ter acesso e nunca iniciar).

## 2. Onde fica cada coisa

| Peça | Caminho |
|---|---|
| Definição do programa (dados) | `lib/programs/detox7.ts` e `lib/programs/detox15.ts` |
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
| `/acompanhamento/[programId]/resultado` | Medidas finais, comparativo início × fim, IMC, médias, gráfico de peso, fotos privadas, texto "Depois do desafio" |
| `/acompanhamento/[programId]/listas` | Listas de compras das semanas 1 e 2, com marcações salvas no aparelho (localStorage) |
| `/progresso` | Histórico de todos os programas (antes era 404) |

`[programId]` inválido → 404. Programa válido sem inscrição → redireciona para `iniciar`.

## 4. Fluxo da pessoa

```
produto → card "Meu acompanhamento" → Iniciar
  → 1. Triagem (6 perguntas no Detox 7 Dias; 8 no Detox 15 Dias)
       bloqueia: menor de 18, gestante/lactante, diabetes, doença renal/hepática,
                 histórico de transtorno alimentar
       medicação contínua: exige confirmação "conversei com meu médico/nutricionista"
       hipertensão (15 Dias): não bloqueia; gera aviso sobre canela/gengibre/pimenta
  → 2. Medidas iniciais (altura, peso, cintura) + fotos opcionais
       IMC < 18,5 → bloqueia o início do desafio
  → 3. Configuração (data de início; intolerância a ovo/horários só em programas
       com dias de ovo; link da lista de compras quando o programa tem listas)
  → Painel → dia a dia → check-in diário → resultado no último dia
```

A triagem é gravada em `program_screenings` e a API `iniciar` **revalida** `approved` no servidor — não dá para pular a triagem pelo navegador. O IMC também é recalculado no servidor.

## 5. Conteúdo dos programas

### 5.1 Detox 7 Dias

- **Dias 1, 2 e 6** — dieta líquida: 5 sucos/sopas por dia, jejum 20h (véspera) → 08h (12h).
- **Dias 3, 4 e 5** — dia do ovo: mínimo 6 ovos, alerta ao passar **5h** sem comer ovo, 2 ovos às 18h, checklist de 9 regras.
  - Quem marcou **intolerância a ovo** vê a alternativa de dieta líquida no lugar (ids próprios para não misturar marcações).
- **Dia 7** — dia da maçã: jejum até 12h, 6 maçãs no dia, checklist.
- **Água** — contador de 8 copos (referência), teto de 40.
- Líquidos permitidos: água, café e chás sem açúcar ou adoçante.

### 5.2 Detox 15 Dias

- **15 dias × 7 refeições** (café da manhã, lanche da manhã, almoço, lanche da tarde, lanche da tarde 2, jantar, ceia), conforme o Apêndice A da especificação.
- **Sem jejum, sem contador de ovos ou de maçãs** — não misturar com o Detox 7 Dias.
- **Água** — 8 copos de 250 ml como referência (`waterGoal`), sem obrigação; líquidos permitidos vêm do programa.
- **Check-in** sugere peso e cintura nos dias **1, 7 e 15** (`measureDays`).
- **Dia 7** — check-in semanal (comparativo parcial no painel) + lista de compras da semana 2.
- **Dia 14** — aviso para separar a mesma roupa das fotos iniciais.
- **Dia 15** — só avaliação: peso, cintura e fotos; sem refeições fixas (o cardápio padrão é "repita um dia que você gostou"). Para definir um cardápio próprio, preencher `meals` no dia 15 em `lib/programs/detox15.ts`.
- **Listas de compras** das duas semanas, com substituições; marcações em `localStorage` (por aparelho).
- **Evitar** — aba com os alimentos/hábitos da seção 5 da especificação.
- **Hipertensão** — quem marcou "sim" na triagem vê o aviso sobre canela, gengibre e pimenta em todos os dias de cardápio.
- **Depois do desafio** — texto de manutenção (`after`) na tela de resultado.

As **receitas completas não estão no app** — a tela remete ao e-book do produto.

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
2. **IMC < 18,5 bloqueia** o desafio (tela e API), em qualquer programa.
3. **Botão fixo "⚠️ Estou me sentindo mal"** em todas as telas do acompanhamento (painel, iniciar, dia, check-in, resultado e listas) — registra o sintoma e oferece pausar o desafio.
4. **Sem promessa de emagrecimento**: nenhuma tela promete quilos ou prazo; o resultado mostra variação e, se a perda passar de ~1,5 kg/semana, aparece aviso para procurar profissional.
5. **Rodapé informativo fixo** em todas as telas: "Conteúdo informativo. Não substitui médico ou nutricionista. Os resultados variam de pessoa para pessoa." (`SAFETY_FOOTER` em `lib/programs/index.ts`).
6. **Dados privados**: RLS por dono + bucket privado; nada é publicado ou comparado entre pessoas.

## 9. Como adicionar um programa novo

1. Criar `lib/programs/<id>.ts` exportando um `Program` (contrato em `lib/programs/types.ts`): `screening`, `days`, `meals`, `counter`, `rules`, `alerts`, `alternative` e, opcionalmente, `waterGoal`, `measureDays`, `avoid`, `shopping`, `hypertensionWarning`, `after`, `notice` (por dia) e `label` (por refeição).
2. Registrar em `lib/programs/index.ts`:
   ```ts
   const PROGRAMS: Record<string, Program> = {
     [detox7.id]: detox7,
     [detox15.id]: detox15,
   };
   ```
3. Se precisar de tabela nova, criar `supabase/migrations/012_*.sql` — **não** editar a `011` (já aplicada).
4. No admin, abrir o produto e escolher o programa em **Acompanhamento**.
5. Nada mais precisa mudar: rotas, API, `/progresso`, listas e o card do produto são genéricos por `programId`.
6. Tipos de dia disponíveis: `liquido`, `ovo`, `maca`, `refeicoes` e `avaliacao` (este último conclui sem refeições/contador).

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

**Detox 15 Dias**

10. **Admin → Produtos → Detox 15 Dias → Acompanhamento** = "Detox 15 Dias" → Salvar.
11. Abrir o produto → card **📅 Meu acompanhamento** → iniciar (responder hipertensão = "Sim" para ver o aviso nos dias de cardápio).
12. Painel: jornada com 15 dias, card do dia, listas das semanas 1 e 2, aba "Evitar".
13. Dia 1: 7 refeições com rótulo (café, lanche, almoço…), água com meta de 8 copos, aviso de hipertensão, link da lista de compras.
14. Check-in do dia 1 deve destacar peso/cintura; conferir que o dia 7 também sugere (check-in semanal).
15. Abrir `/acompanhamento/detox-15/listas` e marcar itens; recarregar a página e conferir que as marcações continuam (localStorage).
16. Dia 15: apenas avaliação (checklist), conclui sem refeições; resultado mostra "Depois do desafio" do 15 Dias.

## 11. Fora de escopo (consciente)

- **Notificações push/WhatsApp** dos lembretes: os horários aparecem na tela (1º ovo até 30 min após acordar, última refeição 3h antes de dormir, 2 ovos às 18h), mas não há envio automático.
- **Sincronização offline**: as marcações da lista de compras ficam em `localStorage` (por aparelho); o progresso do dia usa upsert na API a cada toque.
- **Link direto para a receita** no PDF (o app não traz o texto das receitas).
- **Marcações da lista de compras no banco**: por enquanto ficam só no aparelho (não sincronizam entre celular e computador).
- **Cardápio próprio do dia 15**: o padrão é "repita um dia que você gostou"; para definir refeições fixas, preencher `meals` no dia 15 em `lib/programs/detox15.ts`.
