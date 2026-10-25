import { notFound } from "next/navigation";
import { getProgram } from "@/lib/programs";
import StartWizard from "@/components/acompanhamento/StartWizard";
import SafetyButton from "@/components/acompanhamento/SafetyButton";

export const dynamic = "force-dynamic";

export default async function IniciarPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const program = getProgram(programId);
  if (!program) notFound();

  return (
    <>
      <StartWizard
        programId={program.id}
        title={program.title}
        questions={program.screening.questions}
        confirmLabel={program.screening.confirmLabel}
      />
      <SafetyButton programId={program.id} />
    </>
  );
}
