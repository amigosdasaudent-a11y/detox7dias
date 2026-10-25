import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProgram } from "@/lib/programs";
import DayTracker from "@/components/acompanhamento/DayTracker";
import SafetyButton from "@/components/acompanhamento/SafetyButton";

export const dynamic = "force-dynamic";

export default async function DiaPage({
  params,
}: {
  params: Promise<{ programId: string; dia: string }>;
}) {
  const { programId, dia } = await params;
  const program = getProgram(programId);
  if (!program) notFound();

  const dayNumber = Number(dia);
  const day = program.days.find((d) => d.day === dayNumber);
  if (!day) notFound();

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

  const [{ data: progress }, { data: checkin }] = await Promise.all([
    supabase
      .from("program_day_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .eq("day", dayNumber)
      .maybeSingle(),
    supabase
      .from("program_checkins")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .eq("day", dayNumber)
      .maybeSingle(),
  ]);

  return (
    <>
      <DayTracker
        programId={program.id}
        durationDays={program.durationDays}
        day={day}
        initial={{
          meals: Array.isArray(progress?.meals) ? (progress.meals as string[]) : [],
          counters:
            progress?.counters && typeof progress.counters === "object"
              ? (progress.counters as Record<string, unknown>)
              : {},
          fastingStartedAt: progress?.fasting_started_at || null,
          fastingEndedAt: progress?.fasting_ended_at || null,
          completed: Boolean(progress?.completed),
        }}
        eggIntolerance={Boolean(enrollment.egg_intolerance)}
        wakeTime={enrollment.wake_time || null}
        sleepTime={enrollment.sleep_time || null}
        hasCheckin={Boolean(checkin)}
      />
      <SafetyButton programId={program.id} day={dayNumber} />
    </>
  );
}
