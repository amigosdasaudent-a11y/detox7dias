import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProgram } from "@/lib/programs";
import CheckinForm from "@/components/acompanhamento/CheckinForm";
import SafetyButton from "@/components/acompanhamento/SafetyButton";

export const dynamic = "force-dynamic";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ programId: string; dia: string }>;
}) {
  const { programId, dia } = await params;
  const program = getProgram(programId);
  if (!program) notFound();

  const dayNumber = Number(dia);
  if (!program.days.some((d) => d.day === dayNumber)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_id", program.id)
    .maybeSingle();
  if (!enrollment) redirect(`/acompanhamento/${program.id}/iniciar`);

  const { data: checkin } = await supabase
    .from("program_checkins")
    .select("water_cups, sleep, energy, mood, symptoms, note, weight_kg, waist_cm")
    .eq("user_id", user.id)
    .eq("program_id", program.id)
    .eq("day", dayNumber)
    .maybeSingle();

  return (
    <>
      <CheckinForm
        programId={program.id}
        day={dayNumber}
        durationDays={program.durationDays}
        initial={
          checkin
            ? {
                water_cups: checkin.water_cups,
                sleep: checkin.sleep,
                energy: checkin.energy,
                mood: checkin.mood,
                symptoms: Array.isArray(checkin.symptoms) ? checkin.symptoms : [],
                note: checkin.note,
                weight_kg: checkin.weight_kg,
                waist_cm: checkin.waist_cm,
              }
            : null
        }
      />
      <SafetyButton programId={program.id} day={dayNumber} />
    </>
  );
}
