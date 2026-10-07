import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#FFF5F7] px-6 py-16">
      <p className="text-sm font-semibold tracking-wide text-[#FF4D8D]">
        DETOX BODY MAX • PROGRAMA DE 14 DIAS
      </p>
      <h1 className="mt-4 max-w-xl text-center text-4xl font-bold leading-tight">
        Um plano de 14 dias para reorganizar sua alimentação, no seu celular
      </h1>
      <p className="mt-4 max-w-lg text-center text-neutral-600">
        E-books com cardápios e receitas, áudios, vídeos e calculadora de IMC
        em um só app, no seu ritmo.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-full bg-[#FF4D8D] px-8 py-3 text-center font-semibold text-white"
        >
          Quero acessar o programa
        </Link>
        <Link
          href="/inicio"
          className="rounded-full border border-[#FF4D8D] px-8 py-3 text-center font-semibold text-[#FF4D8D]"
        >
          Já paguei, entrar
        </Link>
      </div>
      <p className="mt-4 text-xs text-neutral-500">
        Acesso imediato • Pagamento seguro • Garantia de 30 dias
      </p>
      <p className="mt-10 max-w-lg text-center text-xs text-neutral-500">
        Conteúdo informativo. Não substitui médico ou nutricionista.
      </p>
    </div>
  );
}
