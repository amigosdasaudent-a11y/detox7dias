import { getSettings } from "./settings";

export type EvoConfig = {
  baseUrl: string;
  apiKey: string;
  instance: string;
};

export async function getEvoConfig(): Promise<EvoConfig> {
  const s = await getSettings(["evo_url", "evo_key", "evo_instance"]);
  const baseUrl = (s.evo_url || "").replace(/\/$/, "");
  if (!baseUrl || !s.evo_key || !s.evo_instance) {
    throw new Error("Evolution não configurada. Ajuste em /admin/integracoes.");
  }
  return { baseUrl, apiKey: s.evo_key, instance: s.evo_instance };
}

async function evoFetch(cfg: EvoConfig, path: string, init?: RequestInit) {
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: { apikey: cfg.apiKey, "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Evolution respondeu HTTP ${res.status}`);
  }
  if (!res.ok) {
    const msg = (json as { message?: string })?.message || `erro ${res.status}`;
    throw new Error(String(msg));
  }
  return json;
}

// Estado da conexão (open/connecting/close) + dono do número
export async function evoStatus(cfg: EvoConfig) {
  return evoFetch(cfg, `/instance/connectionState/${cfg.instance}`) as Promise<{
    instance?: { state?: string };
  }>;
}

// QR Code para parear (base64). Vale por ~30s; atualize na tela.
export async function evoQr(cfg: EvoConfig) {
  return evoFetch(cfg, `/instance/connect/${cfg.instance}`) as Promise<{
    base64?: string;
    code?: string;
  }>;
}

// Envia texto. number: só dígitos com DDI (ex: 5511999999999).
export async function evoSendText(cfg: EvoConfig, number: string, text: string) {
  const to = number.replace(/\D/g, "");
  return evoFetch(cfg, `/message/sendText/${cfg.instance}`, {
    method: "POST",
    body: JSON.stringify({ number: to, text }),
  });
}
