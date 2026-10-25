// IMC do acompanhamento (faixas de adulto em 6 níveis, conforme a especificação).

export function imcValue(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  return Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
}

export function imcClass(imc: number): string {
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau I";
  if (imc < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

export const IMC_NOTE =
  "O IMC não considera massa muscular nem distribuição de gordura. Converse com um profissional.";

export function formatNumber(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(digits).replace(".", ",");
}
