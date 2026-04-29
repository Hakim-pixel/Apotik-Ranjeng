import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { AlertTriangle, ShoppingCart, CalendarDays, Package, Pill, PackageCheck } from "lucide-react";

async function getStats(role: string) {
  const today = new Date().toISOString().split("T")[0];
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  const expiryWarningDate = threeMonthsLater.toISOString().split("T")[0];

  const { data: penjualanHarian } = await supabase
    .from("transactions")
    .select("total_amount")
    .eq("type", "OUT")
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);

  const totalPenjualanHari = penjualanHarian?.reduce((sum, t) => sum + (t.total_amount || 0), 0) ?? 0;
  const totalTransaksiHari = penjualanHarian?.length ?? 0;

  const { data: allMeds } = await supabase
    .from("medicines")
    .select("id, name, unit, total_stock, min_stock")
    .order("total_stock", { ascending: true });

  const stokMenipis = (allMeds || []).filter(
    (m) => (m.total_stock ?? 0) <= (m.min_stock ?? 10)
  );

  let totalObat = 0;
  let hampirExpired = 0;

  if (role === "ADMIN") {
    const { count } = await supabase.from("medicines").select("*", { count: "exact", head: true });
    totalObat = count ?? 0;
    const { count: cntExp } = await supabase
      .from("medicine_batches")
      .select("*", { count: "exact", head: true })
      .gt("stock", 0)
      .lte("expired_date", expiryWarningDate)
      .gte("expired_date", today);
    hampirExpired = cntExp ?? 0;
  }

  return { totalObat, stokMenipis, hampirExpired, totalPenjualanHari, totalTransaksiHari };
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8,
      padding: "14px 18px", borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, color: "#98a2b3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#101828" }}>{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "KASIR";
  const stats = await getStats(role);

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#101828", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
          Selamat datang, <strong>{session?.user?.name}</strong> —
          login sebagai <span style={{ color: role === "ADMIN" ? "#7c3aed" : "#0f766e", fontWeight: 600 }}>
            {role === "ADMIN" ? "Admin" : "Kasir"}
          </span>
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Pendapatan Hari Ini" value={`Rp ${stats.totalPenjualanHari.toLocaleString("id-ID")}`} color="#0f766e" />
        <StatCard label="Transaksi Hari Ini" value={stats.totalTransaksiHari} color="#2563eb" />
        <StatCard label="Stok Menipis" value={stats.stokMenipis.length} color="#d97706" />
        {role === "ADMIN"
          ? <StatCard label="Hampir Expired" value={stats.hampirExpired} color="#dc2626" />
          : <StatCard label="Total Jenis Obat" value={stats.stokMenipis.length === 0 ? "✅ Aman" : "⚠️ Perlu Cek"} color="#7c3aed" />
        }
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Aksi Cepat */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#344054", marginBottom: 12 }}>Aksi Cepat</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Link href="/dashboard/penjualan" style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
              background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6,
              textDecoration: "none", color: "#14532d", fontWeight: 500, fontSize: 13,
            }}>
              <ShoppingCart size={15} color="#0f766e" />
              Transaksi Baru (Penjualan)
            </Link>
            {role === "ADMIN" && (
              <>
                <Link href="/dashboard/obat" style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6,
                  textDecoration: "none", color: "#1e3a8a", fontWeight: 500, fontSize: 13,
                }}>
                  <Pill size={15} color="#2563eb" />
                  Kelola Data Obat
                </Link>
                <Link href="/dashboard/pembelian" style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 6,
                  textDecoration: "none", color: "#581c87", fontWeight: 500, fontSize: 13,
                }}>
                  <PackageCheck size={15} color="#7c3aed" />
                  Pembelian / Restok
                </Link>
                <Link href="/dashboard/rekap-harian" style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6,
                  textDecoration: "none", color: "#7c2d12", fontWeight: 500, fontSize: 13,
                }}>
                  <CalendarDays size={15} color="#d97706" />
                  Rekap Harian
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stok Menipis */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={14} color="#d97706" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#344054" }}>
              Stok Perlu Direstok ({stats.stokMenipis.length})
            </span>
          </div>
          {stats.stokMenipis.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#98a2b3", fontSize: 13 }}>
              ✅ Semua stok aman
            </div>
          ) : (
            <div style={{ maxHeight: 180, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8f9fb" }}>
                    <th style={{ padding: "6px 8px", textAlign: "left", color: "#667085", fontWeight: 600, borderBottom: "1px solid #e4e7ec" }}>Nama Obat</th>
                    <th style={{ padding: "6px 8px", textAlign: "right", color: "#667085", fontWeight: 600, borderBottom: "1px solid #e4e7ec" }}>Sisa</th>
                    <th style={{ padding: "6px 8px", textAlign: "right", color: "#667085", fontWeight: 600, borderBottom: "1px solid #e4e7ec" }}>Min</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.stokMenipis.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                      <td style={{ padding: "6px 8px", color: "#101828" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Package size={11} color="#d97706" />
                          {item.name}
                        </div>
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: item.total_stock === 0 ? "#dc2626" : "#d97706" }}>
                        {item.total_stock} {item.unit}
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "right", color: "#98a2b3" }}>
                        {item.min_stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
