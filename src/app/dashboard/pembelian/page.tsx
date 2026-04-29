"use client";

import { useState, useEffect } from "react";
import { PackageCheck, Search, Plus } from "lucide-react";
import Link from "next/link";

type BatchHistory = {
  id: string;
  batch_number: string;
  stock: number;
  created_at: string;
  expired_date: string;
  medicine: { name: string; unit: string } | null;
  supplier: { name: string } | null;
};

export default function PembelianPage() {
  const [history, setHistory] = useState<BatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const res = await fetch("/api/stok"); // Memanggil data stok batch
      const data = await res.json();
      if (Array.isArray(data)) {
        // Karena GET /api/stok default urut FEFO, kita urut ulang berdasarkan yang baru masuk (created_at)
        const sorted = data.sort((a, b) => new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime());
        setHistory(sorted);
      }
      setLoading(false);
    }
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(h => 
    h.medicine?.name.toLowerCase().includes(search.toLowerCase()) || 
    h.batch_number.toLowerCase().includes(search.toLowerCase()) ||
    h.supplier?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] w-full mx-auto pb-8 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[18px] md:text-[20px] font-bold text-[#101828] m-0">Riwayat Pembelian / Restok</h1>
          <p className="text-[13px] md:text-[14px] text-[#667085] mt-1 mb-0">Catatan masuknya barang ke apotek</p>
        </div>
        <Link href="/dashboard/stok" className="flex items-center justify-center gap-2 bg-[#0f766e] hover:bg-[#0d6963] text-white px-4 py-2 rounded-md text-[13.5px] font-semibold transition-colors shrink-0">
          <Plus size={16} /> Tambah Stok Baru
        </Link>
      </div>

      <div className="bg-white border border-[#e4e7ec] rounded-lg overflow-hidden flex flex-col">
        {/* Search */}
        <div className="px-4 py-3 border-b border-[#e4e7ec] bg-[#f8f9fb]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98a2b3]" />
            <input 
              type="text" 
              placeholder="Cari obat, no. batch, atau supplier..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#d0d5dd] rounded-md text-[13.5px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition-colors" 
            />
          </div>
        </div>

        {loading || filteredHistory.length === 0 ? (
          <div className="py-12 px-4 text-center">
            {loading ? (
              <p className="text-[#98a2b3] text-[13.5px]">Memuat data pembelian...</p>
            ) : (
              <>
                <PackageCheck className="h-10 w-10 text-[#d0d5dd] mx-auto mb-2" />
                <p className="text-[#98a2b3] text-[13.5px]">Belum ada data riwayat pembelian</p>
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
                    <tr className="bg-white border-b border-[#e4e7ec]">
                      <th className="text-left px-4 py-3 font-semibold text-[#667085]">Tanggal Masuk</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#667085]">Nama Obat</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#667085]">No. Batch</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#667085]">Expired</th>
                      <th className="text-right px-4 py-3 font-semibold text-[#667085]">Stok Masuk</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#667085]">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(h => (
                      <tr key={h.id} className="border-b border-[#f0f2f5] hover:bg-[#f8f9fb] transition-colors">
                        <td className="px-4 py-3 text-[#344054]">
                          {h.created_at ? new Date(h.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#101828]">{h.medicine?.name || "-"}</td>
                        <td className="px-4 py-3 font-mono text-[12px] font-medium text-[#667085]">{h.batch_number}</td>
                        <td className="px-4 py-3 text-[#344054]">
                          {new Date(h.expired_date).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#0f766e] text-right">+{h.stock} {h.medicine?.unit}</td>
                        <td className="px-4 py-3 text-[#667085]">{h.supplier?.name || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-0 border-t border-[#e4e7ec]">
              {filteredHistory.map(h => (
                <div key={h.id} className="bg-white p-4 border-b border-[#f0f2f5] flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-[#101828] text-[15px] mb-1 leading-tight">{h.medicine?.name || "-"}</h3>
                      <div className="text-[12px] font-mono text-[#667085]">{h.batch_number}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-[11px] text-[#667085] mb-0.5">Tanggal Masuk</span>
                      <span className="font-semibold text-[#344054] text-[13px]">
                        {h.created_at ? new Date(h.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[13px]">
                    <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-2 rounded-md">
                      <span className="block text-[11px] text-[#16a34a] mb-0.5">Stok Masuk</span>
                      <span className="font-bold text-[#14532d] text-[14px]">+{h.stock} {h.medicine?.unit}</span>
                    </div>
                    <div className="bg-[#f8f9fb] border border-[#f0f2f5] p-2 rounded-md">
                      <span className="block text-[11px] text-[#667085] mb-0.5">Expired</span>
                      <span className="font-semibold text-[#344054]">
                        {new Date(h.expired_date).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="block text-[11px] text-[#667085] mb-0.5">Supplier</span>
                      <span className="font-semibold text-[#344054] text-[13.5px]">{h.supplier?.name || "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
