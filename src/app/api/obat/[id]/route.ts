export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT - Update obat (Admin & Apoteker, tapi harga hanya Admin)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "APOTEKER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();

  // Kasir & Apoteker TIDAK boleh ubah harga - hanya Admin
  if (session.user.role !== "ADMIN" && (body.buy_price !== undefined || body.sell_price !== undefined)) {
    return NextResponse.json({ error: "Hanya Admin yang boleh mengubah harga obat." }, { status: 403 });
  }

  if (body.buy_price !== undefined && Number(body.buy_price) < 0) {
    return NextResponse.json({ error: "Harga beli tidak boleh minus." }, { status: 400 });
  }
  if (body.sell_price !== undefined && Number(body.sell_price) < 0) {
    return NextResponse.json({ error: "Harga jual tidak boleh minus." }, { status: 400 });
  }

  // Ambil data lama untuk audit
  const { data: oldData } = await supabase.from("medicines").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("medicines")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("audit_logs").insert([{
    user_id: session.user.id,
    action: "UPDATE_MEDICINE",
    table_name: "medicines",
    record_id: id,
    old_data: oldData,
    new_data: data,
  }]);

  return NextResponse.json(data);
}

// DELETE - Hapus obat (Admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya Admin yang boleh menghapus data obat." }, { status: 403 });
  }

  const { data: oldData } = await supabase.from("medicines").select("*").eq("id", id).single();
  const { error } = await supabase.from("medicines").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("audit_logs").insert([{
    user_id: session.user.id,
    action: "DELETE_MEDICINE",
    table_name: "medicines",
    record_id: id,
    old_data: oldData,
  }]);

  return NextResponse.json({ success: true });
}
