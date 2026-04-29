# Apotik Ranjeng — Sistem Inventaris Apotek

Sistem manajemen inventaris apotek berbasis web dengan fitur FEFO (First Expired First Out), multi-role, audit trail, dan kasir terintegrasi.

## 🔧 Tech Stack
- **Frontend & Backend:** Next.js 16 (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL)
- **Auth:** NextAuth.js (Credentials + JWT)
- **Styling:** Tailwind CSS

## 🔐 Fitur Utama
- ✅ Auth dengan 3 Role: Admin, Apoteker, Kasir
- ✅ Manajemen data obat (barcode, kategori, satuan, harga, stok minimum)
- ✅ Batch per obat dengan nomor lot dan tanggal expired
- ✅ Sistem FEFO otomatis saat penjualan
- ✅ Kasir / Point of Sale dengan keranjang belanja
- ✅ Laporan penjualan, obat hampir expired, dan terlaris
- ✅ Notifikasi stok menipis dan obat akan expired (< 3 bulan)
- ✅ Audit Trail — siapa edit/hapus apa dan kapan
- ✅ Role guard: hanya Admin yang bisa ubah harga

## 🚀 Cara Menjalankan

1. Clone repo ini
2. Install dependencies:
   ```bash
   npm install
   ```
3. Buat file `.env.local` dan isi dengan:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_key
   ```
4. Jalankan SQL schema di Supabase SQL Editor (lihat file `../supabase_schema.sql`)
5. Buat akun admin pertama:
   ```
   GET http://localhost:3000/api/setup
   ```
6. Jalankan server:
   ```bash
   npm run dev
   ```

## 📁 Struktur Halaman

| Halaman | Path | Role |
|---------|------|------|
| Dashboard | `/dashboard` | Semua |
| Data Obat | `/dashboard/obat` | Admin, Apoteker |
| Stok & Batch | `/dashboard/stok` | Admin, Apoteker |
| Penjualan | `/dashboard/penjualan` | Semua |
| Laporan | `/dashboard/laporan` | Admin, Apoteker |
| Manajemen User | `/dashboard/users` | Admin |
| Audit Trail | `/dashboard/audit` | Admin |

---

Dibuat dengan ❤️ untuk Apotek Ranjeng
