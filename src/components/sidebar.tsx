"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
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
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "KASIR"] },
  { label: "Data Obat", href: "/dashboard/obat", icon: Pill, roles: ["ADMIN"] },
  { label: "Stok & Batch", href: "/dashboard/stok", icon: Boxes, roles: ["ADMIN"] },
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

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside style={{
      position: "fixed", inset: "0 auto 0 0", width: "220px",
      background: "#1a1f2e", display: "flex", flexDirection: "column",
      borderRight: "1px solid #2d3348", zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "16px 16px 14px", borderBottom: "1px solid #2d3348",
      }}>
        <div style={{ background: "#0f766e", padding: "6px", borderRadius: "6px", display: "flex" }}>
          <Activity size={16} color="#fff" />
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: "13px", lineHeight: 1.2 }}>Apotek Ranjeng</div>
          <div style={{ color: "#6b7fa3", fontSize: "11px" }}>Sistem Inventaris</div>
        </div>
      </div>

      {/* User badge */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #2d3348" }}>
        <div style={{
          background: "#252b3b", borderRadius: "6px", padding: "8px 10px",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: role === "ADMIN" ? "#7c3aed" : "#0f766e",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: "12px", flexShrink: 0,
          }}>
            {(session?.user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "#fff", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session?.user?.name || "User"}
            </div>
            <div style={{
              fontSize: "10px", fontWeight: 600,
              color: role === "ADMIN" ? "#a78bfa" : "#34d399",
            }}>
              {role === "ADMIN" ? "ADMIN" : "KASIR"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "7px 10px", borderRadius: "6px", marginBottom: "1px",
              textDecoration: "none", fontSize: "13px", fontWeight: isActive ? 600 : 400,
              color: isActive ? "#fff" : "#8892aa",
              background: isActive ? "#0f766e" : "transparent",
              transition: "all 0.1s",
            }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#252b3b"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#8892aa"; } }}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && <ChevronRight size={12} style={{ opacity: 0.7 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "8px", borderTop: "1px solid #2d3348" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "8px",
            padding: "7px 10px", borderRadius: "6px", border: "none",
            background: "transparent", color: "#f87171", cursor: "pointer",
            fontSize: "13px", fontWeight: 500,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#2d1f1f")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={14} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
