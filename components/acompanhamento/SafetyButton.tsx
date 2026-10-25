"use client";

import { useState } from "react";

export default function SafetyButton({
  programId,
  day,
}: {
  programId: string;
  day?: number;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState("");

  async function log(pause: boolean) {
    setSaving(true);
    try {
      await fetch("/api/acompanhamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sintoma",
          program: programId,
          day,
          symptom: "mal-estar",
        }),
      });
      if (pause) {
        await fetch("/api/acompanhamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pausar", program: programId }),
        });
      }
      setDone(
        pause
          ? "Sintoma registrado e desafio pausado. Cuide de você e procure atendimento se precisar."
          : "Sintoma registrado no seu diário. Se não passar, procure atendimento médico."
      );
    } catch {
      setDone("Não consegui registrar agora. Se estiver passando mal, procure atendimento.");
    }
    setSaving(false);
  }

  return (
    <>
      <button
        onClick={() => {
          setDone("");
          setOpen(true);
        }}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-red-700"
      >
        ⚠️ Estou me sentindo mal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-extrabold">Sua saúde vem primeiro</h2>
            {done ? (
              <p className="mt-3 text-sm text-neutral-700">{done}</p>
            ) : (
              <>
                <p className="mt-3 text-sm text-neutral-700">
                  Pare o desafio e procure atendimento médico se você estiver com dor de
                  cabeça forte, vômitos ou diarreia persistentes, tremedeira ou mal-estar
                  que não passa.
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Podemos registrar o que você sentiu no seu diário. Isso não substitui
                  avaliação profissional.
                </p>
              </>
            )}
            <div className="mt-5 flex flex-col gap-2">
              {!done && (
                <>
                  <button
                    disabled={saving}
                    onClick={() => log(true)}
                    className="rounded-full bg-red-600 py-2 font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? "Registrando..." : "Registrar e pausar o desafio"}
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => log(false)}
                    className="rounded-full border border-red-300 py-2 font-semibold text-red-700 disabled:opacity-50"
                  >
                    Só registrar o sintoma
                  </button>
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-full py-2 text-sm text-neutral-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
