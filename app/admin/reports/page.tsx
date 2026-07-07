// app/admin/reports/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

interface PeriodOption {
  _id: string;
  name: string;
  startMonth: string;
  endMonth: string;
}

export default function ReportsPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch reports data
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedPeriodId
        ? `/api/admin/reports?periodId=${selectedPeriodId}`
        : "/api/admin/reports";

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setRows(data.rows || []);
        setPeriods(data.periods || []);
      } else {
        toast.error(data.error || "Failed to fetch reports data");
      }
    } catch {
      toast.error("Network error occurred loading data");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId]);

  // Automatically load data initially and whenever the selected period changes
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // 3. Email Dispatcher handler execution action logic
  const handleSendEmailReport = async (userId: string) => {
    if (!selectedPeriodId) {
      toast.error("Please select a specific subscription period first!");
      return;
    }

    setSendingEmailId(userId);
    try {
      const res = await fetch("/api/admin/reports/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, periodId: selectedPeriodId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to dispatch email");
        return;
      }

      toast.success("Report successfully emailed to user!");
    } catch {
      toast.error("Network error occurred sending report");
    } finally {
      setSendingEmailId(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      {/* Page Header Layout */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Filter by open/closed periods and dispatch email updates directly to members.
          </p>
        </div>

        {/* Dropdown Selection Container */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 hidden sm:inline">Period:</label>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white shadow-xs min-w-50"
          >
            <option value="">All Active Periods</option>
            {periods?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No report data found for this context window.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-linear-to-r from-teal-500 to-cyan-500 text-white border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Member Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Mobile Number</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Total Paid</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Total Pending</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.userId} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 font-medium text-gray-800">{row.name}</td>
                    <td className="px-5 py-4 text-gray-600">{row.mobile || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-4 text-center font-semibold text-green-600">
                      Tk. {row.totalPaid?.toLocaleString("en-BD", { minimumFractionDigits: 2 }) || "0.00"}
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-amber-600">
                      Tk. {row.totalPending?.toLocaleString("en-BD", { minimumFractionDigits: 2 }) || "0.00"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleSendEmailReport(row.userId)}
                        disabled={sendingEmailId === row.userId || !selectedPeriodId}
                        title={!selectedPeriodId ? "Select a specific period from dropdown to email user" : "Email Statement Report"}
                        className="inline-flex items-center bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium text-xs px-3.5 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs gap-1.5"
                      >
                        {sendingEmailId === row.userId ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send Report
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

