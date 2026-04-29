"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Plus, Minus, Trash2, AlertTriangle, X, Package, Printer } from "lucide-react";

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

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 8, width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e4e7ec", background: "#f0fdf4" }}>
          <span style={{ fontWeight: 700, color: "#14532d", fontSize: 14 }}>✅ Transaksi Berhasil</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}><X size={16} /></button>
        </div>

        {/* Struk Preview */}
        <div style={{ padding: 16, maxHeight: 400, overflowY: "auto" }}>
          <div ref={printRef}>
            <div className="c b" style={{ textAlign: "center", fontWeight: "bold", fontFamily: "monospace" }}>APOTEK RANJENG</div>
            <div className="c" style={{ textAlign: "center", fontSize: 11, color: "#667085", fontFamily: "monospace" }}>Jl. Ranjeng No. 1 | Tel: 0xx-xxxx</div>
            <div className="hr" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }}></div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "monospace", marginBottom: 2 }}>
              <span>No. Struk</span><span style={{ fontWeight: "bold" }}>{invoice.invoice_number}</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "monospace", marginBottom: 8 }}>
              <span>Tanggal</span><span>{tgl}</span>
            </div>
            <div className="hr" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }}></div>

            {invoice.details?.map((d, i) => (
              <div key={i} style={{ marginBottom: 6, fontFamily: "monospace" }}>
                <div style={{ fontWeight: "bold", fontSize: 12 }}>{d.medicine?.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span>{d.qty} {d.medicine?.unit} × {fmt(d.price)}</span>
                  <span style={{ fontWeight: "bold" }}>{fmt(d.subtotal)}</span>
                </div>
              </div>
            ))}

            <div className="hr" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 13, fontFamily: "monospace" }}>
              <span>TOTAL</span><span>{fmt(invoice.total_amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "monospace", marginTop: 3 }}>
              <span>Bayar</span><span>{fmt(bayar)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: "bold", color: "#0f766e", fontFamily: "monospace" }}>
              <span>Kembalian</span><span>{fmt(kembalian)}</span>
            </div>
            <div className="hr" style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }}></div>
            <div style={{ textAlign: "center", fontSize: 11, color: "#98a2b3", fontFamily: "monospace" }}>Terima kasih! Semoga lekas sembuh 🙏</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid #e4e7ec" }}>
          <button onClick={handlePrint} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#0f766e", color: "#fff", border: "none", borderRadius: 6, padding: "8px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Printer size={14} /> Cetak Struk
          </button>
          <button onClick={onClose} style={{ flex: 1, background: "#fff", border: "1px solid #d0d5dd", borderRadius: 6, padding: "8px", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#344054" }}>
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
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [bayar, setBayar] = useState("");
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [showAlert, setShowAlert] = useState(true);

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

  const total = cart.reduce((s, c) => s + c.sell_price * c.qty, 0);
  const bayarNum = parseInt(bayar.replace(/\D/g, ""), 10) || 0;
  const kembalian = bayarNum - total;

  const handleCheckout = async () => {
    if (cart.length === 0) { showToast("err", "Keranjang kosong!"); return; }
    if (bayarNum < total) { showToast("err", "Uang bayar kurang!"); return; }
    setProcessing(true);
    const res = await fetch("/api/penjualan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map(c => ({ medicine_id: c.id, qty: c.qty })) }),
    });
    const data = await res.json();
    setProcessing(false);
    if (!res.ok) { showToast("err", data.error || "Transaksi gagal."); return; }
    setInvoice(data); setCart([]); setBayar("");
    fetch("/api/restock-alert").then(r => r.json()).then(d => { if (Array.isArray(d)) setLowStock(d); });
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 200,
          background: toast.type === "ok" ? "#16a34a" : "#dc2626",
          color: "#fff", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>{toast.msg}</div>
      )}

      {/* Struk Modal */}
      {invoice && (
        <StrukModal
          invoice={invoice} bayar={bayarNum} kembalian={kembalian < 0 ? 0 : kembalian}
          onClose={() => setInvoice(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#101828" }}>Penjualan</h1>
          <p style={{ fontSize: 12, color: "#667085", margin: "3px 0 0" }}>Stok dipotong otomatis berdasarkan FEFO</p>
        </div>
      </div>

      {/* Alert Stok */}
      {lowStock.length > 0 && showAlert && (
        <div style={{
          background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 6,
          padding: "8px 12px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <AlertTriangle size={14} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 12 }}>
            <strong style={{ color: "#92400e" }}>{lowStock.length} obat perlu direstok:</strong>{" "}
            <span style={{ color: "#78350f" }}>
              {lowStock.map(i => `${i.name} (sisa ${i.total_stock} ${i.unit})`).join(", ")}
            </span>
          </div>
          <button onClick={() => setShowAlert(false)} style={{ border: "none", background: "none", cursor: "pointer", padding: 2, color: "#d97706" }}>
            <X size={13} />
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
        {/* Kiri: Cari + Bayar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Search */}
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #f0f2f5", display: "flex", alignItems: "center", gap: 8 }}>
              <Search size={14} color="#98a2b3" />
              <input
                type="text"
                placeholder="Cari obat / scan barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                style={{
                  flex: 1, border: "none", outline: "none", fontSize: 13,
                  color: "#101828", background: "transparent",
                }}
              />
              {loading && <span style={{ fontSize: 11, color: "#98a2b3" }}>Mencari...</span>}
            </div>

            {medicines.length > 0 && (
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fb" }}>
                      {["Nama Obat", "Barcode", "Stok", "Harga", ""].map(h => (
                        <th key={h} style={{ padding: "6px 12px", textAlign: "left", fontSize: 11, color: "#667085", fontWeight: 600, borderBottom: "1px solid #e4e7ec" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map(m => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #f0f2f5", cursor: m.total_stock > 0 ? "pointer" : "not-allowed", opacity: m.total_stock === 0 ? 0.5 : 1 }}
                        onClick={() => addToCart(m)}
                        onMouseEnter={e => { if (m.total_stock > 0) (e.currentTarget as HTMLElement).style.background = "#f8f9fb"; }}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                        <td style={{ padding: "8px 12px", fontWeight: 500, fontSize: 13 }}>{m.name}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "#667085" }}>{m.barcode}</td>
                        <td style={{ padding: "8px 12px", fontSize: 12 }}>
                          <span style={{
                            fontWeight: 700,
                            color: m.total_stock === 0 ? "#dc2626" : m.total_stock <= m.min_stock ? "#d97706" : "#16a34a"
                          }}>
                            {m.total_stock} {m.unit}
                            {m.total_stock <= m.min_stock && m.total_stock > 0 && " ⚠️"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 600, fontSize: 13, color: "#0f766e" }}>{fmt(m.sell_price)}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ fontSize: 11, background: "#f0fdf4", color: "#14532d", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>+ Tambah</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!search && medicines.length === 0 && (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#98a2b3", fontSize: 13 }}>
                Ketik nama atau scan barcode untuk mencari obat
              </div>
            )}
          </div>

          {/* Pembayaran */}
          {cart.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#344054", marginBottom: 10 }}>Pembayaran</div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#667085", marginBottom: 4, display: "block" }}>Uang Bayar (Rp)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={bayar}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "");
                    setBayar(v ? parseInt(v).toLocaleString("id-ID") : "");
                  }}
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #d0d5dd", borderRadius: 6, fontSize: 14, fontFamily: "monospace", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#0f766e"}
                  onBlur={e => e.target.style.borderColor = "#d0d5dd"}
                />
              </div>
              {/* Nominal cepat */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {[5000, 10000, 20000, 50000, 100000].map(n => (
                  <button key={n} onClick={() => setBayar(n.toLocaleString("id-ID"))} style={{ padding: "4px 10px", border: "1px solid #d0d5dd", borderRadius: 4, background: "#f8f9fb", fontSize: 11, cursor: "pointer", fontWeight: 500 }}>
                    {fmt(n)}
                  </button>
                ))}
              </div>
              {bayarNum > 0 && (
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: 6, fontSize: 13, fontWeight: 700,
                  background: kembalian >= 0 ? "#f0fdf4" : "#fee2e2",
                  color: kembalian >= 0 ? "#14532d" : "#991b1b",
                }}>
                  <span>{kembalian >= 0 ? "Kembalian" : "Kurang"}</span>
                  <span>{fmt(Math.abs(kembalian))}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kanan: Keranjang */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, display: "flex", flexDirection: "column", height: "fit-content" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f2f5", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#344054" }}>Keranjang</span>
            {cart.length > 0 && (
              <span style={{ marginLeft: "auto", background: "#0f766e", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>{cart.length}</span>
            )}
          </div>

          <div style={{ flex: 1, maxHeight: 320, overflowY: "auto" }}>
            {cart.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#98a2b3", fontSize: 13 }}>
                Keranjang kosong
              </div>
            ) : cart.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderBottom: "1px solid #f0f2f5" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#101828", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "#667085" }}>{fmt(item.sell_price)}/{item.unit}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ width: 22, height: 22, border: "1px solid #d0d5dd", borderRadius: 4, background: "#f8f9fb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Minus size={11} />
                  </button>
                  <span style={{ width: 24, textAlign: "center", fontSize: 13, fontWeight: 700 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ width: 22, height: 22, border: "1px solid #d0d5dd", borderRadius: 4, background: "#f8f9fb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={11} />
                  </button>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", minWidth: 70, textAlign: "right" }}>{fmt(item.sell_price * item.qty)}</span>
                <button onClick={() => setCart(p => p.filter(c => c.id !== item.id))} style={{ border: "none", background: "none", cursor: "pointer", color: "#dc2626", padding: 2 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ padding: "12px 14px", borderTop: "1px solid #e4e7ec" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#667085" }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#101828" }}>{fmt(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={processing || cart.length === 0 || (bayarNum > 0 && kembalian < 0)}
              style={{
                width: "100%", padding: "9px", background: processing || cart.length === 0 ? "#99d6d1" : "#0f766e",
                color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700,
                cursor: processing || cart.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {processing ? "Memproses..." : `Bayar ${fmt(total)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Info stok tersisa */}
      {cart.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cart.map(item => {
            const sisaSetelah = item.total_stock - item.qty;
            return (
              <span key={item.id} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: sisaSetelah <= item.min_stock ? "#fffbeb" : "#f0fdf4",
                border: `1px solid ${sisaSetelah <= item.min_stock ? "#fcd34d" : "#bbf7d0"}`,
                color: sisaSetelah <= item.min_stock ? "#92400e" : "#14532d",
                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
              }}>
                <Package size={10} />
                {item.name}: sisa {sisaSetelah} {item.unit} setelah transaksi
                {sisaSetelah <= item.min_stock && " ⚠️"}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
