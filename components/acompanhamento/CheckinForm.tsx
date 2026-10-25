"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SYMPTOMS = [
  "Dor de cabeça",
  "Mal-estar",
  "Tremedeira",
  "Enjoo",
  "Diarreia",
  "Irritabilidade",
  "Nenhum",
];

const SCALE = [
  { v: 1, label: "😖" },
  { v: 2, label: "🙁" },
  { v: 3, label: "😐" },
  { v: 4, label: "🙂" },
  { v: 5, label: "😄" },
];

type Checkin = {
  water_cups: number | null;
  sleep: number | null;
  energy: number | null;
  mood: number | null;
  symptoms: string[] | null;
  note: string | null;
  weight_kg: number | string | null;
  waist_cm: number | string | null;
} | null;

function Scale({
  title,
  value,
  onChange,
}: {
  title: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-1 flex gap-2">
        {SCALE.map((s) => (
          <button
            key={s.v}
            type="button"
            onClick={() => onChange(s.v)}
            aria-label={`${title}: ${s.v} de 5`}
            className={`h-10 w-10 rounded-full text-xl ${
              value === s.v ? "bg-[#FF4D8D]" : "bg-neutral-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CheckinForm({
  programId,
  day,
  durationDays,
  initial,
}: {
  programId: string;
  day: number;
  durationDays: number;
  initial: Checkin;
}) {
  const router = useRouter();
  const [water, setWater] = useState(Number(initial?.water_cups ?? 0));
  const [sleep, setSleep] = useState<number | null>(initial?.sleep ?? null);
  const [energy, setEnergy] = useState<number | null>(initial?.energy ?? null);
  const [mood, setMood] = useState<number | null>(initial?.mood ?? null);
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms ?? []);
  const [note, setNote] = useState(initial?.note ?? "");
  const [weight, setWeight] = useState(
    initial?.weight_kg ? String(initial.weight_kg) : ""
  );
  const [waist, setWaist] = useState(initial?.waist_cm ? String(initial.waist_cm) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const mid = Math.ceil(durationDays / 2);
  const suggestMeasures = day === 1 || day === mid || day === durationDays;

  function toggleSymptom(s: string) {
    if (s === "Nenhum") {
      setSymptoms(symptoms.includes("Nenhum") ? [] : ["Nenhum"]);
      return;
    }
    const withoutNone = symptoms.filter((x) => x !== "Nenhum");
    setSymptoms(
      withoutNone.includes(s) ? withoutNone.filter((x) => x !== s) : [...withoutNone, s]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/acompanhamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkin",
          program: programId,
          day,
          waterCups: water,
          sleep,
          energy,
          mood,
          symptoms,
          note,
          weightKg: weight ? Number(weight) : null,
          waistCm: waist ? Number(waist) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push(`/acompanhamento/${programId}/dia/${day}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao salvar");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-24 pt-6 md:px-8">
      <a href={`/acompanhamento/${programId}/dia/${day}`} className="text-sm text-neutral-500">
        ← Voltar ao dia
      </a>
      <h1 className="mt-2 text-2xl font-extrabold">Check-in do dia {day}</h1>
      <p className="text-sm text-neutral-500">
        Sem julgamento: só um registro para você acompanhar como está se sentindo.
      </p>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow">
        <div>
          <p className="text-sm font-semibold">Copos de água</p>
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setWater(Math.max(0, water - 1))}
              className="h-9 w-9 rounded-full border font-bold"
            >
              −
            </button>
            <span className="font-bold">{water}</span>
            <button
              type="button"
              onClick={() => setWater(Math.min(40, water + 1))}
              className="h-9 w-9 rounded-full bg-sky-500 font-bold text-white"
            >
              +
            </button>
          </div>
        </div>

        <Scale title="Sono" value={sleep} onChange={setSleep} />
        <Scale title="Energia" value={energy} onChange={setEnergy} />
        <Scale title="Humor" value={mood} onChange={setMood} />

        <div>
          <p className="text-sm font-semibold">Sintomas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSymptom(s)}
                className={`rounded-full px-3 py-1 text-sm ${
                  symptoms.includes(s)
                    ? "bg-[#FF4D8D] text-white"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className={suggestMeasures ? "rounded-2xl bg-amber-50 p-3" : ""}>
          <p className="text-sm font-semibold">
            Peso e cintura (opcional)
            {suggestMeasures && (
              <span className="ml-1 text-xs font-normal text-amber-700">
                sugestão: medir no início, no meio e no fim
              </span>
            )}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <input
              type="number"
              min={20}
              max={300}
              step="0.1"
              placeholder="Peso (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="rounded-xl border px-4 py-2"
            />
            <input
              type="number"
              min={30}
              max={200}
              step="0.1"
              placeholder="Cintura (cm)"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              className="rounded-xl border px-4 py-2"
            />
          </div>
        </div>

        <label className="text-sm font-semibold">
          Como foi seu dia? (opcional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border px-4 py-2 font-normal"
            placeholder="Algo que queira lembrar depois…"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={saving}
          className="rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar check-in"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-neutral-500">
        Conteúdo informativo. Não substitui médico ou nutricionista.
      </p>
    </div>
  );
}
