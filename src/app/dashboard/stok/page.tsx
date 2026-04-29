"use client";

import { useState, useEffect, useCallback } from "react";
import { PackagePlus, Plus, X, CheckCircle, AlertCircle, Search } from "lucide-react";

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
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Stok & Batch</h1>
          <p className="text-sm text-zinc-500 mt-1">Urutan berdasarkan FEFO – expired paling dekat tampil di atas</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <PackagePlus className="h-4 w-4" /> Tambah Batch
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                {["Nama Obat", "Barcode", "No. Batch", "Expired", "Stok", "Supplier", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-zinc-400">Memuat data...</td></tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <PackagePlus className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
                    <p className="text-zinc-400 text-sm">Belum ada data batch</p>
                  </td>
                </tr>
              ) : batches.map(b => {
                const isExpired = b.expired_date < today;
                const isWarn = !isExpired && b.expired_date <= warnDate;
                return (
                  <tr key={b.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isExpired ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{b.medicine?.name || "-"}</td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{b.medicine?.barcode || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{b.batch_number}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isExpired ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-500" :
                        isWarn ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" :
                        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      }`}>
                        {new Date(b.expired_date).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">{b.stock}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{b.supplier?.name || "-"}</td>
                    <td className="px-4 py-3">
                      {isExpired ? (
                        <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-500 px-2 py-0.5 rounded-full text-xs font-medium">Expired</span>
                      ) : isWarn ? (
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-medium">⚠ Segera Habis</span>
                      ) : (
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-medium">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Tambah Batch / Restok</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Cari obat */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Obat *</label>
                {selectedMedName ? (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-xl">
                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex-1">{selectedMedName}</span>
                    <button onClick={() => { setSelectedMedName(""); setForm({ ...form, medicine_id: "" }); }}
                      className="text-emerald-600 hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input type="text" placeholder="Cari obat..." value={searchMed}
                      onChange={(e) => setSearchMed(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    {medResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl mt-1 shadow-lg overflow-hidden">
                        {medResults.map(m => (
                          <button key={m.id} onClick={() => selectMedicine(m)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-zinc-900 dark:text-white">
                            {m.name} <span className="text-zinc-400 text-xs">({m.barcode})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">No. Batch / Lot *</label>
                <input type="text" placeholder="cth. LOT-20251201" value={form.batch_number}
                  onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tgl Expired *</label>
                  <input type="date" value={form.expired_date} min={today}
                    onChange={(e) => setForm({ ...form, expired_date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Jumlah Stok *</label>
                  <input type="number" min="1" placeholder="0" value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Supplier</label>
                <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                {saving ? "Menyimpan..." : "Simpan Batch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
