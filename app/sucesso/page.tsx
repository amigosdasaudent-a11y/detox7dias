import Link from "next/link";

export default function SucessoPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#FFF5F7] px-6 py-16">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold">Pagamento confirmado! 🎉</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Enviamos um convite para o e-mail usado no checkout. Abra-o para
          definir sua senha e entrar no app.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Não achou? Veja o spam. Depois entre com e-mail e senha.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-[#FF4D8D] px-8 py-2 font-semibold text-white"
        >
          Ir para o login
        </Link>
      </div>
    </div>
  );
}
