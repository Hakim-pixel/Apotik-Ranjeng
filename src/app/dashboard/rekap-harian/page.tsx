"use client";

import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import {
 CalendarDays,
 ShoppingCart,
 TrendingUp,
 BarChart3,
 ChevronDown,
 ChevronUp,
 Receipt,
 Download,
} from "lucide-react";

type TransactionDetail = {
 qty: number;
 price: number;
 subtotal: number;
 medicine: { name: string; unit: string } | null;
};

type Transaction = {
 id: string;
 invoice_number: string;
 created_at: string;
 total_amount: number;
 user: { name: string } | null;
 transaction_details: TransactionDetail[];
};

type RekapData = {
 date: string;
 totalTransaksi: number;
 totalPendapatan: number;
 transactions: Transaction[];
};

function formatRupiah(n: number) {
 return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatWaktu(iso: string) {
 return new Date(iso).toLocaleTimeString("id-ID", {
 hour: "2-digit",
 minute: "2-digit",
 });
}

function formatTanggal(iso: string) {
 return new Date(iso).toLocaleDateString("id-ID", {
 weekday: "long",
 day: "numeric",
 month: "long",
 year: "numeric",
 });
}

export default function RekapHarianPage() {
 const today = new Date().toISOString().split("T")[0];
 const [date, setDate] = useState(today);
 const [data, setData] = useState<RekapData | null>(null);
 const [loading, setLoading] = useState(false);
 const [expandedId, setExpandedId] = useState<string | null>(null);

 const fetchRekap = useCallback(async () => {
 setLoading(true);
 const res = await fetch(`/api/rekap-harian?date=${date}`);
 const json = await res.json();
 setData(json);
 setLoading(false);
 }, [date]);

 useEffect(() => {
 fetchRekap();
 }, [fetchRekap]);

 const toggleExpand = (id: string) => {
 setExpandedId((prev) => (prev === id ? null : id));
 };

 const handleExportExcel = () => {
 if (!data || data.transactions.length === 0) return;

 const rows: any[] = [];
 
 data.transactions.forEach(tx => {
 const originalTotal = tx.transaction_details.reduce((sum, d) => sum + d.subtotal, 0);
 const discount = originalTotal - tx.total_amount;
 
 tx.transaction_details.forEach((d, index) => {
 rows.push({
 "No. Invoice": tx.invoice_number,
 "Tanggal": formatTanggal(tx.created_at),
 "Waktu": formatWaktu(tx.created_at),
 "Kasir": tx.user?.name || "-",
 "Nama Obat": d.medicine?.name || "-",
 "Harga Satuan (Rp)": d.price,
 "Qty": d.qty,
 "Subtotal Obat (Rp)": d.subtotal,
 "Diskon Transaksi (Rp)": index === 0 ? discount : 0,
 "Total Akhir Transaksi (Rp)": index === 0 ? tx.total_amount : 0,
 });
 });
 });

 const worksheet = XLSX.utils.json_to_sheet(rows);
 const workbook = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Penjualan");
 XLSX.writeFile(workbook, `Rekap_Apotek_${date}.xlsx`);
 };

 const avgPerTransaksi =
 data && data.totalTransaksi > 0
 ? data.totalPendapatan / data.totalTransaksi
 : 0;

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
 <CalendarDays className="h-7 w-7 text-emerald-500" />
 Rekap Harian
 </h1>
 <p className="text-sm text-zinc-500 mt-1">
 {date === today ? "Hari Ini — " : ""}
 {date && formatTanggal(date + "T00:00:00")}
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-3">
 <div className="flex items-center gap-2">
 <label className="text-sm font-medium text-zinc-600 ">Pilih Tanggal:</label>
 <input
 type="date"
 value={date}
 max={today}
 onChange={(e) => setDate(e.target.value)}
 className="px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
 />
 </div>
 <button
 onClick={handleExportExcel}
 disabled={!data || data.transactions.length === 0}
 className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Download className="h-4 w-4" />
 Export Excel
 </button>
 </div>
 </div>

 {loading ? (
 <div className="flex items-center justify-center py-20 text-zinc-400">
 <div className="text-center">
 <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
 <p className="text-sm">Memuat rekap...</p>
 </div>
 </div>
 ) : data ? (
 <>
 {/* Kartu Ringkasan */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 flex items-center gap-4">
 <div className="bg-blue-50 p-3 rounded-xl">
 <ShoppingCart className="h-6 w-6 text-blue-600 " />
 </div>
 <div>
 <p className="text-xs text-zinc-500 font-medium">Total Transaksi</p>
 <p className="text-2xl font-bold text-zinc-900 ">{data.totalTransaksi}</p>
 </div>
 </div>

 <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 flex items-center gap-4">
 <div className="bg-emerald-50 p-3 rounded-xl">
 <BarChart3 className="h-6 w-6 text-emerald-600 " />
 </div>
 <div>
 <p className="text-xs text-zinc-500 font-medium">Total Pendapatan</p>
 <p className="text-xl font-bold text-emerald-600 ">
 {formatRupiah(data.totalPendapatan)}
 </p>
 </div>
 </div>

 <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 flex items-center gap-4">
 <div className="bg-purple-50 p-3 rounded-xl">
 <TrendingUp className="h-6 w-6 text-purple-600 " />
 </div>
 <div>
 <p className="text-xs text-zinc-500 font-medium">Rata-rata / Transaksi</p>
 <p className="text-xl font-bold text-purple-600 ">
 {formatRupiah(Math.round(avgPerTransaksi))}
 </p>
 </div>
 </div>
 </div>

 {/* Daftar Transaksi */}
 <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-x-auto">
 <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 ">
 <Receipt className="h-5 w-5 text-emerald-500" />
 <h2 className="font-semibold text-zinc-900 ">
 Rincian Transaksi
 </h2>
 <span className="ml-auto text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
 {data.transactions.length} transaksi
 </span>
 </div>

 {data.transactions.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-zinc-300 ">
 <Receipt className="h-12 w-12 mb-3" />
 <p className="font-medium text-zinc-500">Tidak ada transaksi pada tanggal ini</p>
 <p className="text-sm text-zinc-400 mt-1">Pilih tanggal lain atau lakukan transaksi dulu</p>
 </div>
 ) : (
 <div className="divide-y divide-zinc-100 ">
 {data.transactions.map((tx) => (
 <div key={tx.id}>
 {/* Baris Utama */}
 <button
 onClick={() => toggleExpand(tx.id)}
 className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors text-left"
 >
 <div className="bg-emerald-50 p-2 rounded-lg flex-shrink-0">
 <ShoppingCart className="h-4 w-4 text-emerald-600 " />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-mono text-sm font-semibold text-zinc-900 ">
 {tx.invoice_number}
 </p>
 <p className="text-xs text-zinc-400 mt-0.5">
 {formatWaktu(tx.created_at)} · Kasir: {tx.user?.name || "-"}
 {" · "}
 {tx.transaction_details?.length || 0} item
 </p>
 </div>
 <div className="text-right flex-shrink-0">
 <p className="font-bold text-emerald-600 text-sm">
 {formatRupiah(tx.total_amount)}
 </p>
 </div>
 <div className="text-zinc-400 flex-shrink-0">
 {expandedId === tx.id
 ? <ChevronUp className="h-4 w-4" />
 : <ChevronDown className="h-4 w-4" />}
 </div>
 </button>

 {/* Detail Expand */}
 {expandedId === tx.id && (
 <div className="px-5 pb-4 bg-zinc-50 ">
 <table className="w-full text-sm">
 <thead>
 <tr className="text-xs text-zinc-400 border-b border-zinc-200 ">
 <th className="text-left py-2 font-medium">Nama Obat</th>
 <th className="text-right py-2 font-medium">Qty</th>
 <th className="text-right py-2 font-medium">Harga</th>
 <th className="text-right py-2 font-medium">Subtotal</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100 ">
 {tx.transaction_details.map((d, i) => (
 <tr key={i} className="text-zinc-700 ">
 <td className="py-2 font-medium">{d.medicine?.name || "-"}</td>
 <td className="py-2 text-right text-zinc-500">
 {d.qty} {d.medicine?.unit}
 </td>
 <td className="py-2 text-right text-zinc-500">
 {formatRupiah(d.price)}
 </td>
 <td className="py-2 text-right font-semibold text-emerald-600 ">
 {formatRupiah(d.subtotal)}
 </td>
 </tr>
 ))}
 </tbody>
 <tfoot>
 <tr className="border-t border-zinc-200 ">
 <td colSpan={3} className="py-2 text-right font-bold text-zinc-900 ">
 TOTAL
 </td>
 <td className="py-2 text-right font-bold text-emerald-600 ">
 {formatRupiah(tx.total_amount)}
 </td>
 </tr>
 </tfoot>
 </table>
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </>
 ) : null}
 </div>
 );
}
