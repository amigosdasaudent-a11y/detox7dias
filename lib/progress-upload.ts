// Upload de fotos do acompanhamento direto para o bucket privado.

export async function uploadProgressPhoto(file: File): Promise<string> {
  const meta = await fetch("/api/acompanhamento/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name }),
  });
  const json = await meta.json();
  if (!meta.ok) throw new Error(json.error || `Erro ${meta.status}`);

  const up = await fetch(json.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!up.ok) {
    throw new Error(
      up.status === 413
        ? "Arquivo grande demais para o plano atual do Storage."
        : `Falha no envio (${up.status}). Tente de novo.`
    );
  }
  return json.path as string;
}
