"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, Minus, Trash2, AlertTriangle, X, Package, Printer, ShoppingCart, Tag } from "lucide-react";

type Medicine = {
  id: string; name: string; barcode: string;
  unit: string; sell_price: number; total_stock: number; min_stock: number;
};
type CartItem = Medicine & { qty: number };
type LowStockItem = { id: string; name: string; unit: string; total_stock: number; min_stock: number };
type InvoiceDetail = { medicine: { name: string; unit: string }; qty: number; price: number; subtotal: number };
type InvoiceData = { invoice_number: string; total_amount: number; created_at: string; user?: { name: string }; details: InvoiceDetail[] };

function fmt(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

function StrukModal({ invoice, bayar, kembalian, onClose }: { invoice: InvoiceData; bayar: number; kembalian: number; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    const win = window.open("", "_blank", "width=380,height=600");
    if (!win || !content) return;
    win.document.write(`<html><head><title>Struk</title><style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Courier New',monospace;font-size:12px;padding:12px;width:300px;}
      .c{text-align:center;} .b{font-weight:bold;} .hr{border-top:1px dashed #000;margin:6px 0;}
      .row{display:flex;justify-content:space-between;margin:2px 0;font-size:11px;}
    </style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const tgl = new Date(invoice.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  
  // Hitung total asli sebelum diskon
  const originalTotal = invoice.details?.reduce((sum, d) => sum + d.subtotal, 0) || 0;
  const discountAmount = originalTotal - invoice.total_amount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-[360px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e4e7ec] bg-[#f0fdf4] shrink-0">
          <span className="font-bold text-[#14532d] text-[14px]">✅ Transaksi Berhasil</span>
          <button onClick={onClose} className="p-1 hover:bg-[#dcfce7] rounded-md transition-colors"><X size={18} color="#14532d" /></button>
        </div>

        {/* Struk Preview */}
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
          <div ref={printRef} className="bg-white p-4 shadow-sm border border-gray-100 mx-auto w-full max-w-[300px]">
            <div className="text-center font-bold font-mono">APOTEK RANJENG</div>
            <div className="text-center text-[11px] text-[#667085] font-mono">Jl. Ranjeng No. 1 | Tel: 0xx-xxxx</div>
            <div className="border-t border-dashed border-gray-400 my-2"></div>
            <div className="flex justify-between text-[11px] font-mono mb-0.5">
              <span>No. Struk</span><span className="font-bold">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono mb-2">
              <span>Tanggal</span><span>{tgl}</span>
            </div>
            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {invoice.details?.map((d, i) => (
              <div key={i} className="mb-1.5 font-mono">
                <div className="font-bold text-[12px]">{d.medicine?.name}</div>
                <div className="flex justify-between text-[11px]">
                  <span>{d.qty} {d.medicine?.unit} × {fmt(d.price)}</span>
                  <span className="font-bold">{fmt(d.subtotal)}</span>
                </div>
              </div>
            ))}

            <div className="border-t border-dashed border-gray-400 my-2"></div>
            {discountAmount > 0 && (
              <>
                <div className="flex justify-between text-[12px] font-mono mt-1">
                  <span>Subtotal</span><span>{fmt(originalTotal)}</span>
                </div>
                <div className="flex justify-between text-[12px] font-mono mt-1 text-red-600">
                  <span>Diskon</span><span>-{fmt(discountAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-[13px] font-mono mt-1">
              <span>TOTAL</span><span>{fmt(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between text-[12px] font-mono mt-1">
              <span>Bayar</span><span>{fmt(bayar)}</span>
            </div>
            <div className="flex justify-between text-[12px] font-bold text-[#0f766e] font-mono">
              <span>Kembalian</span><span>{fmt(kembalian)}</span>
            </div>
            <div className="border-t border-dashed border-gray-400 my-2"></div>
            <div className="text-center text-[11px] text-[#98a2b3] font-mono">Terima kasih! Semoga lekas sembuh 🙏</div>
          </div>
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-[#e4e7ec] bg-white shrink-0">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-1.5 bg-[#0f766e] hover:bg-[#0d6963] text-white border-none rounded-md py-2.5 px-3 text-[13px] font-semibold cursor-pointer transition-colors">
            <Printer size={16} /> Cetak Struk
          </button>
          <button onClick={onClose} className="flex-1 bg-white hover:bg-gray-50 border border-[#d0d5dd] rounded-md py-2.5 px-3 text-[13px] font-semibold text-[#344054] cursor-pointer transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PenjualanPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [bayar, setBayar] = useState("");
  const [diskon, setDiskon] = useState("");
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [showAlert, setShowAlert] = useState(true);
  const [lastPayment, setLastPayment] = useState({ bayar: 0, kembalian: 0 });

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch("/api/restock-alert").then(r => r.json()).then(d => { if (Array.isArray(d)) setLowStock(d); });
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
    const t = setTimeout(fetchMedicines, 300);
    return () => clearTimeout(t);
  }, [fetchMedicines]);

  const addToCart = (m: Medicine) => {
    if (m.total_stock === 0) { showToast("err", `Stok ${m.name} kosong!`); return; }
    setCart(prev => {
      const ex = prev.find(c => c.id === m.id);
      if (ex) {
        if (ex.qty >= m.total_stock) { showToast("err", "Stok tidak cukup!"); return prev; }
        return prev.map(c => c.id === m.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...m, qty: 1 }];
    });
    setSearch(""); setMedicines([]);
  };

  const updateQty = (id: string, d: number) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nq = c.qty + d;
      if (nq <= 0) return c;
      if (nq > c.total_stock) { showToast("err", "Melebihi stok!"); return c; }
      return { ...c, qty: nq };
    }));
  };

  const subtotalTagihan = cart.reduce((s, c) => s + c.sell_price * c.qty, 0);
  const diskonPersen = parseInt(diskon.replace(/\D/g, ""), 10) || 0;
  const validDiskonPersen = Math.min(100, Math.max(0, diskonPersen));
  const diskonNominal = Math.floor(subtotalTagihan * (validDiskonPersen / 100));
  const totalTagihan = Math.max(0, subtotalTagihan - diskonNominal);
  const bayarNum = parseInt(bayar.replace(/\D/g, ""), 10) || 0;
  const kembalian = bayarNum - totalTagihan;

  const handleCheckout = async () => {
    if (cart.length === 0) { showToast("err", "Keranjang kosong!"); return; }
    if (bayarNum < totalTagihan) { showToast("err", "Uang bayar kurang!"); return; }
    setProcessing(true);
    const res = await fetch("/api/penjualan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        items: cart.map(c => ({ medicine_id: c.id, qty: c.qty })),
        discount: diskonNominal
      }),
    });
    const data = await res.json();
    setProcessing(false);
    if (!res.ok) { showToast("err", data.error || "Transaksi gagal."); return; }
    
    // Simpan data bayar ke state agar tidak hilang di modal
    setLastPayment({ bayar: bayarNum, kembalian: kembalian < 0 ? 0 : kembalian });
    setInvoice(data); 
    
    // Reset form
    setCart([]); setBayar(""); setDiskon("");
    fetch("/api/restock-alert").then(r => r.json()).then(d => { if (Array.isArray(d)) setLowStock(d); });
  };

  return (
    <div className="max-w-[1200px] w-full mx-auto pb-8 md:pb-0">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 md:top-4 right-4 z-50 px-4 py-2.5 rounded-md text-white text-[13.5px] font-semibold shadow-lg transition-all ${toast.type === "ok" ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}>
          {toast.msg}
        </div>
      )}

      {/* Struk Modal */}
      {invoice && (
        <StrukModal
          invoice={invoice} bayar={lastPayment.bayar} kembalian={lastPayment.kembalian}
          onClose={() => setInvoice(null)}
        />
      )}

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[18px] md:text-[20px] font-bold text-[#101828] m-0">Penjualan</h1>
        <p className="text-[13px] md:text-[14px] text-[#667085] mt-1 mb-0">Stok dipotong otomatis berdasarkan FEFO</p>
      </div>

      {/* Alert Stok */}
      {lowStock.length > 0 && showAlert && (
        <div className="bg-[#fffbeb] border border-[#fcd34d] rounded-md p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={16} className="text-[#d97706] mt-0.5 shrink-0" />
          <div className="flex-1 text-[13px] leading-snug">
            <strong className="text-[#92400e] block sm:inline">{lowStock.length} obat perlu direstok: </strong>
            <span className="text-[#78350f]">
              {lowStock.map(i => `${i.name} (sisa ${i.total_stock} ${i.unit})`).join(", ")}
            </span>
          </div>
          <button onClick={() => setShowAlert(false)} className="text-[#d97706] hover:bg-[#fef3c7] p-1 rounded shrink-0 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Responsive Grid: Stacks on mobile, side-by-side on lg */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* Kiri: Cari + Bayar */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Search Area */}
          <div className="bg-white border border-[#e4e7ec] rounded-lg overflow-hidden flex flex-col">
            <div className="px-3 py-2.5 border-b border-[#f0f2f5] flex items-center gap-2">
              <Search size={16} className="text-[#98a2b3]" />
              <input
                type="text"
                placeholder="Cari obat / scan barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="flex-1 border-none outline-none text-[14px] text-[#101828] bg-transparent"
              />
              {loading && <span className="text-[12px] text-[#98a2b3]">Mencari...</span>}
            </div>

            {medicines.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
                <table className="w-full border-collapse text-[13px] min-w-[500px]">
                  <thead>
                    <tr className="bg-[#f8f9fb]">
                      <th className="py-2 px-3 text-left text-[#667085] font-semibold border-b border-[#e4e7ec]">Nama Obat</th>
                      <th className="py-2 px-3 text-left text-[#667085] font-semibold border-b border-[#e4e7ec]">Barcode</th>
                      <th className="py-2 px-3 text-left text-[#667085] font-semibold border-b border-[#e4e7ec]">Stok</th>
                      <th className="py-2 px-3 text-left text-[#667085] font-semibold border-b border-[#e4e7ec]">Harga</th>
                      <th className="py-2 px-3 border-b border-[#e4e7ec]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map(m => (
                      <tr key={m.id} 
                        className={`border-b border-[#f0f2f5] transition-colors ${m.total_stock > 0 ? 'cursor-pointer hover:bg-[#f8f9fb]' : 'cursor-not-allowed opacity-50'}`}
                        onClick={() => m.total_stock > 0 && addToCart(m)}
                      >
                        <td className="py-2 px-3 font-semibold">{m.name}</td>
                        <td className="py-2 px-3 font-mono text-[12px] text-[#667085]">{m.barcode}</td>
                        <td className="py-2 px-3">
                          <span className={`font-bold ${m.total_stock === 0 ? 'text-[#dc2626]' : m.total_stock <= m.min_stock ? 'text-[#d97706]' : 'text-[#16a34a]'}`}>
                            {m.total_stock} {m.unit}
                            {m.total_stock <= m.min_stock && m.total_stock > 0 && " ⚠️"}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-[#0f766e]">{fmt(m.sell_price)}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="text-[12px] bg-[#f0fdf4] text-[#14532d] px-2 py-1 rounded-md font-bold shrink-0 border border-[#bbf7d0]">
                            + Tambah
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!search && medicines.length === 0 && (
              <div className="py-8 px-4 text-center text-[#98a2b3] text-[13.5px]">
                Ketik nama atau scan barcode untuk mencari obat
              </div>
            )}
            {search && !loading && medicines.length === 0 && (
              <div className="py-8 px-4 text-center text-[#dc2626] text-[13.5px] font-medium">
                Obat tidak ditemukan.
              </div>
            )}
          </div>

          {/* Pembayaran Area */}
          {cart.length > 0 && (
            <div className="bg-white border border-[#e4e7ec] rounded-lg p-4 order-last lg:order-none">
              <div className="text-[14px] font-semibold text-[#344054] mb-3">Pembayaran</div>
              <div className="mb-3">
                <label className="text-[12px] font-semibold text-[#667085] mb-1 block">Uang Bayar (Rp)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={bayar}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "");
                    setBayar(v ? parseInt(v).toLocaleString("id-ID") : "");
                  }}
                  className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[16px] font-mono font-bold focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors"
                />
              </div>
              
              {/* Nominal cepat */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[10000, 20000, 50000, 100000].map(n => {
                  const isActive = bayarNum === n;
                  return (
                    <button 
                      key={n} 
                      onClick={() => setBayar(n.toLocaleString("id-ID"))} 
                      className={`px-2.5 py-1.5 border rounded text-[12px] font-semibold transition-colors ${
                        isActive 
                          ? "border-[#0f766e] bg-[#f0fdf4] text-[#0f766e] shadow-sm" 
                          : "border-[#d0d5dd] bg-[#f8f9fb] text-[#344054] hover:bg-gray-100"
                      }`}
                    >
                      {fmt(n)}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setBayar(totalTagihan.toLocaleString("id-ID"))} 
                  className={`px-2.5 py-1.5 border rounded text-[12px] font-bold transition-colors ${
                    bayarNum === totalTagihan && totalTagihan > 0
                      ? "border-[#0f766e] bg-[#0f766e] text-white shadow-sm"
                      : "border-[#0f766e] bg-[#f0fdf4] text-[#0f766e] hover:bg-[#e6fbf0]"
                  }`}
                >
                  Uang Pas
                </button>
              </div>

              {bayarNum > 0 && (
                <div className={`flex justify-between items-center px-3 py-2.5 rounded-md text-[14px] font-bold ${kembalian >= 0 ? 'bg-[#f0fdf4] text-[#14532d] border border-[#bbf7d0]' : 'bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]'}`}>
                  <span>{kembalian >= 0 ? "Kembalian" : "Kurang"}</span>
                  <span className="text-[16px]">{fmt(Math.abs(kembalian))}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kanan: Keranjang */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="bg-white border border-[#e4e7ec] rounded-lg flex flex-col h-[400px] lg:h-[calc(100vh-140px)] sticky top-16">
            <div className="px-4 py-3 border-b border-[#f0f2f5] flex items-center justify-between bg-[#f8f9fb] rounded-t-lg">
              <span className="text-[14px] font-bold text-[#344054]">Keranjang</span>
              {cart.length > 0 && (
                <span className="bg-[#0f766e] text-white px-2 py-0.5 rounded-full text-[11px] font-bold">
                  {cart.length} Item
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-12 px-4 text-center text-[#98a2b3] text-[13.5px] flex flex-col items-center gap-2">
                  <ShoppingCart size={32} className="opacity-30" />
                  Belum ada obat di keranjang
                </div>
              ) : (
                <div className="flex flex-col">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-2.5 p-3 border-b border-[#f0f2f5] hover:bg-[#f8f9fb] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#101828] truncate">{item.name}</div>
                        <div className="text-[12px] text-[#667085]">{fmt(item.sell_price)}/{item.unit}</div>
                      </div>
                      
                      {/* Qty Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center border border-[#d0d5dd] rounded bg-white hover:bg-gray-50 text-[#344054] transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-[14px] font-bold text-[#101828]">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center border border-[#d0d5dd] rounded bg-white hover:bg-gray-50 text-[#344054] transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-[13.5px] font-bold text-[#0f766e] w-[80px] text-right shrink-0">
                        {fmt(item.sell_price * item.qty)}
                      </div>
                      
                      <button onClick={() => setCart(p => p.filter(c => c.id !== item.id))} className="text-[#98a2b3] hover:text-[#dc2626] p-1 transition-colors shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#e4e7ec] bg-white rounded-b-lg shrink-0">
              {isAdmin && (
                <div className="mb-3">
                  <label className="text-[12px] font-semibold text-[#667085] mb-1 flex items-center gap-1"><Tag size={12}/> Diskon (%)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={diskon}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "");
                      const num = v ? parseInt(v) : 0;
                      if (num <= 100) setDiskon(v ? num.toString() : "");
                    }}
                    className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[14px] font-mono focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors"
                  />
                </div>
              )}
              
              <div className="flex flex-col gap-1.5 mb-3">
                {isAdmin && validDiskonPersen > 0 && (
                  <>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-[#667085]">Subtotal</span>
                      <span className="font-medium text-[#344054]">{fmt(subtotalTagihan)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] text-red-600">
                      <span className="text-red-500">Diskon ({validDiskonPersen}%)</span>
                      <span className="font-medium">-{fmt(diskonNominal)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#667085] font-semibold">Total Tagihan</span>
                  <span className="text-[18px] font-bold text-[#101828]">{fmt(totalTagihan)}</span>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={processing || cart.length === 0 || (bayarNum > 0 && kembalian < 0)}
                className={`w-full py-2.5 rounded-md text-[14px] font-bold text-white transition-colors flex justify-center items-center gap-2 ${
                  processing || cart.length === 0 ? "bg-[#99d6d1] cursor-not-allowed" : "bg-[#0f766e] hover:bg-[#0d6963] shadow-sm"
                }`}
              >
                {processing ? "Memproses..." : "Selesaikan Transaksi"}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Info stok tersisa */}
      {cart.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap pb-10 md:pb-0">
          {cart.map(item => {
            const sisaSetelah = item.total_stock - item.qty;
            const isLow = sisaSetelah <= item.min_stock;
            return (
              <span key={item.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${isLow ? 'bg-[#fffbeb] border-[#fcd34d] text-[#92400e]' : 'bg-[#f0fdf4] border-[#bbf7d0] text-[#14532d]'}`}>
                <Package size={12} />
                {item.name}: sisa {sisaSetelah} {item.unit}
                {isLow && " ⚠️"}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
