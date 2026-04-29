import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  Pill,
  PackageCheck,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  CalendarX,
} from "lucide-react";

async function getStats() {
  const today = new Date().toISOString().split("T")[0];
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  const expiryWarningDate = threeMonthsLater.toISOString().split("T")[0];

  const [
    { count: totalObat },
    { count: stokMenipis },
    { count: hampirExpired },
    { data: penjualanHarian },
  ] = await Promise.all([
    supabase.from("medicines").select("*", { count: "exact", head: true }),
    supabase
      .from("medicines")
      .select("*", { count: "exact", head: true })
      .lte("total_stock", supabase.rpc as unknown as number)
      .filter("total_stock", "lte", "min_stock"),
    supabase
      .from("medicine_batches")
      .select("*", { count: "exact", head: true })
      .gt("stock", 0)
      .lte("expired_date", expiryWarningDate)
      .gte("expired_date", today),
    supabase
      .from("transactions")
      .select("total_amount")
      .eq("type", "OUT")
      .gte("created_at", `${today}T00:00:00`),
  ]);

  const totalPenjualanHari =
    penjualanHarian?.reduce((sum, t) => sum + (t.total_amount || 0), 0) ?? 0;

  return {
    totalObat: totalObat ?? 0,
    stokMenipis: stokMenipis ?? 0,
    hampirExpired: hampirExpired ?? 0,
    totalPenjualanHari,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getStats();

  const cards = [
    {
      label: "Total Jenis Obat",
      value: stats.totalObat,
      icon: Pill,
      color: "bg-blue-500",
      light: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Stok Menipis",
      value: stats.stokMenipis,
      icon: AlertTriangle,
      color: "bg-orange-500",
      light: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Hampir Expired (< 3 bln)",
      value: stats.hampirExpired,
      icon: CalendarX,
      color: "bg-red-500",
      light: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-600 dark:text-red-400",
    },
    {
      label: "Penjualan Hari Ini",
      value: `Rp ${stats.totalPenjualanHari.toLocaleString("id-ID")}`,
      icon: ShoppingCart,
      color: "bg-emerald-500",
      light: "bg-emerald-50 dark:bg-emerald-900/20",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Selamat datang kembali,{" "}
          <span className="font-semibold text-emerald-600">
            {session?.user?.name}
          </span>
          ! 👋
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4"
            >
              <div className={`${card.light} p-3 rounded-xl`}>
                <Icon className={`h-6 w-6 ${card.textColor}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {card.label}
                </p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            Aksi Cepat
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Tambah Obat",
              href: "/dashboard/obat/tambah",
              icon: Pill,
              color: "bg-blue-500 hover:bg-blue-600",
            },
            {
              label: "Restok",
              href: "/dashboard/pembelian/tambah",
              icon: PackageCheck,
              color: "bg-purple-500 hover:bg-purple-600",
            },
            {
              label: "Transaksi Baru",
              href: "/dashboard/penjualan/baru",
              icon: ShoppingCart,
              color: "bg-emerald-500 hover:bg-emerald-600",
            },
            {
              label: "Cek Hampir Expired",
              href: "/dashboard/laporan/expired",
              icon: CalendarX,
              color: "bg-red-500 hover:bg-red-600",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className={`${action.color} text-white flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-semibold">{action.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Notifikasi Warning */}
      {(stats.stokMenipis > 0 || stats.hampirExpired > 0) && (
        <div className="space-y-3">
          {stats.stokMenipis > 0 && (
            <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-2xl">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm">
                  ⚠️ {stats.stokMenipis} obat stoknya menipis
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                  Segera lakukan restok sebelum kehabisan.
                </p>
              </div>
            </div>
          )}
          {stats.hampirExpired > 0 && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl">
              <CalendarX className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300 text-sm">
                  🔴 {stats.hampirExpired} batch obat akan expired dalam 3 bulan
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  Prioritaskan penjualan batch ini (FEFO).
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
