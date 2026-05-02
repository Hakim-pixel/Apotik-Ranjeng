"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Email atau password salah. Periksa kembali.");
        setLoading(false);
      } else if (res?.ok) {
        // Cek apakah session berhasil dibuat (cookie berhasil diset)
        const session = await getSession();
        if (!session) {
          setError("Login sukses, tapi sesi tidak tersimpan. Cek NEXTAUTH_SECRET di Vercel.");
          setLoading(false);
          return;
        }
        
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Terjadi kesalahan tidak terduga dari server.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Gagal menghubungi server. Pastikan NEXTAUTH_URL di Vercel sudah benar.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="bg-white border border-[#e4e7ec] rounded-xl p-8 w-full max-w-[380px] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-[20px] font-bold text-[#101828] m-0 leading-tight">Apotek Ranjeng</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[#fee2e2] border border-[#fca5a5] rounded-lg p-3 text-[13.5px] text-[#991b1b] mb-5 font-medium flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-bold text-[#344054] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukan Email Anda"
              className="w-full px-3.5 py-2.5 border border-[#d0d5dd] rounded-lg text-[14px] outline-none transition-colors focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#344054] mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-[#d0d5dd] rounded-lg text-[14px] outline-none transition-colors focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 mt-2 rounded-lg text-[14.5px] font-bold text-white transition-all ${
              loading ? "bg-[#99d6d1] cursor-not-allowed" : "bg-[#0f766e] hover:bg-[#0d6963] shadow-sm hover:shadow active:scale-[0.98]"
            }`}
          >
            {loading ? "Memproses..." : "Masuk ke Sistem"}
          </button>
        </form>

        <p className="text-center text-[12.5px] text-[#98a2b3] mt-8 mb-0 font-medium">
          Hubungi administrator untuk masalah login.
        </p>
      </div>
    </div>
  );
}
