export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Ambil semua kredit (dengan filter status)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // "LUNAS" | "BELUM_LUNAS" | null (semua)

  let query = supabase
    .from("credits")
    .select(`
      *,
      transaction:transactions(
        invoice_number, 
        total_amount, 
        created_at,
        transaction_details(
          qty,
          price,
          subtotal,
          medicine:medicines(name, unit)
        )
      ),
      user:users(name)
    `)
    .order("due_date", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Tambahkan flag is_overdue dan days_overdue
  const now = new Date();
  const enriched = (data || []).map((credit) => {
    const dueDate = new Date(credit.due_date);
    const diffMs = now.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return {
      ...credit,
      is_overdue: credit.status === "BELUM_LUNAS" && diffDays > 0,
      days_overdue: credit.status === "BELUM_LUNAS" && diffDays > 0 ? diffDays : 0,
      days_remaining: credit.status === "BELUM_LUNAS" && diffDays <= 0 ? Math.abs(diffDays) : 0,
    };
  });

  return NextResponse.json(enriched);
}

// POST - Tandai kredit sebagai lunas
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { credit_id } = body;

  if (!credit_id) {
    return NextResponse.json({ error: "credit_id diperlukan" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("credits")
    .update({ status: "LUNAS", paid_at: new Date().toISOString() })
    .eq("id", credit_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
