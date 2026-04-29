"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Pencil, Trash2, Pill, X, AlertCircle, CheckCircle } from "lucide-react";

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Data Obat</h1>
          <p className="text-sm text-zinc-500 mt-1">Kelola semua jenis obat yang tersedia</p>
        </div>
        {canEdit && (
          <button onClick={openAddModal}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Tambah Obat
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Cari nama obat atau barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Nama Obat</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Barcode</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Kategori</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Satuan</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Harga Jual</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Stok</th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Status</th>
                {canEdit && <th className="text-center px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-zinc-400">Memuat data...</td></tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Pill className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
                    <p className="text-zinc-400 text-sm">Belum ada data obat</p>
                  </td>
                </tr>
              ) : medicines.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{m.name}</td>
                  <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{m.barcode}</td>
                  <td className="px-4 py-3 text-zinc-500">{m.category?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">
                      {m.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">{formatRupiah(m.sell_price)}</td>
                  <td className="px-4 py-3 text-right font-bold">{m.total_stock}</td>
                  <td className="px-4 py-3 text-center">
                    {m.total_stock <= m.min_stock ? (
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-medium">
                        Menipis
                      </span>
                    ) : (
                      <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-medium">
                        Tersedia
                      </span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleDelete(m.id, m.name)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editItem ? "Edit Obat" : "Tambah Obat Baru"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Nama Obat *", key: "name", type: "text", placeholder: "cth. Paracetamol 500mg" },
                { label: "Kode Barcode *", key: "barcode", type: "text", placeholder: "cth. 8991234567890" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Satuan *</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Stok Minimum</label>
                  <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              {/* Harga hanya bisa diubah Admin */}
              {isAdmin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Harga Beli (Rp)</label>
                    <input type="number" value={form.buy_price} onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Harga Jual (Rp)</label>
                    <input type="number" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              )}
              {!isAdmin && editItem && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-xl text-xs text-yellow-700 dark:text-yellow-400">
                  ⚠️ Hanya Admin yang boleh mengubah harga obat.
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
