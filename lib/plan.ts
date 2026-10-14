// Hierarquia de planos: essencial < completo < vitalicio
export const PLAN_RANK: Record<string, number> = {
  essencial: 0,
  completo: 1,
  vitalicio: 2,
};

export function planRank(plan: string | null | undefined): number {
  if (!plan) return -1;
  return PLAN_RANK[plan] ?? -1;
}

// Maior plano entre liberações ativas
export function maxPlan(plans: (string | null | undefined)[]): string {
  let best = "essencial";
  for (const p of plans) {
    if (planRank(p) > planRank(best)) best = p as string;
  }
  return best;
}

// min_plan exigido cabe no plano do usuário?
export function planAllowed(minPlan: string | null | undefined, userPlan: string): boolean {
  return planRank(userPlan) >= planRank(minPlan || "essencial");
}
