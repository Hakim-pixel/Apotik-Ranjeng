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
  const { name, description } = body;
  if (!name) return NextResponse.json({ error: "Nama kategori wajib diisi." }, { status: 400 });

  const { data, error } = await supabase
    .from("categories")
    .update({ name, description })
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

  // Cek apakah kategori dipakai di tabel obat (medicines)
  const { count, error: checkErr } = await supabase
    .from("medicines")
    .select("*", { count: "exact", head: true })
    .eq("category_id", params.id);

  if (checkErr) return NextResponse.json({ error: checkErr.message }, { status: 500 });
  if (count && count > 0) {
    return NextResponse.json({ error: "Tidak bisa dihapus karena ada obat yang menggunakan kategori ini." }, { status: 400 });
  }

  const { error } = await supabase.from("categories").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
