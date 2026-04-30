"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Tags } from "lucide-react";
import { useSession } from "next-auth/react";

type Category = {
  id: string;
  name: string;
  description: string | null;
};

export default function KategoriPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kategori");
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setFormData({ id: "", name: "", description: "" });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setFormData({ 
      id: c.id, 
      name: c.name, 
      description: c.description || "" 
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    setSaving(true);
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/kategori/${formData.id}` : "/api/kategori";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Gagal menyimpan data kategori");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Data tidak bisa dihapus jika ada obat dengan kategori ini.`)) return;
    try {
      const res = await fetch(`/api/kategori/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus kategori");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-[1000px] w-full mx-auto pb-8 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[18px] md:text-[20px] font-bold text-[#101828] m-0">Data Kategori Obat</h1>
          <p className="text-[13px] md:text-[14px] text-[#667085] mt-1 mb-0">Kelola kategori untuk mengklasifikasi obat</p>
        </div>
        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-[#0f766e] hover:bg-[#0d6963] text-white px-4 py-2 rounded-md text-[13.5px] font-semibold transition-colors shrink-0"
          >
            <Plus size={16} /> Tambah Kategori
          </button>
        )}
      </div>

      <div className="bg-white border border-[#e4e7ec] rounded-lg overflow-hidden flex flex-col">
        {/* Search */}
        <div className="px-4 py-3 border-b border-[#e4e7ec] bg-[#f8f9fb]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98a2b3]" />
            <input 
              type="text" 
              placeholder="Cari kategori..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors" 
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 px-4 text-center text-[#98a2b3] text-[13.5px]">Memuat data kategori...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Tags className="h-10 w-10 text-[#d0d5dd] mx-auto mb-2" />
            <p className="text-[#98a2b3] text-[13.5px]">Belum ada data kategori yang ditemukan.</p>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-white border-b border-[#e4e7ec]">
                  <th className="text-left px-4 py-3 font-semibold text-[#667085]">Nama Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#667085] hidden md:table-cell">Deskripsi</th>
                  {isAdmin && <th className="text-center px-4 py-3 font-semibold text-[#667085] w-[100px]">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-[#f0f2f5] hover:bg-[#f8f9fb] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#101828]">
                      {c.name}
                      <span className="block md:hidden text-[11px] font-normal text-[#667085] mt-0.5">{c.description || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-[#667085] hidden md:table-cell max-w-[300px] truncate">{c.description || "-"}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button onClick={() => openEditModal(c)} className="p-1.5 rounded-md text-[#667085] hover:text-[#0f766e] hover:bg-[#f0fdf4] transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 rounded-md text-[#667085] hover:text-[#dc2626] hover:bg-[#fee2e2] transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e4e7ec] flex justify-between items-center bg-[#f8f9fb]">
              <h3 className="font-bold text-[#101828] text-[15px]">
                {isEditing ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#98a2b3] hover:text-[#344054]">
                X
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#344054] mb-1.5">Nama Kategori *</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
                  placeholder="Contoh: Obat Keras, Sirup, dll"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#344054] mb-1.5">Deskripsi Singkat</label>
                <textarea 
                  rows={3}
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] resize-none"
                  placeholder="Keterangan singkat tentang kategori ini..."
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#e4e7ec] mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-[#344054] bg-white border border-[#d0d5dd] rounded-md text-[13.5px] font-semibold hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={saving || !formData.name} className="flex-1 py-2 text-white bg-[#0f766e] hover:bg-[#0d6963] rounded-md text-[13.5px] font-semibold transition-colors disabled:opacity-50">
                  {saving ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
