export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "APOTEKER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await req.json();
  const { name, contact_person, phone, address } = body;
  if (!name) return NextResponse.json({ error: "Nama supplier wajib diisi." }, { status: 400 });

  const { data, error } = await supabase
    .from("suppliers")
    .update({ name, contact_person, phone, address })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "APOTEKER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Cek apakah supplier sedang dipakai di tabel inventory_batches
  const { count, error: checkErr } = await supabase
    .from("inventory_batches")
    .select("*", { count: "exact", head: true })
    .eq("supplier_id", params.id);

  if (checkErr) return NextResponse.json({ error: checkErr.message }, { status: 500 });
  if (count && count > 0) {
    return NextResponse.json({ error: "Tidak bisa dihapus karena supplier ini sudah terkait dengan data stok batch." }, { status: 400 });
  }

  const { error } = await supabase.from("suppliers").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
