export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || new Date(new Date().setDate(1)).toISOString().split("T")[0];
  const to = searchParams.get("to") || new Date().toISOString().split("T")[0];
  const type = searchParams.get("type") || "overview";

  const today = new Date().toISOString().split("T")[0];
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  const expiryWarning = threeMonthsLater.toISOString().split("T")[0];

  if (type === "expired") {
    const { data, error } = await supabase
      .from("medicine_batches")
      .select(`*, medicine:medicines(name, barcode, unit)`)
      .gt("stock", 0)
      .lte("expired_date", expiryWarning)
      .gte("expired_date", today)
      .order("expired_date", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (type === "penjualan") {
    const { data, error } = await supabase
      .from("transactions")
      .select(`*, user:users(name), transaction_details(qty, price, subtotal, medicine:medicines(name))`)
      .eq("type", "OUT")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (type === "terlaris") {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        type,
        transaction_details(medicine_id, qty, medicine:medicines(name, unit))
      `)
      .eq("type", "OUT")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    type GroupedItem = { name: string; unit: string; total_qty: number };
    const grouped: Record<string, GroupedItem> = {};

    for (const tx of data || []) {
      for (const row of tx.transaction_details || []) {
        const med = (row.medicine as unknown) as { name: string; unit: string } | null;
        const key = row.medicine_id;
        if (!grouped[key]) {
          grouped[key] = {
            name: med?.name || "Unknown",
            unit: med?.unit || "",
            total_qty: 0,
          };
        }
        grouped[key].total_qty += row.qty;
      }
    }

    const sorted = Object.values(grouped)
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, 10);

    return NextResponse.json(sorted);
  }

  return NextResponse.json({ message: "Pilih type: expired | penjualan | terlaris" });
}
