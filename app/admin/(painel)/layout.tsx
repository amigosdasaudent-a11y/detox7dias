import { adminGuard } from "../layout";
import AdminSidebar from "@/components/AdminSidebar";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await adminGuard();
  return (
    <div className="flex min-h-screen bg-[#FFF5F7]">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
