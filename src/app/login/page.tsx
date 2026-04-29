"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Email atau password salah. Periksa kembali.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f0f2f5",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10,
        padding: "32px 36px", width: 360, boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, background: "#0f766e", borderRadius: 10,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 12,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#101828", margin: 0 }}>Apotek Ranjeng</h1>
          <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>Sistem Inventaris & Kasir</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 6,
            padding: "8px 12px", fontSize: 13, color: "#991b1b", marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#344054", marginBottom: 5 }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@apotik.com"
              style={{
                width: "100%", padding: "8px 10px", border: "1px solid #d0d5dd",
                borderRadius: 6, fontSize: 13, outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = "#0f766e")}
              onBlur={e => (e.target.style.borderColor = "#d0d5dd")}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#344054", marginBottom: 5 }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", padding: "8px 10px", border: "1px solid #d0d5dd",
                borderRadius: 6, fontSize: 13, outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = "#0f766e")}
              onBlur={e => (e.target.style.borderColor = "#d0d5dd")}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "9px", background: loading ? "#99d6d1" : "#0f766e",
              color: "#fff", border: "none", borderRadius: 6, fontSize: 14,
              fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4, transition: "background 0.15s",
            }}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 11, color: "#98a2b3", marginTop: 20, marginBottom: 0 }}>
          Lupa password? Hubungi administrator sistem.
        </p>
      </div>
    </div>
  );
}
