"use client";

import { useState, useEffect, useCallback } from "react";
import { PackagePlus, X, CheckCircle, AlertCircle, Search } from "lucide-react";

type Medicine = { id: string; name: string; barcode: string; unit: string };
type Supplier = { id: string; name: string };

export default function StokPage() {
  const [batches, setBatches] = useState<{
    id: string;
    batch_number: string;
    expired_date: string;
    stock: number;
    medicine: { name: string; barcode: string; unit: string } | null;
    supplier: { name: string } | null;
  }[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchMed, setSearchMed] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    medicine_id: "", batch_number: "", expired_date: "",
    stock: "", supplier_id: ""
  });
  const [selectedMedName, setSelectedMedName] = useState("");
  const [medResults, setMedResults] = useState<Medicine[]>([]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/stok");
    const data = await res.json();
    setBatches(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const res = await fetch("/api/supplier");
    const data = await res.json();
    setSuppliers(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchBatches(); fetchSuppliers(); }, [fetchBatches, fetchSuppliers]);

  useEffect(() => {
    if (!searchMed.trim()) { setMedResults([]); return; }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/obat?search=${searchMed}`);
      const data = await res.json();
      setMedResults(Array.isArray(data) ? data : []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchMed]);

  const selectMedicine = (m: Medicine) => {
    setForm({ ...form, medicine_id: m.id });
    setSelectedMedName(m.name);
    setSearchMed("");
    setMedResults([]);
  };

  const handleSave = async () => {
    if (!form.medicine_id || !form.batch_number || !form.expired_date || !form.stock) {
      showToast("error", "Semua field wajib diisi."); return;
    }
    setSaving(true);
    const res = await fetch("/api/stok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        stock: Number(form.stock),
        supplier_id: form.supplier_id || null
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { showToast("error", data.error || "Gagal menyimpan."); return; }
    showToast("success", "Batch baru berhasil ditambahkan!");
    setShowModal(false);
    setForm({ medicine_id: "", batch_number: "", expired_date: "", stock: "", supplier_id: "" });
    setSelectedMedName("");
    fetchBatches();
  };

  const today = new Date().toISOString().split("T")[0];
  const threeMonths = new Date();
  threeMonths.setMonth(threeMonths.getMonth() + 3);
  const warnDate = threeMonths.toISOString().split("T")[0];

  return (
    <div className="max-w-[1200px] w-full mx-auto pb-8 md:pb-0">
      {toast && (
        <div className={`fixed top-16 md:top-4 right-4 z-50 px-4 py-2.5 rounded-md text-white text-[13.5px] font-semibold shadow-lg transition-all ${
          toast.type === "success" ? "bg-[#16a34a]" : "bg-[#dc2626]"
        }`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4 inline mr-1.5" /> : <AlertCircle className="h-4 w-4 inline mr-1.5" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[18px] md:text-[20px] font-bold text-[#101828] m-0">Stok & Batch</h1>
          <p className="text-[13px] md:text-[14px] text-[#667085] mt-1 mb-0">Urutan berdasarkan FEFO – expired paling dekat tampil di atas</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-[#0f766e] hover:bg-[#0d6963] text-white px-4 py-2 rounded-md text-[13.5px] font-semibold transition-colors shrink-0">
          <PackagePlus size={16} /> Tambah Batch
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white border border-[#e4e7ec] rounded-lg overflow-hidden flex flex-col">
        {loading || batches.length === 0 ? (
          <div className="py-12 px-4 text-center">
            {loading ? (
              <p className="text-[#98a2b3] text-[13.5px]">Memuat data...</p>
            ) : (
              <>
                <PackagePlus className="h-10 w-10 text-[#d0d5dd] mx-auto mb-2" />
                <p className="text-[#98a2b3] text-[13.5px]">Belum ada data batch</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[800px]">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9fb] border-b border-[#e4e7ec]">
                      {["Nama Obat", "Barcode", "No. Batch", "Expired", "Stok", "Supplier", "Status"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 font-semibold text-[#667085]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(b => {
                      const isExpired = b.expired_date < today;
                      const isWarn = !isExpired && b.expired_date <= warnDate;
                      return (
                        <tr key={b.id} className={`border-b border-[#f0f2f5] hover:bg-[#f8f9fb] transition-colors ${isExpired ? "opacity-60" : ""}`}>
                          <td className="px-4 py-3 font-semibold text-[#101828]">{b.medicine?.name || "-"}</td>
                          <td className="px-4 py-3 text-[#667085] font-mono text-[12px]">{b.medicine?.barcode || "-"}</td>
                          <td className="px-4 py-3 font-mono text-[12px] font-semibold text-[#344054]">{b.batch_number}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-[12px] font-semibold ${
                              isExpired ? "bg-gray-100 text-gray-600 border border-gray-200" :
                              isWarn ? "bg-[#fffbeb] text-[#92400e] border border-[#fcd34d]" :
                              "bg-[#f0fdf4] text-[#14532d] border border-[#bbf7d0]"
                            }`}>
                              {new Date(b.expired_date).toLocaleDateString("id-ID")}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-[#101828]">{b.stock}</td>
                          <td className="px-4 py-3 text-[#667085] text-[12.5px]">{b.supplier?.name || "-"}</td>
                          <td className="px-4 py-3">
                            {isExpired ? (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[11px] font-bold border border-gray-200">Expired</span>
                            ) : isWarn ? (
                              <span className="bg-[#fffbeb] text-[#d97706] px-2 py-1 rounded-md text-[11px] font-bold border border-[#fcd34d]">⚠ Segera Habis</span>
                            ) : (
                              <span className="bg-[#f0fdf4] text-[#16a34a] px-2 py-1 rounded-md text-[11px] font-bold border border-[#bbf7d0]">OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-0 border-t border-[#e4e7ec]">
              {batches.map(b => {
                const isExpired = b.expired_date < today;
                const isWarn = !isExpired && b.expired_date <= warnDate;
                return (
                  <div key={b.id} className={`p-4 border-b border-[#f0f2f5] flex flex-col gap-2 ${isExpired ? "opacity-60 bg-gray-50" : "bg-white"}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-[#101828] text-[15px] mb-1 leading-tight">{b.medicine?.name || "-"}</h3>
                        <div className="text-[12px] font-mono text-[#667085]">{b.medicine?.barcode || "-"}</div>
                      </div>
                      <div className="shrink-0">
                        {isExpired ? (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[11px] font-bold border border-gray-200">Expired</span>
                        ) : isWarn ? (
                          <span className="bg-[#fffbeb] text-[#d97706] px-2 py-0.5 rounded-md text-[11px] font-bold border border-[#fcd34d]">⚠ Segera Habis</span>
                        ) : (
                          <span className="bg-[#f0fdf4] text-[#16a34a] px-2 py-0.5 rounded-md text-[11px] font-bold border border-[#bbf7d0]">Aman</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-1 text-[13px]">
                      <div className="bg-[#f8f9fb] p-2 rounded-md border border-[#f0f2f5]">
                        <span className="block text-[11px] text-[#667085] mb-0.5">Sisa Stok</span>
                        <span className="font-bold text-[#101828]">{b.stock} {b.medicine?.unit}</span>
                      </div>
                      <div className="bg-[#f8f9fb] p-2 rounded-md border border-[#f0f2f5]">
                        <span className="block text-[11px] text-[#667085] mb-0.5">No. Batch</span>
                        <span className="font-mono text-[#344054] font-semibold text-[12px]">{b.batch_number}</span>
                      </div>
                      <div className="col-span-2 flex justify-between items-center bg-[#f8f9fb] p-2 rounded-md border border-[#f0f2f5]">
                        <div>
                          <span className="block text-[11px] text-[#667085] mb-0.5">Tanggal Expired</span>
                          <span className={`font-semibold ${isExpired ? "text-red-600" : isWarn ? "text-orange-600" : "text-[#14532d]"}`}>
                            {new Date(b.expired_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] text-[#667085] mb-0.5">Supplier</span>
                          <span className="font-semibold text-[#344054]">{b.supplier?.name || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal Tambah Batch */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-[#e4e7ec] bg-[#f8f9fb]">
              <h2 className="text-[16px] font-bold text-[#101828]">Tambah Batch / Restok</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-gray-200 text-[#667085] transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Cari obat */}
              <div>
                <label className="block text-[13px] font-bold text-[#344054] mb-1.5">Nama Obat *</label>
                {selectedMedName ? (
                  <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-2 rounded-md">
                    <span className="text-[13.5px] font-semibold text-[#14532d] flex-1">{selectedMedName}</span>
                    <button onClick={() => { setSelectedMedName(""); setForm({ ...form, medicine_id: "" }); }}
                      className="text-[#16a34a] hover:text-[#dc2626] transition-colors p-1"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98a2b3]" />
                    <input type="text" placeholder="Cari obat..." value={searchMed}
                      onChange={(e) => setSearchMed(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors" />
                    {medResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-[#e4e7ec] rounded-md mt-1 shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                        {medResults.map(m => (
                          <button key={m.id} onClick={() => selectMedicine(m)}
                            className="w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#f8f9fb] transition-colors text-[#101828] font-medium border-b border-[#f0f2f5] last:border-0">
                            {m.name} <span className="text-[#98a2b3] text-[11px] font-mono ml-1">({m.barcode})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-[13px] font-bold text-[#344054] mb-1.5">No. Batch / Lot *</label>
                <input type="text" placeholder="cth. LOT-20251201" value={form.batch_number}
                  onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                  className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] font-mono outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-[#344054] mb-1.5">Tgl Expired *</label>
                  <input type="date" value={form.expired_date} min={today}
                    onChange={(e) => setForm({ ...form, expired_date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#344054] mb-1.5">Jumlah Stok *</label>
                  <input type="number" min="1" placeholder="0" value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors" />
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] font-bold text-[#344054] mb-1.5">Supplier</label>
                <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors bg-white">
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-[#e4e7ec] flex gap-3 bg-[#f8f9fb]">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 bg-white border border-[#d0d5dd] rounded-md text-[13.5px] font-semibold text-[#344054] hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className={`flex-1 py-2 rounded-md text-[13.5px] font-semibold text-white transition-colors ${
                  saving ? "bg-[#99d6d1] cursor-not-allowed" : "bg-[#0f766e] hover:bg-[#0d6963]"
                }`}>
                {saving ? "Menyimpan..." : "Simpan Batch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
