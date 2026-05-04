-- ============================================
-- MIGRATION: Tambah fitur kredit penjualan
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tambah kolom payment_method di tabel transactions (tunai/kredit)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'tunai'
    CHECK (payment_method IN ('tunai', 'kredit'));

-- 2. Buat tabel credits untuk menyimpan tagihan kredit
CREATE TABLE IF NOT EXISTS credits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  customer_name   TEXT NOT NULL,
  amount          NUMERIC(15, 2) NOT NULL,
  credit_days     INTEGER NOT NULL CHECK (credit_days IN (21, 30)),
  due_date        DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'BELUM_LUNAS'
    CHECK (status IN ('BELUM_LUNAS', 'LUNAS')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_credits_status     ON credits(status);
CREATE INDEX IF NOT EXISTS idx_credits_due_date   ON credits(due_date);
CREATE INDEX IF NOT EXISTS idx_credits_transaction ON credits(transaction_id);

-- 4. RLS (Row Level Security) - izinkan semua authenticated user
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "credits_authenticated"
  ON credits FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
