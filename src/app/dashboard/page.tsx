import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Pill,
  PackageCheck,
  AlertTriangle,
  ShoppingCart,
  CalendarDays,
  CalendarX,
  Package,
} from "lucide-react";

async function getStats(role: string) {
  const today = new Date().toISOString().split("T")[0];
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  const expiryWarningDate = threeMonthsLater.toISOString().split("T")[0];

  // Penjualan hari ini (semua role bisa lihat)
  const { data: penjualanHarian } = await supabase
    .from("transactions")
    .select("total_amount")
    .eq("type", "OUT")
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);

  const totalPenjualanHari =
    penjualanHarian?.reduce((sum, t) => sum + (t.total_amount || 0), 0) ?? 0;
  const totalTransaksiHari = penjualanHarian?.length ?? 0;

  // Stok menipis (semua role bisa lihat)
  const { data: allMeds } = await supabase
    .from("medicines")
    .select("id, name, unit, total_stock, min_stock")
    .order("total_stock", { ascending: true });

  const stokMenipis = (allMeds || []).filter(
    (m) => (m.total_stock ?? 0) <= (m.min_stock ?? 10)
  );

  // Data khusus admin
  let totalObat = 0;
  let hampirExpired = 0;

  if (role === "ADMIN") {
    const { count: cntObat } = await supabase
      .from("medicines")
      .select("*", { count: "exact", head: true });
    totalObat = cntObat ?? 0;

    const { count: cntExpired } = await supabase
      .from("medicine_batches")
      .select("*", { count: "exact", head: true })
      .gt("stock", 0)
      .lte("expired_date", expiryWarningDate)
      .gte("expired_date", today);
    hampirExpired = cntExpired ?? 0;
  }

  return {
    totalObat,
    stokMenipis,
    hampirExpired,
    totalPenjualanHari,
    totalTransaksiHari,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "KASIR";
  const stats = await getStats(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Selamat datang,{" "}
          <span className="font-semibold text-emerald-600">{session?.user?.name}</span>!
          {" "}Anda login sebagai{" "}
          <span className={`font-semibold ${role === "ADMIN" ? "text-purple-500" : "text-emerald-500"}`}>
            {role === "ADMIN" ? "Admin" : "Kasir"}
          </span>
        </p>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Penjualan Hari Ini - semua bisa lihat */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
            <ShoppingCart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Pendapatan Hari Ini</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              Rp {stats.totalPenjualanHari.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
            <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Transaksi Hari Ini</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalTransaksiHari}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
            <AlertTriangle className="h-6 w-6 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Stok Menipis</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.stokMenipis.length}</p>
          </div>
        </div>

        {/* Hanya Admin yang lihat */}
        {role === "ADMIN" ? (
          <>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                <CalendarX className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Hampir Expired</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.hampirExpired}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl">
              <Pill className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Jenis Obat Tersedia</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(stats.stokMenipis.length === 0 ? "✅ Aman" : "⚠️ Cek")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Peringatan Stok Menipis */}
      {stats.stokMenipis.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                ⚠️ {stats.stokMenipis.length} Obat Perlu Direstok
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {role === "KASIR"
                  ? "Segera informasikan ke admin untuk melakukan pembelian."
                  : "Segera lakukan pembelian/restok untuk obat berikut."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stats.stokMenipis.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-800"
              >
                <Package className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-zinc-400">
                    Sisa: <span className="text-red-500 font-bold">{item.total_stock}</span> / Min: {item.min_stock} {item.unit}
                  </p>
                </div>
              </div>
            ))}
            {stats.stokMenipis.length > 6 && (
              <div className="flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                +{stats.stokMenipis.length - 6} lainnya...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aksi Cepat - berbeda per role */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {role === "ADMIN" ? (
            <>
              {[
                { label: "Tambah Obat", href: "/dashboard/obat", icon: Pill, color: "bg-blue-500 hover:bg-blue-600" },
                { label: "Restok / Beli", href: "/dashboard/pembelian", icon: PackageCheck, color: "bg-purple-500 hover:bg-purple-600" },
                { label: "Transaksi Baru", href: "/dashboard/penjualan", icon: ShoppingCart, color: "bg-emerald-500 hover:bg-emerald-600" },
                { label: "Rekap Harian", href: "/dashboard/rekap-harian", icon: CalendarDays, color: "bg-orange-500 hover:bg-orange-600" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`${action.color} text-white flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{action.label}</span>
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              {[
                { label: "Transaksi Baru", href: "/dashboard/penjualan", icon: ShoppingCart, color: "bg-emerald-500 hover:bg-emerald-600" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`${action.color} text-white flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{action.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
