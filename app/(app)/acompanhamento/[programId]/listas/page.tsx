import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProgram, SAFETY_FOOTER } from "@/lib/programs";
import ShoppingList from "@/components/acompanhamento/ShoppingList";
import SafetyButton from "@/components/acompanhamento/SafetyButton";

export const dynamic = "force-dynamic";

export default async function ListasPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string }>;
  searchParams: Promise<{ semana?: string }>;
}) {
  const { programId } = await params;
  const { semana } = await searchParams;
  const program = getProgram(programId);
  if (!program) notFound();

  const weeks = program.shopping;
  if (!weeks?.length) notFound();

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

  const initialWeek = Number(semana) === 2 ? 2 : 1;

  return (
    <>
      <ShoppingList
        programId={program.id}
        weeks={weeks}
        initialWeek={initialWeek}
        footer={SAFETY_FOOTER}
      />
      <SafetyButton programId={program.id} />
    </>
  );
}
