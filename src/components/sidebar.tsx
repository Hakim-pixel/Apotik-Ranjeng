"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Activity,
  LayoutDashboard,
  Pill,
  PackagePlus,
  ShoppingCart,
  BarChart3,
  Users,
  ClipboardList,
  Bell,
  LogOut,
  ChevronRight,
  Boxes,
  CalendarDays,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "KASIR"],
  },
  {
    label: "Data Obat",
    href: "/dashboard/obat",
    icon: Pill,
    roles: ["ADMIN"],
  },
  {
    label: "Stok & Batch",
    href: "/dashboard/stok",
    icon: Boxes,
    roles: ["ADMIN"],
  },
  {
    label: "Pembelian / Restok",
    href: "/dashboard/pembelian",
    icon: PackagePlus,
    roles: ["ADMIN"],
  },
  {
    label: "Penjualan (Kasir)",
    href: "/dashboard/penjualan",
    icon: ShoppingCart,
    roles: ["ADMIN", "KASIR"],
  },
  {
    label: "Rekap Harian",
    href: "/dashboard/rekap-harian",
    icon: CalendarDays,
    roles: ["ADMIN"],
  },
  {
    label: "Laporan",
    href: "/dashboard/laporan",
    icon: BarChart3,
    roles: ["ADMIN"],
  },
  {
    label: "Manajemen User",
    href: "/dashboard/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Audit Trail",
    href: "/dashboard/audit",
    icon: ClipboardList,
    roles: ["ADMIN"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "KASIR";

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-white flex flex-col shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
        <div className="bg-emerald-500 p-2 rounded-lg">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">Inventaris</p>
          <p className="font-bold text-sm text-emerald-400 leading-tight">
            Apotek
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="bg-zinc-800 rounded-xl p-3">
          <p className="text-sm font-semibold text-white truncate">
            {session?.user?.name || "User"}
          </p>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
              role === "ADMIN"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-emerald-500/20 text-emerald-400"
            }`}
          >
            {role === "ADMIN" ? "Admin" : "Kasir"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Notifikasi & Logout */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
        <Link
          href="/dashboard/notifikasi"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
        >
          <Bell className="h-4 w-4" />
          <span>Notifikasi</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
