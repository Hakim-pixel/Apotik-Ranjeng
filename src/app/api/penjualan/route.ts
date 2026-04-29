export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST - Buat transaksi penjualan (Kasir/Apoteker/Admin)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items } = body; // [{ medicine_id, qty }]

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Keranjang belanja kosong." }, { status: 400 });
  }

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`;
  let totalAmount = 0;
  const details: {
    transaction_id: string;
    medicine_id: string;
    batch_id: string;
    qty: number;
    price: number;
    subtotal: number;
  }[] = [];
  const batchUpdates: { id: string; newStock: number }[] = [];

  // Proses setiap item dengan FEFO
  for (const item of items) {
    const { medicine_id, qty } = item;
    let remaining = qty;

    // Validasi: cek stok total
    const { data: medicine } = await supabase
      .from("medicines")
      .select("total_stock, sell_price, name")
      .eq("id", medicine_id)
      .single();

    if (!medicine || medicine.total_stock < qty) {
      return NextResponse.json({
        error: `Stok ${medicine?.name || "obat"} tidak mencukupi. Stok tersedia: ${medicine?.total_stock || 0}`
      }, { status: 400 });
    }

    // FEFO: ambil batch yang paling dekat expired duluan
    const today = new Date().toISOString().split("T")[0];
    const { data: batches } = await supabase
      .from("medicine_batches")
      .select("*")
      .eq("medicine_id", medicine_id)
      .gt("stock", 0)
      .gte("expired_date", today)
      .order("expired_date", { ascending: true });

    if (!batches || batches.length === 0) {
      return NextResponse.json({ error: `Tidak ada batch valid untuk obat ${medicine.name}.` }, { status: 400 });
    }

    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, batch.stock);
      const subtotal = take * medicine.sell_price;
      totalAmount += subtotal;
      details.push({
        transaction_id: "", // akan diisi setelah transaksi dibuat
        medicine_id,
        batch_id: batch.id,
        qty: take,
        price: medicine.sell_price,
        subtotal,
      });
      batchUpdates.push({ id: batch.id, newStock: batch.stock - take });
      remaining -= take;
    }
  }

  // Buat transaksi header
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert([{ invoice_number: invoiceNumber, type: "OUT", user_id: session.user.id, total_amount: totalAmount }])
    .select()
    .single();

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  // Isi transaction_id di details
  const finalDetails = details.map(d => ({ ...d, transaction_id: transaction.id }));

  const { error: detailError } = await supabase.from("transaction_details").insert(finalDetails);
  if (detailError) return NextResponse.json({ error: detailError.message }, { status: 500 });

  // Update stok batch
  for (const bu of batchUpdates) {
    await supabase.from("medicine_batches").update({ stock: bu.newStock }).eq("id", bu.id);
  }

  return NextResponse.json({ ...transaction, details: finalDetails }, { status: 201 });
}

// GET - Ambil riwayat transaksi penjualan
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || new Date(new Date().setDate(1)).toISOString();
  const to = searchParams.get("to") || new Date().toISOString();

  const { data, error } = await supabase
    .from("transactions")
    .select(`*, user:users(name), transaction_details(*, medicine:medicines(name, unit), batch:medicine_batches(batch_number))`)
    .eq("type", "OUT")
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
