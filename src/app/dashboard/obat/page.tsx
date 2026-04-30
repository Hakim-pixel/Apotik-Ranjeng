"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Pencil, Trash2, Pill, X, AlertCircle, CheckCircle, Package } from "lucide-react";

type Medicine = {
  id: string;
  barcode: string;
  name: string;
  category: { name: string } | null;
  unit: string;
  buy_price: number;
  sell_price: number;
  total_stock: number;
  min_stock: number;
};

type Category = { id: number; name: string };

const UNIT_OPTIONS = ["TABLET", "STRIP", "BOTOL", "KAPSUL", "AMPUL", "TUBE", "SACHET", "BOX"];

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function ObatPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || "KASIR";
  const isAdmin = role === "ADMIN";
  const canEdit = role === "ADMIN" || role === "APOTEKER";

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Medicine | null>(null);
  const [form, setForm] = useState({
    name: "", barcode: "", category_id: "", unit: "TABLET",
    buy_price: "", sell_price: "", min_stock: "10",
  });
  const [saving, setSaving] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/obat?search=${search}`);
    const data = await res.json();
    setMedicines(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/kategori");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openAddModal = () => {
    setEditItem(null);
    setForm({ name: "", barcode: "", category_id: "", unit: "TABLET", buy_price: "", sell_price: "", min_stock: "10" });
    setShowModal(true);
  };

  const openEditModal = (m: Medicine) => {
    setEditItem(m);
    setForm({
      name: m.name, barcode: m.barcode,
      category_id: m.category ? String((categories.find(c => c.name === m.category?.name)?.id ?? "")) : "",
      unit: m.unit, buy_price: String(m.buy_price),
      sell_price: String(m.sell_price), min_stock: String(m.min_stock),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      buy_price: Number(form.buy_price),
      sell_price: Number(form.sell_price),
      min_stock: Number(form.min_stock),
      category_id: form.category_id ? Number(form.category_id) : null,
    };

    const url = editItem ? `/api/obat/${editItem.id}` : "/api/obat";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();

    setSaving(false);
    if (!res.ok) { showToast("error", data.error || "Gagal menyimpan."); return; }

    showToast("success", editItem ? "Obat berhasil diperbarui!" : "Obat baru berhasil ditambahkan!");
    setShowModal(false);
    fetchMedicines();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus obat "${name}"? Data batch juga akan terhapus.`)) return;
    const res = await fetch(`/api/obat/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { showToast("error", data.error || "Gagal menghapus."); return; }
    showToast("success", "Obat berhasil dihapus.");
    fetchMedicines();
  };

  return (
    <div className="max-w-[1200px] w-full mx-auto pb-8 md:pb-0">
      {/* Toast */}
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
          <h1 className="text-[18px] md:text-[20px] font-bold text-[#101828] m-0">Data Obat</h1>
          <p className="text-[13px] md:text-[14px] text-[#667085] mt-1 mb-0">Kelola semua jenis obat yang tersedia</p>
        </div>
        {canEdit && (
          <button onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-[#0f766e] hover:bg-[#0d6963] text-white px-4 py-2 rounded-md text-[13.5px] font-semibold transition-colors shrink-0">
            <Plus size={16} /> Tambah Obat
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98a2b3]" />
        <input
          type="text"
          placeholder="Cari nama obat atau barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-[#d0d5dd] rounded-md text-[13.5px] bg-white focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors"
        />
      </div>

      {/* List / Table Area */}
      {loading ? (
        <div className="bg-white border border-[#e4e7ec] rounded-lg py-12 text-center text-[#98a2b3] text-[13.5px]">
          Memuat data obat...
        </div>
      ) : medicines.length === 0 ? (
        <div className="bg-white border border-[#e4e7ec] rounded-lg py-12 text-center flex flex-col items-center">
          <Pill className="h-10 w-10 text-[#d0d5dd] mb-2" />
          <p className="text-[#98a2b3] text-[13.5px]">Belum ada data obat</p>
        </div>
      ) : (
        <>
          {/* Table View */}
          <div className="w-full bg-white border border-[#e4e7ec] rounded-lg overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#f8f9fb] border-b border-[#e4e7ec]">
                  <th className="text-left px-4 py-3 font-semibold text-[#667085]">Nama Obat</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#667085] hidden md:table-cell">Barcode</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#667085] hidden md:table-cell">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#667085] hidden md:table-cell">Satuan</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#667085]">Harga</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#667085]">Stok</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#667085] hidden sm:table-cell">Status</th>
                  {canEdit && <th className="text-center px-4 py-3 font-semibold text-[#667085]">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m.id} className="border-b border-[#f0f2f5] hover:bg-[#f8f9fb] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#101828]">
                      {m.name}
                      {/* Tampilkan satuan kecil di bawah nama khusus di mobile */}
                      <span className="block md:hidden text-[11px] text-[#667085] font-normal mt-0.5">{m.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-[#667085] font-mono text-[12px] hidden md:table-cell">{m.barcode}</td>
                    <td className="px-4 py-3 text-[#667085] hidden md:table-cell">{m.category?.name || "-"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] px-2 py-0.5 rounded-md text-[11px] font-bold">
                        {m.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#0f766e] whitespace-nowrap">{formatRupiah(m.sell_price)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-[#101828]">{m.total_stock}</span>
                      {/* Indikator warning jika stok menipis, tampil di sebelah angka stok di mobile */}
                      {m.total_stock <= m.min_stock && (
                        <span className="inline-block sm:hidden ml-1 text-[#d97706]">⚠️</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {m.total_stock <= m.min_stock ? (
                        <span className="bg-[#fffbeb] text-[#d97706] border border-[#fcd34d] px-2 py-0.5 rounded-md text-[11px] font-bold">
                          Menipis
                        </span>
                      ) : (
                        <span className="bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] px-2 py-0.5 rounded-md text-[11px] font-bold">
                          Tersedia
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button onClick={() => openEditModal(m)} className="p-1.5 rounded-md text-[#667085] hover:text-[#0f766e] hover:bg-[#f0fdf4] transition-colors">
                            <Pencil size={16} />
                          </button>
                          {isAdmin && (
                            <button onClick={() => handleDelete(m.id, m.name)} className="p-1.5 rounded-md text-[#667085] hover:text-[#dc2626] hover:bg-[#fee2e2] transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-[#e4e7ec] bg-[#f8f9fb]">
              <h2 className="text-[16px] font-bold text-[#101828]">
                {editItem ? "Edit Obat" : "Tambah Obat Baru"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-gray-200 text-[#667085] transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {[
                { label: "Nama Obat *", key: "name", type: "text", placeholder: "cth. Paracetamol 500mg" },
                { label: "Kode Barcode *", key: "barcode", type: "text", placeholder: "cth. 8991234567890" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-[13px] font-bold text-[#344054] mb-1.5">{label}</label>
                  <input type={type} placeholder={placeholder} value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors" />
                </div>
              ))}
              
              <div>
                <label className="block text-[13px] font-bold text-[#344054] mb-1.5">Kategori</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] bg-white outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors">
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-[#344054] mb-1.5">Satuan *</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] bg-white outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors">
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#344054] mb-1.5">Stok Minimum</label>
                  <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                    className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors" />
                </div>
              </div>

              {/* Harga hanya bisa diubah Admin */}
              {isAdmin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-bold text-[#344054] mb-1.5">Harga Beli (Rp)</label>
                    <input type="number" value={form.buy_price} onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                      className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#344054] mb-1.5">Harga Jual (Rp)</label>
                    <input type="number" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                      className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors" />
                  </div>
                </div>
              )}
              {!isAdmin && editItem && (
                <div className="bg-[#fffbeb] border border-[#fcd34d] p-3 rounded-md text-[12px] text-[#92400e] font-medium flex items-center gap-2 mt-2">
                  <AlertCircle size={14} className="shrink-0" />
                  Hanya Admin yang boleh mengubah harga obat.
                </div>
              )}
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
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
