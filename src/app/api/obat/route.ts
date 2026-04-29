export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Ambil semua obat
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  let query = supabase
    .from("medicines")
    .select(`*, category:categories(name)`)
    .order("name");

  if (search) {
    query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST - Tambah obat baru (Admin & Apoteker only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "APOTEKER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { name, barcode, category_id, unit, buy_price, sell_price, min_stock } = body;

  // Validasi
  if (!name || !barcode || !unit) {
    return NextResponse.json({ error: "Nama, barcode, dan satuan wajib diisi." }, { status: 400 });
  }
  if (Number(buy_price) < 0 || Number(sell_price) < 0) {
    return NextResponse.json({ error: "Harga tidak boleh minus." }, { status: 400 });
  }

  const { data, error } = await supabase.from("medicines").insert([{
    name, barcode, category_id, unit, buy_price, sell_price, min_stock: min_stock || 10
  }]).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await supabase.from("audit_logs").insert([{
    user_id: session.user.id,
    action: "CREATE_MEDICINE",
    table_name: "medicines",
    record_id: data.id,
    new_data: data,
  }]);

  return NextResponse.json(data, { status: 201 });
}
