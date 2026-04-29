import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-[220px] pt-14 md:pt-0 w-full min-w-0">
        {/* Top bar Desktop only */}
        <header className="hidden md:flex bg-white border-b border-[#e4e7ec] px-6 h-14 items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="text-[13.5px] text-[#475467] font-medium">
            Sistem Inventaris & Kasir Apotek Ranjeng
          </div>
          <div className="text-[12.5px] text-[#98a2b3]">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
