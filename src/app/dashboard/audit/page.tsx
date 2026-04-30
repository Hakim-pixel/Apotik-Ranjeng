"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ClipboardList, ShieldAlert, ChevronDown, ChevronRight } from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  created_at: string;
  user: { name: string } | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-[#dcfce7] text-[#166534]",
  UPDATE: "bg-[#dbeafe] text-[#1e40af]",
  DELETE: "bg-[#fee2e2] text-[#991b1b]",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/audit");
    if (res.status === 403) { setLoading(false); return; }
    const data = await res.json();
    setLogs(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Helper to safely get the base action
  const getBaseAction = (actionStr: string) => {
    if (actionStr.includes("CREATE")) return "CREATE";
    if (actionStr.includes("UPDATE")) return "UPDATE";
    if (actionStr.includes("DELETE")) return "DELETE";
    return "UPDATE";
  };

  return (
    <div className="max-w-[1200px] w-full mx-auto pb-8 md:pb-0 space-y-6">
      <div>
        <h1 className="text-[18px] md:text-[20px] font-bold text-[#101828] m-0">Audit Trail</h1>
        <p className="text-[13px] md:text-[14px] text-[#667085] mt-1 mb-0">Rekaman semua aktivitas perubahan data di sistem</p>
      </div>

      <div className="bg-[#fffbeb] border border-[#fef3c7] p-4 rounded-lg flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-[#f59e0b] shrink-0 mt-0.5" />
        <p className="text-[13.5px] text-[#92400e] leading-relaxed m-0">
          Halaman ini hanya dapat diakses oleh <strong>Admin</strong>. Semua perubahan data (edit harga, hapus obat, ubah stok, dll) tercatat di sini beserta identitas pengguna dan waktu kejadian.
        </p>
      </div>

      <div className="bg-white border border-[#e4e7ec] rounded-lg overflow-x-auto flex flex-col">
        {loading ? (
          <div className="py-12 px-4 text-center text-[#98a2b3] text-[13.5px]">Memuat log audit...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <ClipboardList className="h-10 w-10 text-[#d0d5dd] mx-auto mb-2" />
            <p className="text-[#98a2b3] text-[13.5px]">Belum ada aktivitas yang tercatat di sistem.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#f8f9fb] border-b border-[#e4e7ec]">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 font-semibold text-[#667085]">Aksi</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#667085]">Tabel</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#667085] hidden md:table-cell">Pengguna</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#667085]">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {logs.map(log => {
                  const baseAction = getBaseAction(log.action);
                  const isExpanded = expanded === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        onClick={() => setExpanded(isExpanded ? null : log.id)}
                        className={`hover:bg-[#f8f9fb] transition-colors cursor-pointer ${isExpanded ? "bg-[#f8f9fb]" : ""}`}
                      >
                        <td className="px-4 py-3 text-[#98a2b3]">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${ACTION_COLORS[baseAction] || "bg-gray-100 text-gray-700"}`}>
                            {log.action.replace("_MEDICINE", "").replace("_BATCH", "")}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-[#344054]">
                          {log.table_name}
                        </td>
                        <td className="px-4 py-3 text-[#101828] font-medium hidden md:table-cell">
                          {log.user?.name || "System"}
                        </td>
                        <td className="px-4 py-3 text-[#667085] text-right whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("id-ID", {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-[#f8f9fb]">
                          <td colSpan={5} className="p-0 border-b border-[#e4e7ec]">
                            <div className="px-10 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-[#0f766e]">
                              {log.old_data && Object.keys(log.old_data).length > 0 && (
                                <div>
                                  <p className="text-[12px] font-bold text-[#667085] mb-2 uppercase tracking-wider">Data Sebelum (Old)</p>
                                  <pre className="text-[11.5px] bg-white border border-[#e4e7ec] p-3 rounded-md overflow-x-auto text-[#344054] shadow-sm">
                                    {JSON.stringify(log.old_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_data && Object.keys(log.new_data).length > 0 && (
                                <div>
                                  <p className="text-[12px] font-bold text-[#667085] mb-2 uppercase tracking-wider">Data Sesudah (New)</p>
                                  <pre className="text-[11.5px] bg-white border border-[#e4e7ec] p-3 rounded-md overflow-x-auto text-[#344054] shadow-sm">
                                    {JSON.stringify(log.new_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {(!log.old_data || Object.keys(log.old_data).length === 0) && (!log.new_data || Object.keys(log.new_data).length === 0) && (
                                <div className="text-[12px] text-[#98a2b3] italic">Tidak ada rincian data untuk perubahan ini.</div>
                              )}
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
        )}
      </div>
    </div>
  );
}
