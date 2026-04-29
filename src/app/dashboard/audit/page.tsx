"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, ShieldAlert } from "lucide-react";

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
  CREATE_MEDICINE: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  UPDATE_MEDICINE: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  UPDATE: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  DELETE_MEDICINE: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  DELETE: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Audit Trail</h1>
        <p className="text-sm text-zinc-500 mt-1">Rekaman semua aktivitas perubahan data di sistem</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Halaman ini hanya dapat diakses oleh <strong>Admin</strong>. Semua perubahan data (edit harga, hapus obat, dll) tercatat di sini beserta identitas pengguna.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-zinc-400">Memuat log audit...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">Belum ada aktivitas tercatat.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {logs.map(log => (
              <div key={log.id}>
                <button
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${ACTION_COLORS[log.action] || "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
                    {log.action}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 font-mono text-xs flex-1 truncate">{log.table_name}</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{log.user?.name || "System"}</span>
                  <span className="text-xs text-zinc-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("id-ID")}
                  </span>
                </button>
                {expanded === log.id && (
                  <div className="px-5 pb-4 bg-zinc-50 dark:bg-zinc-800/30 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 mb-1">Data Sebelum</p>
                      <pre className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl overflow-x-auto text-zinc-700 dark:text-zinc-300">
                        {log.old_data ? JSON.stringify(log.old_data, null, 2) : "–"}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 mb-1">Data Sesudah</p>
                      <pre className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl overflow-x-auto text-zinc-700 dark:text-zinc-300">
                        {log.new_data ? JSON.stringify(log.new_data, null, 2) : "–"}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
