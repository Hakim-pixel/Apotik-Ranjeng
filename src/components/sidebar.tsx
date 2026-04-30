"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Pill,
  PackagePlus,
  ShoppingCart,
  BarChart3,
  Users,
  ClipboardList,
  LogOut,
  Boxes,
  CalendarDays,
  ChevronRight,
  Activity,
  Menu,
  X,
  Truck
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "KASIR"] },
  { label: "Data Obat", href: "/dashboard/obat", icon: Pill, roles: ["ADMIN"] },
  { label: "Stok & Batch", href: "/dashboard/stok", icon: Boxes, roles: ["ADMIN"] },
  { label: "Data Supplier", href: "/dashboard/supplier", icon: Truck, roles: ["ADMIN"] },
  { label: "Pembelian", href: "/dashboard/pembelian", icon: PackagePlus, roles: ["ADMIN"] },
  { label: "Penjualan", href: "/dashboard/penjualan", icon: ShoppingCart, roles: ["ADMIN", "KASIR"] },
  { label: "Rekap Harian", href: "/dashboard/rekap-harian", icon: CalendarDays, roles: ["ADMIN"] },
  { label: "Laporan", href: "/dashboard/laporan", icon: BarChart3, roles: ["ADMIN"] },
  { label: "Manajemen User", href: "/dashboard/users", icon: Users, roles: ["ADMIN"] },
  { label: "Audit Trail", href: "/dashboard/audit", icon: ClipboardList, roles: ["ADMIN"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "KASIR";
  const [isOpen, setIsOpen] = useState(false);

  // Auto close sidebar on mobile when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#e4e7ec] flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#0f766e] p-1.5 rounded-md flex">
            <Activity size={16} color="#fff" />
          </div>
          <span className="font-bold text-[#101828] text-[14px]">Apotek Ranjeng</span>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-1.5 text-[#475467] hover:bg-gray-100 rounded-md">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-50 transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 w-[240px] md:w-[220px] bg-[#1a1f2e] border-r border-[#2d3348] flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#2d3348]">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#0f766e] p-1.5 rounded-md flex">
              <Activity size={16} color="#fff" />
            </div>
            <div>
              <div className="text-white font-bold text-[13px] leading-tight">Apotek Ranjeng</div>
              <div className="text-[#6b7fa3] text-[11px]">Sistem Inventaris</div>
            </div>
          </div>
          <button className="md:hidden text-[#6b7fa3] p-1 hover:text-white" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User badge */}
        <div className="p-3 border-b border-[#2d3348]">
          <div className="bg-[#252b3b] rounded-md p-2.5 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0 ${role === "ADMIN" ? "bg-[#7c3aed]" : "bg-[#0f766e]"}`}>
              {(session?.user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-[13px] font-semibold truncate">
                {session?.user?.name || "User"}
              </div>
              <div className={`text-[10px] font-bold ${role === "ADMIN" ? "text-[#a78bfa]" : "text-[#34d399]"}`}>
                {role === "ADMIN" ? "ADMIN" : "KASIR"}
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-2.5 overflow-y-auto space-y-0.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] transition-colors ${isActive ? "bg-[#0f766e] text-white font-semibold" : "text-[#8892aa] hover:bg-[#252b3b] hover:text-white"}`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2.5 border-t border-[#2d3348]">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[#f87171] hover:bg-[#2d1f1f] transition-colors text-[13px] font-medium"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
