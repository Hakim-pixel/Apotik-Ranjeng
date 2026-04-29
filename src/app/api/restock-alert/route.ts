export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("medicines")
    .select("id, name, unit, total_stock, min_stock")
    .filter("total_stock", "lte", "min_stock")
    .order("total_stock", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter manual karena supabase tidak support column-to-column filter langsung
  const { data: allMeds, error: allErr } = await supabase
    .from("medicines")
    .select("id, name, unit, total_stock, min_stock")
    .order("total_stock", { ascending: true });

  if (allErr) return NextResponse.json({ error: allErr.message }, { status: 500 });

  const lowStock = (allMeds || []).filter(
    (m) => (m.total_stock ?? 0) <= (m.min_stock ?? 10)
  );

  return NextResponse.json(lowStock);
}
