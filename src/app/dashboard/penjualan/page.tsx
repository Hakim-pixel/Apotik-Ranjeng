"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Printer,
  AlertTriangle,
  X,
  Package,
} from "lucide-react";

type Medicine = {
  id: string;
  name: string;
  barcode: string;
  unit: string;
  sell_price: number;
  total_stock: number;
  min_stock: number;
};

type CartItem = Medicine & { qty: number };

type LowStockItem = {
  id: string;
  name: string;
  unit: string;
  total_stock: number;
  min_stock: number;
};

type InvoiceDetail = {
  medicine: { name: string; unit: string };
  qty: number;
  price: number;
  subtotal: number;
};

type InvoiceData = {
  invoice_number: string;
  total_amount: number;
  created_at: string;
  user?: { name: string };
  details: InvoiceDetail[];
};

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Komponen Struk Cetak
function StrukModal({
  invoice,
  bayar,
  kembalian,
  onClose,
}: {
  invoice: InvoiceData;
  bayar: number;
  kembalian: number;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win || !printContent) return;
    win.document.write(`
      <html>
        <head>
          <title>Struk - ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; width: 300px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .item-name { font-weight: bold; margin-top: 4px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-bold text-zinc-900 dark:text-white">Transaksi Berhasil!</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Konten Struk (untuk preview & print) */}
        <div className="p-5">
          <div ref={printRef}>
            <div className="center bold" style={{ marginBottom: 4 }}>APOTEK RANJENG</div>
            <div className="center" style={{ fontSize: 11, marginBottom: 4 }}>Jl. Ranjeng No. 1 | Telp: 0xx-xxxx-xxxx</div>
            <div className="line" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }}></div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
              <span>No. Struk</span>
              <span style={{ fontWeight: "bold" }}>{invoice.invoice_number}</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 8 }}>
              <span>Tanggal</span>
              <span>{formatTanggal(invoice.created_at)}</span>
            </div>
            <div className="line" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }}></div>

            {/* Item-item */}
            {invoice.details?.map((d, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: "bold", fontSize: 12 }}>{d.medicine?.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555" }}>
                  <span>{d.qty} {d.medicine?.unit} × {formatRupiah(d.price)}</span>
                  <span style={{ fontWeight: "bold" }}>{formatRupiah(d.subtotal)}</span>
                </div>
              </div>
            ))}

            <div className="line" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 13 }}>
              <span>TOTAL</span>
              <span>{formatRupiah(invoice.total_amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
              <span>Bayar</span>
              <span>{formatRupiah(bayar)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: "bold", color: "#16a34a" }}>
              <span>Kembalian</span>
              <span>{formatRupiah(kembalian)}</span>
            </div>
            <div className="line" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }}></div>
            <div style={{ textAlign: "center", fontSize: 11, color: "#777", marginTop: 6 }}>
              Terima kasih sudah berbelanja!<br />Semoga lekas sembuh 🙏
            </div>
          </div>
        </div>

        {/* Tombol */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PenjualanPage() {
  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [bayar, setBayar] = useState("");
  const [showStruk, setShowStruk] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [showLowStock, setShowLowStock] = useState(true);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch peringatan stok minimum
  useEffect(() => {
    fetch("/api/restock-alert")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLowStockItems(data);
      });
  }, []);

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
    setCart((prev) => {
      const existing = prev.find((c) => c.id === m.id);
      if (existing) {
        if (existing.qty >= m.total_stock) { showToast("error", `Stok ${m.name} tidak mencukupi!`); return prev; }
        return prev.map((c) => c.id === m.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...m, qty: 1 }];
    });
    setSearch("");
    setMedicines([]);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return c;
      if (newQty > c.total_stock) { showToast("error", "Melebihi stok tersedia!"); return c; }
      return { ...c, qty: newQty };
    }));
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.id !== id));

  const total = cart.reduce((sum, c) => sum + c.sell_price * c.qty, 0);
  const bayarNum = parseInt(bayar.replace(/\D/g, ""), 10) || 0;
  const kembalian = bayarNum - total;

  const handleCheckout = async () => {
    if (cart.length === 0) { showToast("error", "Keranjang masih kosong!"); return; }
    if (bayarNum < total) { showToast("error", "Uang bayar kurang dari total!"); return; }
    setProcessing(true);

    const res = await fetch("/api/penjualan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map((c) => ({ medicine_id: c.id, qty: c.qty })) }),
    });

    const data = await res.json();
    setProcessing(false);

    if (!res.ok) { showToast("error", data.error || "Transaksi gagal."); return; }

    setInvoice(data);
    setShowStruk(true);
    setCart([]);
    setBayar("");

    // Refresh alert stok setelah transaksi
    fetch("/api/restock-alert")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLowStockItems(d); });
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Struk Modal */}
      {showStruk && invoice && (
        <StrukModal
          invoice={invoice}
          bayar={bayarNum}
          kembalian={kembalian < 0 ? 0 : kembalian}
          onClose={() => { setShowStruk(false); setInvoice(null); }}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Penjualan (Kasir)</h1>
        <p className="text-sm text-zinc-500 mt-1">Stok otomatis dipotong berdasarkan FEFO</p>
      </div>

      {/* Peringatan Stok Menipis */}
      {lowStockItems.length > 0 && showLowStock && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-2">
                  ⚠️ {lowStockItems.length} obat perlu direstok segera!
                </p>
                <div className="flex flex-wrap gap-2">
                  {lowStockItems.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-1 rounded-full font-medium"
                    >
                      <Package className="h-3 w-3" />
                      {item.name}: {item.total_stock} {item.unit} (min: {item.min_stock})
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLowStock(false)}
              className="text-amber-500 hover:text-amber-700 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kiri: Pencarian & Hasil */}
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
              {medicines.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addToCart(m)}
                  disabled={m.total_stock === 0}
                  className="w-full text-left flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b last:border-0 border-zinc-100 dark:border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <p className="font-medium text-sm text-zinc-900 dark:text-white">{m.name}</p>
                    <p className="text-xs text-zinc-400">
                      {m.barcode} · {m.unit} · Stok:{" "}
                      <span className={m.total_stock <= m.min_stock ? "text-red-500 font-bold" : "text-emerald-500 font-semibold"}>
                        {m.total_stock}
                      </span>
                      {m.total_stock <= m.min_stock && " ⚠️"}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600 text-sm">{formatRupiah(m.sell_price)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Pembayaran */}
          {cart.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Pembayaran</h3>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Uang Bayar</label>
                <input
                  type="text"
                  placeholder="0"
                  value={bayar}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setBayar(val ? parseInt(val, 10).toLocaleString("id-ID") : "");
                  }}
                  className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              {/* Nominal cepat */}
              <div className="flex flex-wrap gap-2">
                {[5000, 10000, 20000, 50000, 100000].map((nom) => (
                  <button
                    key={nom}
                    onClick={() => setBayar(nom.toLocaleString("id-ID"))}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 transition-colors"
                  >
                    {formatRupiah(nom)}
                  </button>
                ))}
              </div>
              {bayarNum > 0 && (
                <div className={`flex justify-between items-center px-3 py-2 rounded-xl text-sm font-bold ${
                  kembalian >= 0
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                }`}>
                  <span>{kembalian >= 0 ? "Kembalian" : "Kurang"}</span>
                  <span>{formatRupiah(Math.abs(kembalian))}</span>
                </div>
              )}
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
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-zinc-400">{formatRupiah(item.sell_price)} / {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-zinc-900 dark:text-white">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                  </div>
                  <p className="font-bold text-sm text-zinc-900 dark:text-white w-24 text-right">
                    {formatRupiah(item.sell_price * item.qty)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-sm">Total</span>
              <span className="font-bold text-lg text-zinc-900 dark:text-white">{formatRupiah(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={processing || cart.length === 0 || (bayarNum > 0 && kembalian < 0)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors"
            >
              {processing ? "Memproses..." : `Bayar ${formatRupiah(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
