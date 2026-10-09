import { getSettings } from "./settings";

// Evolution GO (Evogo): autentica com o TOKEN DA INSTÂNCIA no header `apikey`.
// Token: painel GO → Instâncias → Configurações → "Token da Instância".
export type EvoConfig = {
  baseUrl: string;
  token: string;
  instance: string; // nome amigável (só exibição)
};

export async function getEvoConfig(): Promise<EvoConfig> {
  const s = await getSettings(["evo_url", "evo_key", "evo_instance"]);
  const baseUrl = (s.evo_url || "").replace(/\/$/, "");
  if (!baseUrl || !s.evo_key) {
    throw new Error("Evolution não configurada. Ajuste em /admin/integracoes.");
  }
  return { baseUrl, token: s.evo_key, instance: s.evo_instance || "" };
}

async function evoFetch(cfg: EvoConfig, path: string, init?: RequestInit) {
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: { apikey: cfg.token, "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Evolution respondeu HTTP ${res.status}`);
  }
  if (!res.ok) {
    const msg =
      (json as { message?: string; error?: string })?.message ||
      (json as { error?: string })?.error ||
      `erro ${res.status}`;
    throw new Error(String(msg));
  }
  return json;
}

export type EvoState = { connected: boolean; loggedIn: boolean; name: string };

// GET /instance/status -> { data: { Connected, LoggedIn, Name } }
export async function evoStatus(cfg: EvoConfig): Promise<EvoState> {
  const json = (await evoFetch(cfg, "/instance/status")) as {
    data?: { Connected?: boolean; LoggedIn?: boolean; Name?: string };
  };
  return {
    connected: !!json.data?.Connected,
    loggedIn: !!json.data?.LoggedIn,
    name: json.data?.Name || "",
  };
}

// GET /instance/qr -> { data: { qrcode, code } } (base64). Vale ~30s.
export async function evoQr(cfg: EvoConfig): Promise<{ base64?: string; code?: string }> {
  const json = (await evoFetch(cfg, "/instance/qr")) as {
    data?: { qrcode?: string; code?: string };
  };
  return { base64: json.data?.qrcode, code: json.data?.code };
}

// POST /send/text { number, text }. number: só dígitos com DDI (ex: 5511999999999).
export async function evoSendText(cfg: EvoConfig, number: string, text: string) {
  const to = number.replace(/\D/g, "");
  return evoFetch(cfg, "/send/text", {
    method: "POST",
    body: JSON.stringify({ number: to, text }),
  });
}

// POST /send/media { number, type: 'image', url, caption } — imagem com legenda.
export async function evoSendMedia(cfg: EvoConfig, number: string, imageUrl: string, caption: string) {
  const to = number.replace(/\D/g, "");
  return evoFetch(cfg, "/send/media", {
    method: "POST",
    body: JSON.stringify({ number: to, type: "image", url: imageUrl, caption }),
  });
}

// POST /send/link { number, url, title, description, text } — link com prévia rica.
export async function evoSendLink(
  cfg: EvoConfig,
  number: string,
  link: { url: string; title?: string; description?: string; text?: string }
) {
  const to = number.replace(/\D/g, "");
  return evoFetch(cfg, "/send/link", {
    method: "POST",
    body: JSON.stringify({ number: to, ...link }),
  });
}
