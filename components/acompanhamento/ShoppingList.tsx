"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { ShoppingWeek } from "@/lib/programs/types";

// Pequena store em localStorage: uma chave por programa/semana.
// useSyncExternalStore evita setState dentro de efeito e funciona na hidratação.
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith("shopping:")) callback();
  };
  window.addEventListener("storage", onStorage);
  listeners.add(callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    listeners.delete(callback);
  };
}

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function write(key: string, value: Record<string, boolean>) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sem localStorage: as marcações valem só nesta visita.
  }
  emit();
}

export default function ShoppingList({
  programId,
  weeks,
  initialWeek,
  footer,
}: {
  programId: string;
  weeks: ShoppingWeek[];
  initialWeek: number;
  footer: string;
}) {
  const [week, setWeek] = useState(initialWeek);
  const current = weeks.find((w) => w.week === week) || weeks[0];
  const storageKey = `shopping:${programId}:w${current.week}`;

  const raw = useSyncExternalStore(
    subscribe,
    () => read(storageKey),
    () => ""
  );
  const checked = useMemo(() => {
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      return {};
    }
  }, [raw]);

  const groups = useMemo(() => {
    const map = new Map<string, ShoppingWeek["items"]>();
    for (const item of current.items) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [current]);

  const total = current.items.length;
  const done = current.items.filter((i) => checked[i.id]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  function toggle(id: string) {
    write(storageKey, { ...checked, [id]: !checked[id] });
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-24 pt-6 md:px-8">
      <a href={`/acompanhamento/${programId}`} className="text-sm text-neutral-500">
        ← Meu acompanhamento
      </a>
      <h1 className="mt-2 text-2xl font-extrabold">🛒 Lista de compras</h1>
      <p className="text-sm text-neutral-500">
        Marque o que já tem em casa e o que ainda precisa comprar. As marcações ficam salvas
        neste aparelho.
      </p>

      <div className="mt-4 flex gap-2">
        {weeks.map((w) => (
          <button
            key={w.week}
            type="button"
            onClick={() => setWeek(w.week)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
              current.week === w.week
                ? "bg-[#FF4D8D] text-white"
                : "bg-white text-neutral-600 shadow"
            }`}
          >
            Semana {w.week}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-3xl bg-white p-5 shadow">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold">{current.title}</span>
          <span className="text-neutral-500">
            {done}/{total}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-[#FF4D8D]" style={{ width: `${pct}%` }} />
        </div>
        <button
          type="button"
          onClick={() => write(storageKey, {})}
          className="mt-3 text-xs font-semibold text-neutral-500 underline"
        >
          Limpar marcações desta semana
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {groups.map(([category, items]) => (
          <div key={category} className="rounded-3xl bg-white p-5 shadow">
            <h2 className="font-bold">{category}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {items.map((item) => {
                const isChecked = Boolean(checked[item.id]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    className="flex items-start gap-3 text-left text-sm"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                        isChecked
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-neutral-300 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0">
                      <span className={isChecked ? "text-neutral-400 line-through" : ""}>
                        {item.item}
                      </span>
                      {item.substitution && (
                        <span className="block text-xs text-neutral-500">
                          substituição: {item.substitution}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-neutral-500">{footer}</p>
    </div>
  );
}
