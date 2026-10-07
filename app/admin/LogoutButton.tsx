"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
  }
  return (
    <button onClick={logout} className="rounded-full border px-4 py-1 text-sm">
      Sair
    </button>
  );
}
