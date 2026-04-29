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
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}>
      <Sidebar />
      <div style={{ marginLeft: "220px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header style={{
          background: "#fff", borderBottom: "1px solid #e4e7ec",
          padding: "0 20px", height: "44px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ fontSize: "13px", color: "#475467" }}>
            Sistem Inventaris &amp; Kasir Apotek Ranjeng
          </div>
          <div style={{ fontSize: "12px", color: "#98a2b3" }}>
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </header>
        <main style={{ flex: 1, padding: "20px 24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
