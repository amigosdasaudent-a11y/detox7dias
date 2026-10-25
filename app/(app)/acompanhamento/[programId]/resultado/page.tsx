import { notFound, redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getProgram, currentDayNumber } from "@/lib/programs";
import ResultView from "@/components/acompanhamento/ResultView";
import SafetyButton from "@/components/acompanhamento/SafetyButton";

export const dynamic = "force-dynamic";

function avg(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const program = getProgram(programId);
  if (!program) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("program_id", program.id)
    .maybeSingle();
  if (!enrollment) redirect(`/acompanhamento/${program.id}/iniciar`);

  const [{ data: measures }, { data: progress }, { data: checkins }] = await Promise.all([
    supabase
      .from("program_measures")
      .select("*")
      .eq("user_id", user.id)
      .eq("program_id", program.id),
    supabase
      .from("program_day_progress")
      .select("day, completed, meals")
      .eq("user_id", user.id)
      .eq("program_id", program.id),
    supabase
      .from("program_checkins")
      .select("day, weight_kg, waist_cm, water_cups, sleep, energy, mood")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .order("day"),
  ]);

  const inicio = (measures || []).find((m) => m.moment === "inicio") || null;
  const fim = (measures || []).find((m) => m.moment === "fim") || null;

  const svc = createServiceClient();
  async function sign(path: string | null | undefined): Promise<string | null> {
    if (!path) return null;
    const { data } = await svc.storage.from("content-files").createSignedUrl(path, 600);
    return data?.signedUrl || null;
  }

  const [inicioFront, inicioSide, fimFront, fimSide] = await Promise.all([
    sign(inicio?.photo_front_path),
    sign(inicio?.photo_side_path),
    sign(fim?.photo_front_path),
    sign(fim?.photo_side_path),
  ]);

  const daysCompleted = (progress || []).filter((p) => p.completed).length;
  const mealsMarked = (progress || []).reduce(
    (total, p) => total + (Array.isArray(p.meals) ? p.meals.length : 0),
    0
  );

  const rows = checkins || [];
  const points = rows
    .filter((c) => c.weight_kg || c.waist_cm)
    .map((c) => ({
      day: Number(c.day),
      weight: c.weight_kg === null ? null : Number(c.weight_kg),
      waist: c.waist_cm === null ? null : Number(c.waist_cm),
    }));

  const today = currentDayNumber(enrollment.start_date, program.durationDays);
  const canFinish =
    enrollment.status === "concluido" || Boolean(fim) || today >= program.durationDays;

  return (
    <>
      <ResultView
        programId={program.id}
        programTitle={program.title}
        durationDays={program.durationDays}
        startDate={enrollment.start_date}
        inicio={inicio}
        fim={fim}
        inicioFront={inicioFront}
        inicioSide={inicioSide}
        fimFront={fimFront}
        fimSide={fimSide}
        daysCompleted={daysCompleted}
        mealsMarked={mealsMarked}
        avgWater={avg(rows.map((c) => (c.water_cups === null ? null : Number(c.water_cups))))}
        avgSleep={avg(rows.map((c) => (c.sleep === null ? null : Number(c.sleep))))}
        avgEnergy={avg(rows.map((c) => (c.energy === null ? null : Number(c.energy))))}
        avgMood={avg(rows.map((c) => (c.mood === null ? null : Number(c.mood))))}
        points={points}
        canFinish={canFinish}
      />
      <SafetyButton programId={program.id} />
    </>
  );
}
