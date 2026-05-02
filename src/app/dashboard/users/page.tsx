"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, X, CheckCircle, AlertCircle, Shield, Pencil, Trash2 } from "lucide-react";

type User = { id: string; name: string; email: string; role: string; created_at: string };

const ROLES = ["ADMIN", "KASIR"];
const ROLE_CONFIG: Record<string, { color: string; label: string }> = {
  ADMIN: { color: "bg-purple-100 text-purple-700", label: "Admin" },
  KASIR: { color: "bg-emerald-100 text-emerald-700", label: "Kasir" },
};

const EMPTY_FORM = { name: "", email: "", password: "", role: "KASIR" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditTarget(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.role) {
      showToast("error", "Nama, email, dan role wajib diisi."); return;
    }
    if (!editTarget && !form.password) {
      showToast("error", "Password wajib diisi untuk user baru."); return;
    }
    setSaving(true);

    const res = await fetch("/api/users", {
      method: editTarget ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editTarget ? { id: editTarget.id, ...form } : form),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { showToast("error", data.error || "Gagal menyimpan."); return; }
    showToast("success", editTarget ? "User berhasil diperbarui!" : "User baru berhasil ditambahkan!");
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditTarget(null);
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    const data = await res.json();
    setDeleting(false);
    if (!res.ok) { showToast("error", data.error || "Gagal menghapus."); setDeleteTarget(null); return; }
    showToast("success", `User "${deleteTarget.name}" berhasil dihapus.`);
    setDeleteTarget(null);
    fetchUsers();
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
          <h1 className="text-2xl font-bold text-zinc-900">Manajemen User</h1>
          <p className="text-sm text-zinc-500 mt-1">Kelola akun dan hak akses pegawai</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> Tambah User
        </button>
      </div>

      {/* Role Legend */}
      <div className="flex gap-3 flex-wrap">
        {ROLES.map(r => (
          <div key={r} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${ROLE_CONFIG[r].color}`}>
            <Shield className="h-3.5 w-3.5" />
            {ROLE_CONFIG[r].label}: {users.filter(u => u.role === r).length} akun
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-zinc-400">Memuat data user...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">Belum ada user terdaftar</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                <th className="px-5 py-3 text-zinc-500 font-semibold text-xs">Nama</th>
                <th className="px-5 py-3 text-zinc-500 font-semibold text-xs hidden sm:table-cell">Email</th>
                <th className="px-5 py-3 text-zinc-500 font-semibold text-xs">Role</th>
                <th className="px-5 py-3 text-zinc-500 font-semibold text-xs hidden md:table-cell">Bergabung</th>
                <th className="px-5 py-3 text-zinc-500 font-semibold text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-zinc-900 truncate">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-500 text-xs hidden sm:table-cell">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_CONFIG[u.role]?.color}`}>
                      {ROLE_CONFIG[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-400 text-xs hidden md:table-cell whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200">
              <h2 className="text-lg font-bold text-zinc-900">
                {editTarget ? "Edit User" : "Tambah User Baru"}
              </h2>
              <button onClick={() => { setShowModal(false); setEditTarget(null); }}
                className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Nama Lengkap *", key: "name", type: "text", placeholder: "cth. Budi Santoso" },
                { label: "Email *", key: "email", type: "email", placeholder: "budi@apotek.com" },
                { label: editTarget ? "Password Baru (kosongkan jika tidak diubah)" : "Password *", key: "password", type: "password", placeholder: "Minimal 6 karakter" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
                </select>
                <p className="text-xs text-zinc-400 mt-1">
                  {form.role === "KASIR"
                    ? "🛒 Kasir hanya bisa melakukan transaksi penjualan & melihat rekap harian."
                    : "🔑 Admin memiliki akses penuh ke seluruh sistem."}
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowModal(false); setEditTarget(null); }}
                className="flex-1 py-2 border border-zinc-300 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                {saving ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Tambah User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">Hapus User?</h3>
                <p className="text-sm text-zinc-500 mt-0.5">Tindakan ini tidak bisa dibatalkan.</p>
              </div>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3">
              <p className="text-sm font-semibold text-zinc-800">{deleteTarget.name}</p>
              <p className="text-xs text-zinc-500">{deleteTarget.email}</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 border border-zinc-300 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
