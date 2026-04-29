import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isProtected = pathname.startsWith("/dashboard");

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Halaman yang hanya bisa diakses ADMIN
  const adminOnlyPaths = [
    "/dashboard/obat",
    "/dashboard/stok",
    "/dashboard/pembelian",
    "/dashboard/laporan",
    "/dashboard/users",
    "/dashboard/audit",
    "/dashboard/supplier",
    "/dashboard/kategori",
    "/dashboard/rekap-harian",
  ];

  if (token && token.role === "KASIR") {
    const isAdminOnly = adminOnlyPaths.some((p) => pathname.startsWith(p));
    if (isAdminOnly) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
