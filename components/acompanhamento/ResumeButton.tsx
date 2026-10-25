"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResumeButton({ programId }: { programId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function resume() {
    setSaving(true);
    await fetch("/api/acompanhamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retomar", program: programId }),
    });
    router.refresh();
    setSaving(false);
  }

  return (
    <button
      onClick={resume}
      disabled={saving}
      className="rounded-full bg-[#FF4D8D] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
    >
      {saving ? "Retomando..." : "Retomar desafio"}
    </button>
  );
}
