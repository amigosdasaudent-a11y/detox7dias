"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileDrop from "@/components/FileDrop";
import { imcClass, imcValue, IMC_NOTE, formatNumber } from "@/lib/imc";
import { uploadProgressPhoto } from "@/lib/progress-upload";

type Measure = {
  weight_kg: number | string | null;
  waist_cm: number | string | null;
  height_cm: number | string | null;
  imc: number | string | null;
  photo_front_path: string | null;
  photo_side_path: string | null;
} | null;

type Point = { day: number; weight: number | null; waist: number | null };

export default function ResultView({
  programId,
  programTitle,
  durationDays,
  startDate,
  inicio,
  fim,
  inicioFront,
  inicioSide,
  fimFront,
  fimSide,
  daysCompleted,
  mealsMarked,
  avgWater,
  avgSleep,
  avgEnergy,
  avgMood,
  points,
  canFinish,
}: {
  programId: string;
  programTitle: string;
  durationDays: number;
  startDate: string;
  inicio: Measure;
  fim: Measure;
  inicioFront: string | null;
  inicioSide: string | null;
  fimFront: string | null;
  fimSide: string | null;
  daysCompleted: number;
  mealsMarked: number;
  avgWater: number | null;
  avgSleep: number | null;
  avgEnergy: number | null;
  avgMood: number | null;
  points: Point[];
  canFinish: boolean;
}) {
  const router = useRouter();
  const [weight, setWeight] = useState(fim?.weight_kg ? String(fim.weight_kg) : "");
  const [waist, setWaist] = useState(fim?.waist_cm ? String(fim.waist_cm) : "");
  const [photoFront, setPhotoFront] = useState<string | null>(null);
  const [photoSide, setPhotoSide] = useState<string | null>(null);
  const [uploading, setUploading] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const w0 = Number(inicio?.weight_kg ?? 0) || null;
  const w1 = Number(fim?.weight_kg ?? 0) || null;
  const c0 = Number(inicio?.waist_cm ?? 0) || null;
  const c1 = Number(fim?.waist_cm ?? 0) || null;
  const imc0 = Number(inicio?.imc ?? 0) || null;
  const imc1 = Number(fim?.imc ?? 0) || null;

  const weightDiff = w0 && w1 ? w1 - w0 : null;
  const waistDiff = c0 && c1 ? c1 - c0 : null;
  const weeklyLoss = w0 && w1 ? ((w0 - w1) / durationDays) * 7 : 0;

  async function uploadPhoto(file: File | null, side: "front" | "side") {
    if (!file) return;
    setUploading(side);
    setError("");
    try {
      const path = await uploadProgressPhoto(file);
      if (side === "front") setPhotoFront(path);
      else setPhotoSide(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "falha no envio");
    }
    setUploading("");
  }

  async function saveFinal() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/acompanhamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "medidas",
          program: programId,
          weightKg: Number(weight),
          waistCm: waist ? Number(waist) : null,
          photoFrontPath: photoFront,
          photoSidePath: photoSide,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao salvar");
    }
    setSaving(false);
  }

  const imcPreview =
    !fim && weight && inicio?.height_cm
      ? imcValue(Number(weight), Number(inicio.height_cm))
      : null;

  const maxWeight = Math.max(...points.map((p) => p.weight || 0), w0 || 0, w1 || 0);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-6 md:px-8">
      <a href={`/acompanhamento/${programId}`} className="text-sm text-neutral-500">
        ← Meu acompanhamento
      </a>
      <h1 className="mt-2 text-2xl font-extrabold">Resultado · {programTitle}</h1>
      <p className="text-sm text-neutral-500">
        Início em {new Date(`${startDate}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
        {durationDays} dias
      </p>

      {!fim && canFinish && (
        <div className="mt-4 rounded-3xl bg-white p-6 shadow">
          <h2 className="font-bold">Medidas finais</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Para fechar o desafio, anote seu peso e cintura. As fotos são opcionais e ficam
            privadas. Se puder, use a mesma roupa das fotos iniciais.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
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
            <label className="text-sm font-semibold">
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
          {imcPreview && (
            <p className="mt-2 text-sm text-neutral-600">
              IMC {formatNumber(imcPreview)} — {imcClass(imcPreview)}
            </p>
          )}
          <div className="mt-4 grid gap-3">
            <FileDrop
              title="Foto de frente (opcional)"
              hint={uploading === "front" ? "Enviando..." : "Mesma roupa das fotos iniciais"}
              accept="image/*"
              onFile={(f) => uploadPhoto(f, "front")}
            />
            <FileDrop
              title="Foto de lado (opcional)"
              hint={uploading === "side" ? "Enviando..." : "Mesma roupa das fotos iniciais"}
              accept="image/*"
              onFile={(f) => uploadPhoto(f, "side")}
            />
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            onClick={saveFinal}
            disabled={saving || !weight || Boolean(uploading)}
            className="mt-4 w-full rounded-full bg-[#FF4D8D] py-2 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Concluir desafio"}
          </button>
        </div>
      )}

      {!fim && !canFinish && (
        <div className="mt-4 rounded-3xl bg-white p-6 shadow">
          <h2 className="font-bold">Resultado final</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Você ainda está no meio do desafio. As medidas finais e o comparativo ficam
            disponíveis no último dia — mas você pode acompanhar seu progresso na tela do
            acompanhamento.
          </p>
          <a
            href={`/acompanhamento/${programId}`}
            className="mt-4 inline-block rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white"
          >
            Voltar ao acompanhamento
          </a>
        </div>
      )}

      {fim && (
        <>
          <div className="mt-4 rounded-3xl bg-white p-6 shadow">
            <h2 className="font-bold">Início × fim</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="text-left text-xs font-semibold uppercase text-neutral-400">
                Medida
              </div>
              <div className="text-xs font-semibold uppercase text-neutral-400">Início</div>
              <div className="text-xs font-semibold uppercase text-neutral-400">Fim</div>

              <div className="text-left font-semibold">Peso</div>
              <div>{formatNumber(w0)} kg</div>
              <div>
                {formatNumber(w1)} kg
                {weightDiff !== null && (
                  <span className="block text-xs text-neutral-500">
                    {weightDiff > 0 ? "+" : ""}
                    {formatNumber(weightDiff)} kg
                  </span>
                )}
              </div>

              <div className="text-left font-semibold">Cintura</div>
              <div>{formatNumber(c0)} cm</div>
              <div>
                {formatNumber(c1)} cm
                {waistDiff !== null && (
                  <span className="block text-xs text-neutral-500">
                    {waistDiff > 0 ? "+" : ""}
                    {formatNumber(waistDiff)} cm
                  </span>
                )}
              </div>

              <div className="text-left font-semibold">IMC</div>
              <div>{formatNumber(imc0)}</div>
              <div>
                {formatNumber(imc1)}
                {imc1 !== null && (
                  <span className="block text-xs text-neutral-500">{imcClass(imc1)}</span>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-neutral-500">{IMC_NOTE}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-white p-4 text-center shadow">
              <p className="text-2xl font-extrabold">{daysCompleted}</p>
              <p className="text-xs text-neutral-500">dias concluídos de {durationDays}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-center shadow">
              <p className="text-2xl font-extrabold">{mealsMarked}</p>
              <p className="text-xs text-neutral-500">refeições marcadas</p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-center shadow">
              <p className="text-2xl font-extrabold">{formatNumber(avgWater, 1)}</p>
              <p className="text-xs text-neutral-500">copos de água (média)</p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-center shadow">
              <p className="text-2xl font-extrabold">
                {formatNumber(avgSleep, 1)} / {formatNumber(avgEnergy, 1)} /{" "}
                {formatNumber(avgMood, 1)}
              </p>
              <p className="text-xs text-neutral-500">sono / energia / humor</p>
            </div>
          </div>

          {points.some((p) => p.weight) && (
            <div className="mt-4 rounded-3xl bg-white p-6 shadow">
              <h2 className="font-bold">Peso ao longo do desafio</h2>
              <div className="mt-3 flex h-32 items-end gap-2">
                {points
                  .filter((p) => p.weight)
                  .map((p) => (
                    <div key={p.day} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] text-neutral-500">
                        {formatNumber(p.weight)}
                      </span>
                      <div
                        className="w-full rounded-t bg-[#FF4D8D]"
                        style={{
                          height: `${Math.max(6, ((p.weight || 0) / (maxWeight || 1)) * 90)}px`,
                        }}
                      />
                      <span className="text-[10px] text-neutral-400">d{p.day}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {(inicioFront || fimFront) && (
            <div className="mt-4 rounded-3xl bg-white p-6 shadow">
              <h2 className="font-bold">Fotos (só você vê)</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Photo label="Início · frente" url={inicioFront} />
                <Photo label="Fim · frente" url={fimFront} />
                <Photo label="Início · lado" url={inicioSide} />
                <Photo label="Fim · lado" url={fimSide} />
              </div>
            </div>
          )}

          <div className="mt-4 rounded-3xl bg-[#FFF5F7] p-6">
            <h2 className="font-bold">E agora?</h2>
            <p className="mt-2 text-sm text-neutral-700">
              Você concluiu o desafio de {durationDays} dias. O detox é um começo: mantenha
              os alimentos e os horários que funcionaram para você, sem exageros, e siga
              bebendo água ao longo do dia.
            </p>
            <p className="mt-2 text-sm text-neutral-700">
              O próximo passo é o desafio de 15 dias, mais equilibrado, com cardápio de duas
              semanas e manutenção. Ele estará disponível aqui no app.
            </p>
            {weeklyLoss > 1.5 && (
              <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
                A variação de peso foi rápida para o período. Vale conversar com um médico
                ou nutricionista antes de continuar.
              </p>
            )}
            <p className="mt-3 text-xs text-neutral-500">
              Se quiser compartilhar sua experiência, use #desafiodetox7dias. Nada é
              publicado automaticamente.
            </p>
            <a
              href="/inicio"
              className="mt-4 inline-block rounded-full bg-[#FF4D8D] px-6 py-2 font-semibold text-white"
            >
              Voltar ao início
            </a>
          </div>
        </>
      )}

      <p className="mt-4 text-center text-xs text-neutral-500">
        Conteúdo informativo. Não substitui médico ou nutricionista. Os resultados variam
        de pessoa para pessoa.
      </p>
    </div>
  );
}

function Photo({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="mt-1 aspect-[3/4] w-full rounded-2xl object-cover" />
      ) : (
        <div className="mt-1 flex aspect-[3/4] w-full items-center justify-center rounded-2xl bg-neutral-100 text-xs text-neutral-400">
          sem foto
        </div>
      )}
    </div>
  );
}
