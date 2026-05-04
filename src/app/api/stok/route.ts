export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Ambil semua batch (dengan filter medicine_id optional)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const medicineId = searchParams.get("medicine_id");
  const onlyActive = searchParams.get("active") === "true";
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("medicine_batches")
    .select(`*, medicine:medicines(name, barcode, unit, sell_price), supplier:suppliers(name)`)
    .order("expired_date", { ascending: true }); // FEFO: yang paling dekat expired duluan

  if (medicineId) query = query.eq("medicine_id", medicineId);
  if (onlyActive) query = query.gt("stock", 0).gte("expired_date", today);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST - Tambah batch baru (Restok)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "APOTEKER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { medicine_id, batch_number, expired_date, stock, supplier_id, purchase_price } = body;

  if (!medicine_id || !batch_number || !expired_date || !stock) {
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  if (expired_date <= today) {
    return NextResponse.json({ error: "Tanggal expired tidak boleh sebelum atau sama dengan hari ini." }, { status: 400 });
  }

  if (Number(stock) <= 0) {
    return NextResponse.json({ error: "Jumlah stok harus lebih dari 0." }, { status: 400 });
  }

  const { data, error } = await supabase.from("medicine_batches").insert([{
    medicine_id, 
    batch_number, 
    expired_date, 
    stock: Number(stock), 
    supplier_id,
    purchase_price: purchase_price ? Number(purchase_price) : null
  }]).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
