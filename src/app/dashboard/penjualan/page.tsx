"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, AlertCircle, Printer } from "lucide-react";

type Medicine = {
  id: string;
  name: string;
  barcode: string;
  unit: string;
  sell_price: number;
  total_stock: number;
};

type CartItem = Medicine & { qty: number };

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function PenjualanPage() {
  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [lastInvoice, setLastInvoice] = useState<{ invoice_number: string; total_amount: number } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMedicines = useCallback(async () => {
    if (!search.trim()) { setMedicines([]); return; }
    setLoading(true);
    const res = await fetch(`/api/obat?search=${search}`);
    const data = await res.json();
    setMedicines(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchMedicines, 300);
    return () => clearTimeout(timeout);
  }, [fetchMedicines]);

  const addToCart = (m: Medicine) => {
    if (m.total_stock === 0) { showToast("error", `Stok ${m.name} kosong!`); return; }
    setCart(prev => {
      const existing = prev.find(c => c.id === m.id);
      if (existing) {
        if (existing.qty >= m.total_stock) { showToast("error", `Stok ${m.name} tidak mencukupi!`); return prev; }
        return prev.map(c => c.id === m.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...m, qty: 1 }];
    });
    setSearch("");
    setMedicines([]);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return c;
      if (newQty > c.total_stock) { showToast("error", "Melebihi stok tersedia!"); return c; }
      return { ...c, qty: newQty };
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  const total = cart.reduce((sum, c) => sum + c.sell_price * c.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) { showToast("error", "Keranjang masih kosong!"); return; }
    setProcessing(true);

    const res = await fetch("/api/penjualan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map(c => ({ medicine_id: c.id, qty: c.qty })) }),
    });

    const data = await res.json();
    setProcessing(false);

    if (!res.ok) { showToast("error", data.error || "Transaksi gagal."); return; }

    setLastInvoice(data);
    showToast("success", `Transaksi ${data.invoice_number} berhasil! Total: ${formatRupiah(data.total_amount)}`);
    setCart([]);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Penjualan (Kasir)</h1>
        <p className="text-sm text-zinc-500 mt-1">Stok otomatis dipotong berdasarkan FEFO</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kiri: Pencarian */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari obat berdasarkan nama atau scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {loading && <p className="text-sm text-zinc-400 text-center">Mencari...</p>}
          {medicines.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              {medicines.map(m => (
                <button key={m.id} onClick={() => addToCart(m)}
                  className="w-full text-left flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b last:border-0 border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="font-medium text-sm text-zinc-900 dark:text-white">{m.name}</p>
                    <p className="text-xs text-zinc-400">{m.barcode} · {m.unit} · Stok: {m.total_stock}</p>
                  </div>
                  <span className="font-bold text-emerald-600 text-sm">{formatRupiah(m.sell_price)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Struk Terakhir */}
          {lastInvoice && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">✅ Transaksi Terakhir Berhasil</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Invoice: <strong>{lastInvoice.invoice_number}</strong> · Total: <strong>{formatRupiah(lastInvoice.total_amount)}</strong>
                  </p>
                </div>
                <button onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors">
                  <Printer className="h-3.5 w-3.5" /> Cetak
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Kanan: Keranjang */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 p-4 border-b border-zinc-100 dark:border-zinc-800">
            <ShoppingCart className="h-5 w-5 text-emerald-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Keranjang</h2>
            <span className="ml-auto text-xs text-zinc-400">{cart.length} item</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-300 dark:text-zinc-600">
                <ShoppingCart className="h-10 w-10 mb-2" />
                <p className="text-sm">Belum ada item</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-zinc-400">{formatRupiah(item.sell_price)} / {item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)}
                    className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <Minus className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                  </button>
                  <span className="text-sm font-bold w-6 text-center text-zinc-900 dark:text-white">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}
                    className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <Plus className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                  </button>
                </div>
                <p className="font-bold text-sm text-zinc-900 dark:text-white w-24 text-right">
                  {formatRupiah(item.sell_price * item.qty)}
                </p>
                <button onClick={() => removeFromCart(item.id)}
                  className="p-1 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-sm">Subtotal</span>
              <span className="font-bold text-lg text-zinc-900 dark:text-white">{formatRupiah(total)}</span>
            </div>
            <button onClick={handleCheckout} disabled={processing || cart.length === 0}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors">
              {processing ? "Memproses..." : `Bayar ${formatRupiah(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
