import { createServiceClient } from "@/lib/supabase/server";

// Lê configurações sensíveis (tabela settings, só service_role). Sem cache: checkout/webhook são baixo volume.
export async function getSetting(key: string): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .single();
    return data?.value || null;
  } catch {
    return null;
  }
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    keys.map(async (k) => {
      const v = await getSetting(k);
      if (v) out[k] = v;
    })
  );
  return out;
}
