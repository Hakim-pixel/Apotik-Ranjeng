"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, CalendarX, TrendingUp, ShoppingCart, Download, ChevronUp, ChevronDown } from "lucide-react";

type SaleTransaction = {
 id: string;
 invoice_number: string;
 created_at: string;
 total_amount: number;
 user: { name: string } | null;
 transaction_details: {
   qty: number;
   price: number;
   subtotal: number;
   medicine: { name: string } | null;
 }[];
};

type ExpiredBatch = {
 id: string;
 batch_number: string;
 expired_date: string;
 stock: number;
 medicine: { name: string; barcode: string; unit: string } | null;
};

type TopMedicine = {
 name: string;
 unit: string;
 total_qty: number;
};

function formatRupiah(n: number | null | undefined) {
 return `Rp ${(n || 0).toLocaleString("id-ID")}`;
}

export default function LaporanPage() {
 const [activeTab, setActiveTab] = useState<"penjualan" | "expired" | "terlaris">("penjualan");
 const [from, setFrom] = useState(() => {
 const d = new Date(); d.setDate(1);
 return d.toISOString().split("T")[0];
 });
 const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
 const [sales, setSales] = useState<SaleTransaction[]>([]);
 const [expired, setExpired] = useState<ExpiredBatch[]>([]);
 const [terlaris, setTerlaris] = useState<TopMedicine[]>([]);
 const [loading, setLoading] = useState(false);
 const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

 const fetchData = useCallback(async () => {
 setLoading(true);
 if (activeTab === "penjualan") {
 const res = await fetch(`/api/laporan?type=penjualan&from=${from}&to=${to}`);
 const data = await res.json();
 setSales(Array.isArray(data) ? data : []);
 } else if (activeTab === "expired") {
 const res = await fetch("/api/laporan?type=expired");
 const data = await res.json();
 setExpired(Array.isArray(data) ? data : []);
 } else {
 const res = await fetch(`/api/laporan?type=terlaris&from=${from}&to=${to}`);
 const data = await res.json();
 setTerlaris(Array.isArray(data) ? data : []);
 }
 setLoading(false);
 }, [activeTab, from, to]);

 useEffect(() => { fetchData(); }, [fetchData]);

 const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  const handleExportExcel = async () => {
    if (!sales || sales.length === 0) return;

    const XLSX = await import("xlsx");
    const rows: any[] = [];
    
    sales.forEach(s => {
      const originalTotal = s.transaction_details?.reduce((sum, d) => sum + d.subtotal, 0) || 0;
      const discount = originalTotal - s.total_amount;
      
      s.transaction_details?.forEach((d, index) => {
        rows.push({
          "No. Invoice": s.invoice_number,
          "Tanggal": new Date(s.created_at).toLocaleString("id-ID"),
          "Kasir": s.user?.name || "-",
          "Nama Obat": d.medicine?.name || "-",
          "Harga Satuan (Rp)": d.price,
          "Qty": d.qty,
          "Subtotal Obat (Rp)": d.subtotal,
          "Diskon Transaksi (Rp)": index === 0 ? discount : 0,
          "Total Akhir Transaksi (Rp)": index === 0 ? s.total_amount : 0,
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");
    XLSX.writeFile(workbook, `Laporan_Penjualan_${from}_sampai_${to}.xlsx`);
  };

 const tabs = [
 { key: "penjualan" as const, label: "Penjualan", icon: ShoppingCart },
 { key: "expired" as const, label: "Hampir Expired", icon: CalendarX },
 { key: "terlaris" as const, label: "Obat Terlaris", icon: TrendingUp },
 ];

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 ">Laporan</h1>
 <p className="text-sm text-zinc-500 mt-1">Analisis penjualan, stok, dan obat</p>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl w-fit">
 {tabs.map(tab => {
 const Icon = tab.icon;
 return (
 <button key={tab.key} onClick={() => setActiveTab(tab.key)}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
 activeTab === tab.key
 ? "bg-white text-zinc-900 shadow-sm"
 : "text-zinc-500 hover:text-zinc-700 "
 }`}>
 <Icon className="h-4 w-4" />
 {tab.label}
 </button>
 );
 })}
 </div>

 {/* Filter Tanggal */}
 {activeTab !== "expired" && (
 <div className="flex items-center gap-3 flex-wrap">
 <label className="text-sm font-medium text-zinc-600 ">Periode:</label>
 <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
 className="px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
 <span className="text-zinc-400 text-sm">s/d</span>
 <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
 className="px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
 </div>
 )}

 {/* Content */}
 {loading ? (
 <div className="text-center py-12 text-zinc-400">Memuat laporan...</div>
 ) : activeTab === "penjualan" ? (
 <div className="space-y-4">
 {/* Summary */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {[
 { label: "Total Transaksi", value: sales.length, icon: ShoppingCart, color: "text-blue-600 ", bg: "bg-blue-50 " },
 { label: "Total Pendapatan", value: formatRupiah(totalRevenue), icon: BarChart3, color: "text-emerald-600 ", bg: "bg-emerald-50 " },
 { label: "Rata-rata / Transaksi", value: sales.length > 0 ? formatRupiah(Math.round(totalRevenue / sales.length)) : "Rp 0", icon: TrendingUp, color: "text-purple-600 ", bg: "bg-purple-50 " },
 ].map(s => {
 const Icon = s.icon;
 return (
 <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200 flex items-center gap-3">
 <div className={`${s.bg} p-3 rounded-xl`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
 <div>
 <p className="text-xs text-zinc-500">{s.label}</p>
 <p className="font-bold text-zinc-900 ">{s.value}</p>
 </div>
 </div>
 );
 })}
 </div>
 <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-x-auto">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-zinc-50 border-b border-zinc-200 ">
 <th className="text-left px-4 py-3 font-semibold text-zinc-600 ">Invoice</th>
 <th className="text-left px-4 py-3 font-semibold text-zinc-600 ">Tanggal</th>
 <th className="text-left px-4 py-3 font-semibold text-zinc-600 hidden md:table-cell">Kasir</th>
 <th className="text-right px-4 py-3 font-semibold text-zinc-600 ">Total</th>
 </tr>
 </thead>
              <tbody className="divide-y divide-zinc-100">
                {sales.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-zinc-400">Tidak ada transaksi pada periode ini.</td></tr>
                ) : sales.map(s => {
                  const isExpanded = expandedInvoice === s.id;
                  const originalTotal = s.transaction_details?.reduce((sum, d) => sum + d.subtotal, 0) || 0;
                  const discountAmount = originalTotal - s.total_amount;
                  return (
                    <React.Fragment key={s.id}>
                      <tr 
                        onClick={() => setExpandedInvoice(isExpanded ? null : s.id)}
                        className={`hover:bg-zinc-50 cursor-pointer transition-colors ${isExpanded ? "bg-zinc-50" : ""}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-zinc-900 whitespace-nowrap">
                          {s.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                          {new Date(s.created_at).toLocaleString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 hidden md:table-cell whitespace-nowrap">
                          {s.user?.name || "-"}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600 text-right whitespace-nowrap flex justify-end items-center gap-2">
                          {formatRupiah(s.total_amount)}
                          <span className="text-zinc-400">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </td>
                      </tr>
                      {/* Expanded Details */}
                      {isExpanded && (
                        <tr className="bg-zinc-50">
                          <td colSpan={4} className="p-0 border-b border-zinc-200">
                            <div className="px-8 py-3 border-l-4 border-emerald-500">
                              <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Item Pembelian:</p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-zinc-500 border-b border-zinc-200">
                                    <th className="text-left py-1 font-medium">Nama Obat</th>
                                    <th className="text-right py-1 font-medium">Qty</th>
                                    <th className="text-right py-1 font-medium hidden sm:table-cell">Harga</th>
                                    <th className="text-right py-1 font-medium">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                  {s.transaction_details?.map((item, idx) => (
                                    <tr key={idx} className="text-zinc-700">
                                      <td className="py-1.5 font-medium">{item.medicine?.name || "-"}</td>
                                      <td className="py-1.5 text-right text-zinc-500">{item.qty}</td>
                                      <td className="py-1.5 text-right text-zinc-500 hidden sm:table-cell">{formatRupiah(item.price)}</td>
                                      <td className="py-1.5 text-right font-semibold text-emerald-600">{formatRupiah(item.subtotal)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  {(discountAmount > 0) && (
                                    <tr className="text-zinc-500 font-medium border-t border-zinc-100">
                                      <td colSpan={3} className="py-1.5 text-right">Diskon:</td>
                                      <td className="py-1.5 text-right text-red-500">-{formatRupiah(discountAmount)}</td>
                                    </tr>
                                  )}
                                  <tr className="font-bold text-zinc-900 border-t border-zinc-200">
                                    <td colSpan={3} className="py-1.5 text-right">TOTAL:</td>
                                    <td className="py-1.5 text-right text-emerald-600">{formatRupiah(s.total_amount)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
 </table>
 </div>
 <div className="flex justify-end p-4">
   <button
     onClick={handleExportExcel}
     className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
   >
     <Download size={16} /> Export Excel (Detail)
   </button>
 </div>
 </div>
 </div>
 ) : activeTab === "expired" ? (
 <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-x-auto">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-zinc-50 border-b border-zinc-200 ">
 <th className="text-left px-4 py-3 font-semibold text-zinc-600 ">Nama Obat</th>
 <th className="text-left px-4 py-3 font-semibold text-zinc-600 hidden md:table-cell">Barcode</th>
 <th className="text-left px-4 py-3 font-semibold text-zinc-600 hidden sm:table-cell">No. Batch</th>
 <th className="text-left px-4 py-3 font-semibold text-zinc-600 ">Expired</th>
 <th className="text-right px-4 py-3 font-semibold text-zinc-600 ">Sisa Stok</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100 ">
 {expired.length === 0 ? (
 <tr><td colSpan={5} className="text-center py-8 text-zinc-400">✅ Tidak ada obat yang hampir expired dalam 3 bulan ke depan.</td></tr>
 ) : expired.map(b => {
 const expDate = new Date(b.expired_date);
 const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
 return (
 <tr key={b.id} className="hover:bg-zinc-50 ">
 <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">
 {b.medicine?.name || "-"}
 <span className="block sm:hidden text-[11px] font-mono text-zinc-500 mt-0.5">{b.batch_number}</span>
 </td>
 <td className="px-4 py-3 text-zinc-500 font-mono text-xs hidden md:table-cell whitespace-nowrap">{b.medicine?.barcode || "-"}</td>
 <td className="px-4 py-3 font-mono text-xs hidden sm:table-cell whitespace-nowrap">{b.batch_number}</td>
 <td className="px-4 py-3 whitespace-nowrap">
 <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium ${
 daysLeft <= 30 ? "bg-red-100 text-red-600 " :
 "bg-orange-100 text-orange-600 "
 }`}>
 {expDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: '2-digit' })} 
 <span className="hidden sm:inline"> ({daysLeft} hari lagi)</span>
 </span>
 </td>
 <td className="px-4 py-3 font-bold text-zinc-900 text-right whitespace-nowrap">{b.stock} <span className="text-[11px] font-normal text-zinc-500">{b.medicine?.unit}</span></td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-x-auto">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-zinc-50 border-b border-zinc-200 ">
 <th className="text-center px-4 py-3 font-semibold text-zinc-600 w-16">#</th>
 <th className="text-left px-4 py-3 font-semibold text-zinc-600 ">Nama Obat</th>
 <th className="text-left px-4 py-3 font-semibold text-zinc-600 hidden sm:table-cell">Satuan</th>
 <th className="text-right px-4 py-3 font-semibold text-zinc-600 ">Total Terjual</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100 ">
 {terlaris.length === 0 ? (
 <tr><td colSpan={4} className="text-center py-8 text-zinc-400">Belum ada data penjualan.</td></tr>
 ) : terlaris.map((m, i) => (
 <tr key={i} className="hover:bg-zinc-50 ">
 <td className="px-4 py-3 text-center whitespace-nowrap">
 <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
 i === 0 ? "bg-yellow-100 text-yellow-700" :
 i === 1 ? "bg-zinc-200 text-zinc-700" :
 i === 2 ? "bg-orange-100 text-orange-700" :
 "bg-zinc-100 text-zinc-600"
 }`}>{i + 1}</span>
 </td>
 <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">
 {m.name}
 <span className="block sm:hidden text-[11px] font-normal text-zinc-500 mt-0.5">{m.unit}</span>
 </td>
 <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell whitespace-nowrap">{m.unit}</td>
 <td className="px-4 py-3 font-bold text-emerald-600 text-right whitespace-nowrap">{m.total_qty}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 );
}
