"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  CreditCard, AlertTriangle, CheckCircle, Clock, Search,
  Filter, RefreshCw, TrendingUp, XCircle, User, Receipt,
  ChevronDown, X
} from "lucide-react";

type CreditItem = {
  id: string;
  customer_name: string;
  amount: number;
  credit_days: number;
  due_date: string;
  status: "BELUM_LUNAS" | "LUNAS";
  paid_at: string | null;
  created_at: string;
  is_overdue: boolean;
  days_overdue: number;
  days_remaining: number;
  transaction: { 
    invoice_number: string; 
    total_amount: number; 
    created_at: string;
    transaction_details: {
      qty: number;
      price: number;
      subtotal: number;
      medicine: { name: string; unit: string };
    }[];
  };
  user: { name: string };
};

function fmt(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function KreditPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [credits, setCredits] = useState<CreditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"SEMUA" | "BELUM_LUNAS" | "LUNAS">("SEMUA");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<CreditItem | null>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    const params = filterStatus !== "SEMUA" ? `?status=${filterStatus}` : "";
    const res = await fetch(`/api/kredit${params}`);
    const data = await res.json();
    setCredits(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const handleLunas = async (creditId: string, customerName: string) => {
    setProcessing(creditId);
    const res = await fetch("/api/kredit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credit_id: creditId }),
    });
    setProcessing(null);
    if (res.ok) {
      showToast("ok", `✅ Kredit ${customerName} berhasil ditandai lunas!`);
      fetchCredits();
      setSelectedCredit(null);
    } else {
      showToast("err", "Gagal memperbarui status kredit.");
    }
  };

  const filtered = credits.filter(c =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.transaction?.invoice_number?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const totalAktif = credits.filter(c => c.status === "BELUM_LUNAS").length;
  const totalOverdue = credits.filter(c => c.is_overdue).length;
  const totalLunas = credits.filter(c => c.status === "LUNAS").length;
  const nilaiAktif = credits.filter(c => c.status === "BELUM_LUNAS").reduce((s, c) => s + c.amount, 0);

  return (
    <div className="max-w-[1100px] w-full mx-auto pb-8 md:pb-0">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 md:top-4 right-4 z-50 px-4 py-2.5 rounded-md text-white text-[13.5px] font-semibold shadow-lg transition-all ${toast.type === "ok" ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}>
          {toast.msg}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCredit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl w-full max-w-[400px] shadow-2xl overflow-hidden">
            <div className={`px-5 py-4 flex items-center justify-between ${selectedCredit.is_overdue ? "bg-[#fee2e2]" : selectedCredit.status === "LUNAS" ? "bg-[#f0fdf4]" : "bg-[#f5f3ff]"}`}>
              <div>
                <div className={`text-[15px] font-bold ${selectedCredit.is_overdue ? "text-[#991b1b]" : selectedCredit.status === "LUNAS" ? "text-[#14532d]" : "text-[#5b21b6]"}`}>
                  {selectedCredit.customer_name}
                </div>
                <div className="text-[12px] text-[#667085] mt-0.5">{selectedCredit.transaction?.invoice_number}</div>
              </div>
              <button onClick={() => setSelectedCredit(null)} className="p-1.5 rounded-full hover:bg-black/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f8f9fb] rounded-lg p-3">
                  <div className="text-[11px] text-[#667085] font-semibold mb-1">Total Tagihan</div>
                  <div className="text-[15px] font-bold text-[#101828]">{fmt(selectedCredit.amount)}</div>
                </div>
                <div className="bg-[#f8f9fb] rounded-lg p-3">
                  <div className="text-[11px] text-[#667085] font-semibold mb-1">Tenor Kredit</div>
                  <div className="text-[15px] font-bold text-[#101828]">{selectedCredit.credit_days} Hari</div>
                </div>
                <div className="bg-[#f8f9fb] rounded-lg p-3">
                  <div className="text-[11px] text-[#667085] font-semibold mb-1">Tanggal Transaksi</div>
                  <div className="text-[13px] font-bold text-[#101828]">{formatDate(selectedCredit.created_at)}</div>
                </div>
                <div className={`rounded-lg p-3 ${selectedCredit.is_overdue ? "bg-[#fee2e2]" : selectedCredit.status === "LUNAS" ? "bg-[#f0fdf4]" : "bg-[#fffbeb]"}`}>
                  <div className="text-[11px] text-[#667085] font-semibold mb-1">Jatuh Tempo</div>
                  <div className={`text-[13px] font-bold ${selectedCredit.is_overdue ? "text-[#dc2626]" : "text-[#101828]"}`}>{formatDate(selectedCredit.due_date)}</div>
                </div>
              </div>

              {/* Detail Obat */}
              <div className="bg-[#f8f9fb] rounded-lg p-3">
                <div className="text-[11px] text-[#667085] font-semibold mb-2">Obat yang Dibeli</div>
                <div className="flex flex-col gap-2">
                  {selectedCredit.transaction?.transaction_details?.map((td, i) => (
                    <div key={i} className="flex justify-between items-center text-[13px] border-b border-[#e4e7ec] last:border-0 pb-1.5 last:pb-0">
                      <div>
                        <span className="font-bold text-[#344054]">{td.medicine?.name}</span>
                        <span className="text-[#667085] ml-1">x{td.qty} {td.medicine?.unit}</span>
                      </div>
                      <span className="font-semibold text-[#101828]">{fmt(td.subtotal)}</span>
                    </div>
                  ))}
                  {(!selectedCredit.transaction?.transaction_details || selectedCredit.transaction.transaction_details.length === 0) && (
                    <div className="text-[12px] text-[#98a2b3] italic">Detail obat tidak tersedia (transaksi lama)</div>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div className={`rounded-lg p-3 flex items-center gap-2 ${selectedCredit.is_overdue ? "bg-[#fee2e2] text-[#991b1b]" : selectedCredit.status === "LUNAS" ? "bg-[#f0fdf4] text-[#14532d]" : "bg-[#fffbeb] text-[#92400e]"}`}>
                {selectedCredit.status === "LUNAS" ? <CheckCircle size={16}/> : selectedCredit.is_overdue ? <AlertTriangle size={16}/> : <Clock size={16}/>}
                <span className="font-bold text-[13px]">
                  {selectedCredit.status === "LUNAS"
                    ? `Lunas pada ${formatDate(selectedCredit.paid_at!)}`
                    : selectedCredit.is_overdue
                      ? `Terlambat ${selectedCredit.days_overdue} hari`
                      : `Sisa ${selectedCredit.days_remaining} hari`
                  }
                </span>
              </div>

              {/* Kasir info */}
              <div className="text-[12px] text-[#667085] flex items-center gap-1.5">
                <User size={12}/> Dicatat oleh: <strong className="text-[#344054]">{selectedCredit.user?.name || "—"}</strong>
              </div>

              {/* Action */}
              {selectedCredit.status === "BELUM_LUNAS" && (
                <button
                  onClick={() => handleLunas(selectedCredit.id, selectedCredit.customer_name)}
                  disabled={processing === selectedCredit.id}
                  className="w-full py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  <CheckCircle size={16}/>
                  {processing === selectedCredit.id ? "Memproses..." : "Tandai Lunas"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] md:text-[20px] font-bold text-[#101828] m-0">Kredit Pelanggan</h1>
          <p className="text-[13px] md:text-[14px] text-[#667085] mt-1 mb-0">
            Daftar pelanggan yang membeli obat secara kredit
          </p>
        </div>
        <button onClick={fetchCredits} className="flex items-center gap-1.5 px-3 py-2 border border-[#d0d5dd] rounded-lg text-[13px] font-semibold text-[#344054] hover:bg-gray-50 transition-colors shrink-0">
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-[#e4e7ec] rounded-lg p-3.5" style={{ borderLeft: "4px solid #dc2626" }}>
          <div className="text-[11px] text-[#98a2b3] font-semibold uppercase tracking-wider mb-1">Jatuh Tempo</div>
          <div className="text-[22px] font-bold text-[#dc2626]">{totalOverdue}</div>
          <div className="text-[11px] text-[#667085]">kredit overdue</div>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-lg p-3.5" style={{ borderLeft: "4px solid #7c3aed" }}>
          <div className="text-[11px] text-[#98a2b3] font-semibold uppercase tracking-wider mb-1">Kredit Aktif</div>
          <div className="text-[22px] font-bold text-[#7c3aed]">{totalAktif}</div>
          <div className="text-[11px] text-[#667085]">belum lunas</div>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-lg p-3.5" style={{ borderLeft: "4px solid #16a34a" }}>
          <div className="text-[11px] text-[#98a2b3] font-semibold uppercase tracking-wider mb-1">Sudah Lunas</div>
          <div className="text-[22px] font-bold text-[#16a34a]">{totalLunas}</div>
          <div className="text-[11px] text-[#667085]">transaksi</div>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-lg p-3.5" style={{ borderLeft: "4px solid #0f766e" }}>
          <div className="text-[11px] text-[#98a2b3] font-semibold uppercase tracking-wider mb-1">Total Piutang</div>
          <div className="text-[16px] font-bold text-[#0f766e] truncate">{fmt(nilaiAktif)}</div>
          <div className="text-[11px] text-[#667085]">belum terbayar</div>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="bg-white border border-[#e4e7ec] rounded-lg mb-4">
        <div className="px-4 py-3 flex flex-col sm:flex-row gap-3 border-b border-[#f0f2f5]">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 px-3 py-2 border border-[#d0d5dd] rounded-lg">
            <Search size={14} className="text-[#98a2b3] shrink-0"/>
            <input
              type="text"
              placeholder="Cari nama pelanggan atau no. invoice..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 border-none outline-none text-[13.5px] text-[#101828] bg-transparent"
            />
          </div>
          {/* Status Filter */}
          <div className="flex gap-1.5">
            {(["SEMUA", "BELUM_LUNAS", "LUNAS"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-lg text-[12px] font-bold border transition-colors ${
                  filterStatus === s
                    ? s === "BELUM_LUNAS" ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                      : s === "LUNAS" ? "bg-[#16a34a] text-white border-[#16a34a]"
                      : "bg-[#0f766e] text-white border-[#0f766e]"
                    : "bg-white text-[#344054] border-[#d0d5dd] hover:bg-gray-50"
                }`}
              >
                {s === "SEMUA" ? "Semua" : s === "BELUM_LUNAS" ? "Belum Lunas" : "Lunas"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-[#98a2b3] text-[13.5px]">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-2 text-[#98a2b3]">
            <CreditCard size={32} className="opacity-30"/>
            <span className="text-[13.5px]">Tidak ada data kredit ditemukan</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px] min-w-[600px]">
              <thead>
                <tr className="bg-[#f8f9fb]">
                  <th className="py-2.5 px-4 text-left text-[#667085] font-semibold border-b border-[#e4e7ec]">Pelanggan</th>
                  <th className="py-2.5 px-4 text-left text-[#667085] font-semibold border-b border-[#e4e7ec] hidden sm:table-cell">Invoice</th>
                  <th className="py-2.5 px-4 text-right text-[#667085] font-semibold border-b border-[#e4e7ec]">Jumlah</th>
                  <th className="py-2.5 px-4 text-center text-[#667085] font-semibold border-b border-[#e4e7ec] hidden md:table-cell">Tenor</th>
                  <th className="py-2.5 px-4 text-center text-[#667085] font-semibold border-b border-[#e4e7ec]">Jatuh Tempo</th>
                  <th className="py-2.5 px-4 text-center text-[#667085] font-semibold border-b border-[#e4e7ec]">Status</th>
                  <th className="py-2.5 px-4 border-b border-[#e4e7ec]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cr => (
                  <tr
                    key={cr.id}
                    onClick={() => setSelectedCredit(cr)}
                    className={`border-b border-[#f0f2f5] cursor-pointer hover:bg-[#f8f9fb] transition-colors ${cr.is_overdue ? "bg-[#fff5f5] hover:bg-[#fee2e2]" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#101828]">{cr.customer_name}</div>
                      <div className="text-[11px] text-[#667085]">{formatDate(cr.created_at)}</div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="font-mono text-[12px] text-[#667085]">{cr.transaction?.invoice_number}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#101828] whitespace-nowrap">
                      {fmt(cr.amount)}
                    </td>
                    <td className="py-3 px-4 text-center hidden md:table-cell">
                      <span className="px-2 py-0.5 bg-[#f5f3ff] text-[#7c3aed] rounded-full text-[11px] font-bold">
                        {cr.credit_days}h
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className={`text-[12px] font-semibold ${cr.is_overdue ? "text-[#dc2626]" : "text-[#344054]"}`}>
                        {formatDate(cr.due_date)}
                      </div>
                      {cr.status === "BELUM_LUNAS" && (
                        <div className={`text-[11px] ${cr.is_overdue ? "text-[#dc2626] font-bold" : "text-[#667085]"}`}>
                          {cr.is_overdue ? `⚠️ Telat ${cr.days_overdue}h` : `Sisa ${cr.days_remaining}h`}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {cr.status === "LUNAS" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] rounded-full text-[11px] font-bold">
                          <CheckCircle size={10}/> Lunas
                        </span>
                      ) : cr.is_overdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5] rounded-full text-[11px] font-bold">
                          <AlertTriangle size={10}/> Jatuh Tempo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5f3ff] text-[#7c3aed] border border-[#c4b5fd] rounded-full text-[11px] font-bold">
                          <Clock size={10}/> Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {cr.status === "BELUM_LUNAS" && (
                        <button
                          onClick={e => { e.stopPropagation(); handleLunas(cr.id, cr.customer_name); }}
                          disabled={processing === cr.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#f0fdf4] border border-[#bbf7d0] text-[#14532d] rounded-lg text-[11px] font-bold hover:bg-[#dcfce7] transition-colors disabled:opacity-60 whitespace-nowrap"
                        >
                          <CheckCircle size={11}/>
                          {processing === cr.id ? "..." : "Lunas"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 bg-[#f8f9fb] border-t border-[#e4e7ec] text-[12px] text-[#667085]">
            Menampilkan {filtered.length} dari {credits.length} data kredit
          </div>
        )}
      </div>
    </div>
  );
}
