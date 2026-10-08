// Upload direto navegador -> Supabase (contorna o limite de 4,5MB da Vercel)

async function readErr(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j.error || `Erro ${res.status}`;
  } catch {
    return res.ok ? "resposta inválida do servidor" : `Erro ${res.status}`;
  }
}

export async function uploadAdminFile(file: File, bucket: string): Promise<string> {
  const meta = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, name: file.name }),
  });
  if (!meta.ok) throw new Error(await readErr(meta));
  const { signedUrl, path } = await meta.json();

  const up = await fetch(signedUrl, {
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
  return path as string;
}
