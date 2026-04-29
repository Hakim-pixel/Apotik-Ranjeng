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
    <div className="bg-white border border-[#e4e7ec] rounded-lg py-3.5 px-4" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="text-[11px] text-[#98a2b3] font-semibold uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-[22px] font-bold text-[#101828] truncate">{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "KASIR";
  const stats = await getStats(role);

  return (
    <div className="max-w-[1100px] w-full mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[18px] md:text-[20px] font-bold text-[#101828] m-0">Dashboard</h1>
        <p className="text-[13px] md:text-[14px] text-[#667085] mt-1 mb-0">
          Selamat datang, <strong>{session?.user?.name}</strong> —
          login sebagai <span className={`font-semibold ${role === "ADMIN" ? "text-[#7c3aed]" : "text-[#0f766e]"}`}>
            {role === "ADMIN" ? "Admin" : "Kasir"}
          </span>
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Pendapatan Hari Ini" value={`Rp ${stats.totalPenjualanHari.toLocaleString("id-ID")}`} color="#0f766e" />
        <StatCard label="Transaksi Hari Ini" value={stats.totalTransaksiHari} color="#2563eb" />
        <StatCard label="Stok Menipis" value={stats.stokMenipis.length} color="#d97706" />
        {role === "ADMIN"
          ? <StatCard label="Hampir Expired" value={stats.hampirExpired} color="#dc2626" />
          : <StatCard label="Total Jenis Obat" value={stats.stokMenipis.length === 0 ? "✅ Aman" : "⚠️ Perlu Cek"} color="#7c3aed" />
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aksi Cepat */}
        <div className="bg-white border border-[#e4e7ec] rounded-lg p-4">
          <div className="text-[14px] font-semibold text-[#344054] mb-3">Aksi Cepat</div>
          <div className="flex flex-col gap-2">
            <Link href="/dashboard/penjualan" className="flex items-center gap-3 px-3 py-2.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-md text-[#14532d] font-medium text-[13.5px] transition-colors hover:bg-[#dcfce7]">
              <ShoppingCart size={16} color="#0f766e" />
              Transaksi Baru (Penjualan)
            </Link>
            {role === "ADMIN" && (
              <>
                <Link href="/dashboard/obat" className="flex items-center gap-3 px-3 py-2.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-md text-[#1e3a8a] font-medium text-[13.5px] transition-colors hover:bg-[#dbeafe]">
                  <Pill size={16} color="#2563eb" />
                  Kelola Data Obat
                </Link>
                <Link href="/dashboard/pembelian" className="flex items-center gap-3 px-3 py-2.5 bg-[#faf5ff] border border-[#e9d5ff] rounded-md text-[#581c87] font-medium text-[13.5px] transition-colors hover:bg-[#f3e8ff]">
                  <PackageCheck size={16} color="#7c3aed" />
                  Pembelian / Restok
                </Link>
                <Link href="/dashboard/rekap-harian" className="flex items-center gap-3 px-3 py-2.5 bg-[#fff7ed] border border-[#fed7aa] rounded-md text-[#7c2d12] font-medium text-[13.5px] transition-colors hover:bg-[#ffedd5]">
                  <CalendarDays size={16} color="#d97706" />
                  Rekap Harian
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="bg-white border border-[#e4e7ec] rounded-lg p-4 flex flex-col h-[280px]">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <AlertTriangle size={16} color="#d97706" />
            <span className="text-[14px] font-semibold text-[#344054]">
              Stok Perlu Direstok ({stats.stokMenipis.length})
            </span>
          </div>
          {stats.stokMenipis.length === 0 ? (
            <div className="text-center py-10 text-[#98a2b3] text-[13.5px] m-auto">
              ✅ Semua stok aman
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 h-full">
              <div className="min-w-[300px]">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr className="bg-[#f8f9fb]">
                      <th className="py-2 px-2.5 text-left text-[#667085] font-semibold border-b border-[#e4e7ec]">Nama Obat</th>
                      <th className="py-2 px-2.5 text-right text-[#667085] font-semibold border-b border-[#e4e7ec]">Sisa</th>
                      <th className="py-2 px-2.5 text-right text-[#667085] font-semibold border-b border-[#e4e7ec] hidden sm:table-cell">Min</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.stokMenipis.map((item) => (
                      <tr key={item.id} className="border-b border-[#f0f2f5] hover:bg-[#f8f9fb]">
                        <td className="py-2 px-2.5 text-[#101828]">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Package size={12} color="#d97706" className="shrink-0" />
                            {item.name}
                          </div>
                        </td>
                        <td className={`py-2 px-2.5 text-right font-bold whitespace-nowrap ${item.total_stock === 0 ? 'text-[#dc2626]' : 'text-[#d97706]'}`}>
                          {item.total_stock} {item.unit}
                        </td>
                        <td className="py-2 px-2.5 text-right text-[#98a2b3] hidden sm:table-cell">
                          {item.min_stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
