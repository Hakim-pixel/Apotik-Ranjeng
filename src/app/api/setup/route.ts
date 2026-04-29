export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const passwordHash = await bcrypt.hash("admin123", 10);

    const { data: existingAdmin } = await supabase
      .from("users")
      .select("id")
      .eq("email", "admin@apotik.com")
      .maybeSingle();

    if (existingAdmin) {
      return NextResponse.json({ message: "Admin sudah ada. Silakan login." });
    }

    const { error } = await supabase.from("users").insert([
      {
        name: "Super Admin",
        email: "admin@apotik.com",
        password_hash: passwordHash,
        role: "ADMIN",
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "✅ Admin berhasil dibuat!",
      credentials: { email: "admin@apotik.com", password: "admin123" },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
