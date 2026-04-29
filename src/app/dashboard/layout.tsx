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
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <Sidebar />
      <div className="pl-64">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
