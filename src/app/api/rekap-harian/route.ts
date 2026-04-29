export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  // Rekap harian: semua transaksi OUT pada tanggal tertentu
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(`
      id,
      invoice_number,
      created_at,
      total_amount,
      user:users(name),
      transaction_details(
        qty,
        price,
        subtotal,
        medicine:medicines(name, unit)
      )
    `)
    .eq("type", "OUT")
    .gte("created_at", `${date}T00:00:00`)
    .lte("created_at", `${date}T23:59:59`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalPendapatan = (transactions || []).reduce(
    (sum, t) => sum + (t.total_amount || 0),
    0
  );
  const totalTransaksi = (transactions || []).length;

  return NextResponse.json({
    date,
    totalTransaksi,
    totalPendapatan,
    transactions: transactions || [],
  });
}
