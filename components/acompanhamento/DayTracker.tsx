"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProgramDay } from "@/lib/programs/types";

export type ProgressState = {
  meals: string[];
  counters: Record<string, unknown>;
  fastingStartedAt: string | null;
  fastingEndedAt: string | null;
  completed: boolean;
};

function hm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function minutesUntil(target: string, now: Date): number | null {
  const [h, m] = target.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const t = new Date(now);
  t.setHours(h, m, 0, 0);
  return Math.round((t.getTime() - now.getTime()) / 60000);
}

function formatMinutes(mins: number): string {
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function addMinutes(time: string, delta: number): string {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  const d = new Date();
  d.setHours(h, m + delta, 0, 0);
  return hm(d);
}

export default function DayTracker({
  programId,
  durationDays,
  day,
  initial,
  eggIntolerance,
  wakeTime,
  sleepTime,
  hasCheckin,
}: {
  programId: string;
  durationDays: number;
  day: ProgramDay;
  initial: ProgressState;
  eggIntolerance: boolean;
  wakeTime: string | null;
  sleepTime: string | null;
  hasCheckin: boolean;
}) {
  const [state, setState] = useState<ProgressState>(initial);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const first = window.setTimeout(update, 0);
    const t = window.setInterval(update, 15_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, []);

  const eggAlternative = eggIntolerance && day.type === "ovo" && day.alternative;
  const meals = eggAlternative ? day.alternative!.meals : day.meals;
  const counter = eggAlternative ? undefined : day.counter;
  const rules = eggAlternative ? [] : day.rules;

  async function persist(next: ProgressState) {
    setState(next);
    setSave("saving");
    try {
      const res = await fetch("/api/acompanhamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "progresso",
          program: programId,
          day: day.day,
          meals: next.meals,
          counters: next.counters,
          fastingStartedAt: next.fastingStartedAt,
          fastingEndedAt: next.fastingEndedAt,
          completed: next.completed,
        }),
      });
      setSave(res.ok ? "saved" : "error");
    } catch {
      setSave("error");
    }
  }

  function toggleMeal(id: string) {
    const has = state.meals.includes(id);
    persist({
      ...state,
      meals: has ? state.meals.filter((m) => m !== id) : [...state.meals, id],
    });
  }

  function bump(key: "water" | "eggs" | "apples", delta: number, max: number) {
    const current = Number(state.counters[key] || 0);
    const value = Math.min(max, Math.max(0, current + delta));
    const counters: Record<string, unknown> = { ...state.counters, [key]: value };
    if (key === "eggs" && value !== current) {
      const times = Array.isArray(state.counters.eggTimes)
        ? (state.counters.eggTimes as string[])
        : [];
      counters.eggTimes =
        delta > 0
          ? [...times, new Date().toISOString()].slice(-40)
          : times.slice(0, Math.max(0, times.length - 1));
    }
    persist({ ...state, counters });
  }

  function toggleRule(index: number) {
    const current = Array.isArray(state.counters.rules)
      ? (state.counters.rules as number[])
      : [];
    const has = current.includes(index);
    persist({
      ...state,
      counters: {
        ...state.counters,
        rules: has ? current.filter((r) => r !== index) : [...current, index],
      },
    });
  }

  const water = Number(state.counters.water || 0);
  const eggs = Number(state.counters.eggs || 0);
  const apples = Number(state.counters.apples || 0);

  const eggTimes = useMemo(
    () => (Array.isArray(state.counters.eggTimes) ? (state.counters.eggTimes as string[]) : []),
    [state.counters.eggTimes]
  );
  const lastEgg = eggTimes.length ? new Date(eggTimes[eggTimes.length - 1]) : null;
  const sinceLastEgg =
    now && lastEgg ? Math.floor((now - lastEgg.getTime()) / 60_000) : null;
  const eggAlert =
    sinceLastEgg !== null &&
    day.alerts?.maxHoursWithoutEgg !== undefined &&
    sinceLastEgg >= day.alerts.maxHoursWithoutEgg * 60;

  const fastingTarget = day.fasting?.end || day.fasting?.until;
  const fastingLeft = now && fastingTarget ? minutesUntil(fastingTarget, new Date(now)) : null;

  const goalReached = counter
    ? counter.item === "ovos"
      ? eggs >= (counter.min || 0)
      : apples >= (counter.goal || 0)
    : false;
  const doneMeals = meals ? meals.filter((m) => state.meals.includes(m.id)).length : 0;
  const mealsDone = meals ? doneMeals === meals.length : false;

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-24 pt-6 md:px-8">
      <a href={`/acompanhamento/${programId}`} className="text-sm text-neutral-500">
        ← Meu acompanhamento
      </a>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#B3124F]">
            Dia {day.day} de {durationDays}
          </p>
          <h1 className="text-2xl font-extrabold">{day.title}</h1>
        </div>
        <span className="text-xs text-neutral-500">
          {save === "saving" ? "Salvando…" : save === "saved" ? "Salvo ✓" : save === "error" ? "Falha ao salvar" : ""}
        </span>
      </div>

      {state.completed && (
        <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          ✅ Dia concluído. Você pode voltar e ajustar o que quiser.
        </p>
      )}

      {eggAlternative && (
        <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
          {day.alternative!.label}
        </p>
      )}

      {fastingTarget && (
        <div className="mt-4 rounded-3xl bg-white p-5 shadow">
          <h2 className="font-bold">⏱ Jejum</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {day.fasting?.start ? `Começa às ${day.fasting.start} e termina às ${fastingTarget}.` : `Vai até as ${fastingTarget}.`}
            {day.fasting?.hours ? ` (${day.fasting.hours}h)` : ""}
          </p>
          <p className="mt-2 text-lg font-extrabold">
            {fastingLeft === null
              ? "—"
              : fastingLeft > 0
                ? `Faltam ${formatMinutes(fastingLeft)}`
                : `Janela concluída às ${fastingTarget}`}
          </p>
          {state.fastingStartedAt && !state.fastingEndedAt && (
            <p className="text-xs text-neutral-500">
              Iniciado às {hm(new Date(state.fastingStartedAt))}
            </p>
          )}
          {state.fastingEndedAt && (
            <p className="text-xs font-semibold text-emerald-700">
              Jejum concluído às {hm(new Date(state.fastingEndedAt))}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() =>
                persist({ ...state, fastingStartedAt: new Date().toISOString() })
              }
              className="flex-1 rounded-full border border-[#FF4D8D] py-2 text-sm font-semibold text-[#FF4D8D]"
            >
              Iniciar jejum
            </button>
            <button
              onClick={() => persist({ ...state, fastingEndedAt: new Date().toISOString() })}
              className="flex-1 rounded-full bg-[#FF4D8D] py-2 text-sm font-semibold text-white"
            >
              Jejum concluído
            </button>
          </div>
        </div>
      )}

      {meals && meals.length > 0 && (
        <div className="mt-4 rounded-3xl bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">🍽 Refeições do dia</h2>
            <span className="text-xs text-neutral-500">
              {doneMeals}/{meals.length}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {meals.map((m) => {
              const checked = state.meals.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMeal(m.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left text-sm transition-colors ${
                    checked ? "border-emerald-300 bg-emerald-50" : "border-neutral-200"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                      checked
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-neutral-300 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="w-12 shrink-0 font-bold text-[#B3124F]">{m.time}</span>
                  <span className={checked ? "line-through text-neutral-500" : ""}>
                    {m.description}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Toque para marcar. As receitas completas estão no e-book do produto.
          </p>
        </div>
      )}

      {counter && (
        <div className="mt-4 rounded-3xl bg-white p-5 shadow">
          <h2 className="font-bold">
            {counter.item === "ovos" ? "🥚 Contador de ovos" : "🍎 Contador de maçãs"}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {counter.item === "ovos"
              ? `Meta mínima: ${counter.min} ovos hoje.`
              : `Meta: ${counter.goal} maçãs hoje (a primeira no almoço).`}
          </p>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#FFF5F7] p-4">
            <span className="text-3xl font-extrabold">
              {counter.item === "ovos" ? eggs : apples}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => bump(counter.item === "ovos" ? "eggs" : "apples", -1, 40)}
                className="h-10 w-10 rounded-full border text-lg font-bold"
                aria-label="Diminuir"
              >
                −
              </button>
              <button
                onClick={() => bump(counter.item === "ovos" ? "eggs" : "apples", 1, 40)}
                className="h-10 w-10 rounded-full bg-[#FF4D8D] text-lg font-bold text-white"
                aria-label="Adicionar"
              >
                +
              </button>
            </div>
          </div>
          {counter.item === "ovos" && (
            <div className="mt-3 text-sm">
              {lastEgg ? (
                <p className={eggAlert ? "font-semibold text-red-600" : "text-neutral-600"}>
                  Último ovo há {formatMinutes(sinceLastEgg || 0)}
                  {eggAlert
                    ? ` — passou de ${day.alerts?.maxHoursWithoutEgg}h sem comer ovo.`
                    : ` (limite: ${day.alerts?.maxHoursWithoutEgg}h)`}
                </p>
              ) : (
                <p className="text-neutral-500">
                  Marque o primeiro ovo para começar o cronômetro.
                </p>
              )}
              <div className="mt-2 grid gap-1 text-xs text-neutral-600">
                {wakeTime && <p>1º ovo até {addMinutes(wakeTime, 30)} (30 min após acordar).</p>}
                {sleepTime && <p>Última refeição até {addMinutes(sleepTime, -180)} (3h antes de dormir).</p>}
                {day.alerts?.fixedTime?.map((f) => (
                  <p key={f.time} className="font-semibold">
                    {f.time} · {f.label}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {rules && rules.length > 0 && (
        <div className="mt-4 rounded-3xl bg-white p-5 shadow">
          <h2 className="font-bold">📋 Checklist do dia</h2>
          <div className="mt-3 flex flex-col gap-2">
            {rules.map((r, i) => {
              const checked =
                Array.isArray(state.counters.rules) &&
                (state.counters.rules as number[]).includes(i);
              return (
                <button
                  key={r}
                  onClick={() => toggleRule(i)}
                  className="flex items-start gap-2 text-left text-sm"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                      checked
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-neutral-300 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={checked ? "text-neutral-500 line-through" : ""}>{r}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-3xl bg-white p-5 shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">💧 Água</h2>
          <span className="text-xs text-neutral-500">referência: 8 copos</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                i < water ? "bg-sky-500 text-white" : "bg-sky-50 text-sky-300"
              }`}
            >
              💧
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => bump("water", -1, 40)}
            className="h-9 w-9 rounded-full border font-bold"
            aria-label="Menos água"
          >
            −
          </button>
          <span className="font-bold">{water} copos</span>
          <button
            onClick={() => bump("water", 1, 40)}
            className="h-9 w-9 rounded-full bg-sky-500 font-bold text-white"
            aria-label="Mais água"
          >
            +
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Líquidos permitidos: água, café e chás sem açúcar ou adoçante.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <a
          href={`/acompanhamento/${programId}/checkin/${day.day}`}
          className="rounded-full border border-[#FF4D8D] py-2 text-center font-semibold text-[#FF4D8D]"
        >
          {hasCheckin ? "Editar check-in do dia" : "Fazer check-in do dia"}
        </a>
        <button
          onClick={() => persist({ ...state, completed: true })}
          disabled={state.completed || (!mealsDone && !goalReached && !state.completed)}
          className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-40"
        >
          {state.completed
            ? "Dia concluído ✓"
            : meals
              ? mealsDone
                ? "Concluir o dia"
                : `Marque as ${meals.length} refeições para concluir`
              : goalReached
                ? "Concluir o dia"
                : counter
                  ? "Atinja a meta para concluir"
                  : "Concluir o dia"}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-500">
        Conteúdo informativo. Não substitui médico ou nutricionista. Os resultados variam
        de pessoa para pessoa.
      </p>
    </div>
  );
}
