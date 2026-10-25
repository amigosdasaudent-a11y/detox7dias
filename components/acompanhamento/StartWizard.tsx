"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FileDrop from "@/components/FileDrop";
import { imcClass, imcValue, IMC_NOTE, formatNumber } from "@/lib/imc";
import { uploadProgressPhoto } from "@/lib/progress-upload";
import type { ScreeningQuestion } from "@/lib/programs/types";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function StartWizard({
  programId,
  title,
  questions,
  confirmLabel,
}: {
  programId: string;
  title: string;
  questions: ScreeningQuestion[];
  confirmLabel: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [photoFront, setPhotoFront] = useState<string | null>(null);
  const [photoSide, setPhotoSide] = useState<string | null>(null);
  const [uploading, setUploading] = useState("");

  const [startDate, setStartDate] = useState(todayLocal());
  const [eggIntolerance, setEggIntolerance] = useState(false);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/acompanhamento?program=${programId}`);
      if (!alive) return;
      if (res.status === 401) return router.replace("/login");
      if (res.ok) {
        const json = await res.json();
        if (json.enrollment) {
          router.replace(`/acompanhamento/${programId}`);
          return;
        }
        if (json.screening?.approved) setStep(2);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [programId, router]);

  const needsConfirmation = useMemo(
    () => questions.some((q) => q.requiresConfirmation && answers[q.key] === true),
    [questions, answers]
  );

  const imc = imcValue(Number(weight), Number(height));
  const imcLow = imc > 0 && imc < 18.5;

  async function sendTriagem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setBlockedMsg("");
    try {
      const res = await fetch("/api/acompanhamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "triagem",
          program: programId,
          answers,
          confirmed,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.approved) {
        setStep(2);
      } else if (json.status === "confirmacao_pendente") {
        setBlockedMsg(
          "Para seguir, confirme que você conversou com seu médico ou nutricionista sobre iniciar este desafio."
        );
      } else {
        setBlockedMsg(
          "Pelas suas respostas, este desafio não é indicado para você agora. Por segurança, não vamos liberar o início. Procure um médico ou nutricionista para orientação."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao enviar a triagem");
    }
    setSaving(false);
  }

  async function uploadPhoto(file: File | null, side: "front" | "side") {
    if (!file) return;
    setUploading(side);
    setError("");
    try {
      const path = await uploadProgressPhoto(file);
      if (side === "front") setPhotoFront(path);
      else setPhotoSide(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "falha no envio da foto");
    }
    setUploading("");
  }

  async function sendInicio() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/acompanhamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "iniciar",
          program: programId,
          startDate,
          heightCm: Number(height),
          weightKg: Number(weight),
          waistCm: waist ? Number(waist) : null,
          photoFrontPath: photoFront,
          photoSidePath: photoSide,
          eggIntolerance,
          wakeTime,
          sleepTime,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.replace(`/acompanhamento/${programId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao iniciar");
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-xl px-4 py-10 text-sm text-neutral-500">Carregando…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-6 md:px-8">
      <a href={`/acompanhamento/${programId}`} className="text-sm text-neutral-500">
        ← Voltar
      </a>
      <h1 className="mt-2 text-2xl font-extrabold">{title}</h1>

      <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              step >= n ? "bg-[#FF4D8D] text-white" : "bg-neutral-200 text-neutral-500"
            }`}
          >
            {n}
          </span>
        ))}
        <span className="text-neutral-500">
          {step === 1 ? "Triagem" : step === 2 ? "Antes de começar" : "Configuração"}
        </span>
      </div>

      {step === 1 && (
        <form onSubmit={sendTriagem} className="mt-4 rounded-3xl bg-white p-6 shadow">
          <p className="text-sm text-neutral-600">
            Antes de começar, responda com sinceridade. Estas perguntas são de segurança e
            não ficam visíveis para outras pessoas.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {questions.map((q) => (
              <div key={q.key} className="rounded-2xl border p-3">
                <p className="text-sm font-semibold">{q.label}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.key]: false }))}
                    className={`rounded-full px-4 py-1 text-sm font-semibold ${
                      answers[q.key] === false
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.key]: true }))}
                    className={`rounded-full px-4 py-1 text-sm font-semibold ${
                      answers[q.key] === true
                        ? "bg-[#FF4D8D] text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
            ))}
          </div>

          {needsConfirmation && (
            <label className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span>{confirmLabel}</span>
            </label>
          )}

          {blockedMsg && (
            <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{blockedMsg}</p>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            disabled={saving || Object.keys(answers).length < questions.length}
            className="mt-4 w-full rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Verificando..." : "Continuar"}
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="mt-4 rounded-3xl bg-white p-6 shadow">
          <h2 className="font-bold">Antes de começar</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Anote suas medidas. A cintura é a medida mais importante para acompanhar o
            resultado. As fotos são opcionais e ficam privadas.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold">
              Altura (cm)
              <input
                type="number"
                min={100}
                max={250}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              Peso (kg)
              <input
                type="number"
                min={20}
                max={300}
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 font-normal"
              />
            </label>
            <label className="col-span-2 text-sm font-semibold">
              Cintura (cm)
              <input
                type="number"
                min={30}
                max={200}
                step="0.1"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 font-normal"
              />
            </label>
          </div>

          {imc > 0 && (
            <div className={`mt-3 rounded-2xl p-3 text-sm ${imcLow ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
              <b>IMC {formatNumber(imc)}</b> — {imcClass(imc)}
              {imcLow && (
                <p className="mt-1">
                  Seu IMC está abaixo de 18,5. Por segurança, o desafio de 7 dias não deve
                  ser iniciado. Procure um médico ou nutricionista.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-3">
            <FileDrop
              title="Foto de frente (opcional)"
              hint={uploading === "front" ? "Enviando..." : "Roupa curta, como você está hoje"}
              accept="image/*"
              onFile={(f) => uploadPhoto(f, "front")}
            />
            <FileDrop
              title="Foto de lado (opcional)"
              hint={uploading === "side" ? "Enviando..." : "Mesma roupa da foto de frente"}
              accept="image/*"
              onFile={(f) => uploadPhoto(f, "side")}
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            onClick={() => setStep(3)}
            disabled={!height || !weight || imcLow || Boolean(uploading)}
            className="mt-4 w-full rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
          >
            Continuar
          </button>
          <p className="mt-2 text-xs text-neutral-500">{IMC_NOTE}</p>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 rounded-3xl bg-white p-6 shadow">
          <h2 className="font-bold">Configuração do desafio</h2>
          <label className="mt-4 block text-sm font-semibold">
            Data de início
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-xl border px-4 py-2 font-normal"
            />
          </label>
          <label className="mt-3 flex items-start gap-2 rounded-2xl bg-neutral-50 p-3 text-sm">
            <input
              type="checkbox"
              checked={eggIntolerance}
              onChange={(e) => setEggIntolerance(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Tenho intolerância a ovo — trocar os dias do ovo por dieta líquida (opção
              prevista no e-book).
            </span>
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold">
              Que horas você acorda?
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              Que horas você dorme?
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 font-normal"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Usamos esses horários só para os lembretes do dia do ovo (primeiro ovo até 30
            min depois de acordar e última refeição 3h antes de dormir).
          </p>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            onClick={sendInicio}
            disabled={saving || !startDate}
            className="mt-4 w-full rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Iniciando..." : "Iniciar meu desafio"}
          </button>
          <button
            onClick={() => setStep(2)}
            className="mt-2 w-full rounded-full py-2 text-sm text-neutral-500"
          >
            Voltar
          </button>
        </div>
      )}
    </div>
  );
}
