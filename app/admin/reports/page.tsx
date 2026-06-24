"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface Period { _id: string; name: string; startMonth: string; endMonth: string; status: string; }
interface UserRow {
  userId: string; name: string; mobile: string;
  months: Record<string, { _id: string; fee: number; status: string } | null>;
  totalPaid: number; totalPending: number;
}
interface MonthTotals { [m: string]: { paid: number; pending: number } }

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function displayMonth(ym: string) {
  const [y,m] = ym.split("-");
  return `${MONTH_NAMES[parseInt(m)-1]} ${y}`;
}
function fmtTaka(n: number) {
  return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
}

export default function ReportsPage() {
  const { status } = useSession();
  const [periods, setPeriods]         = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [rows, setRows]               = useState<UserRow[]>([]);
  const [allMonths, setAllMonths]     = useState<string[]>([]);
  const [monthTotals, setMonthTotals] = useState<MonthTotals>({});
  const [grandPaid, setGrandPaid]     = useState(0);
  const [grandPending, setGrandPending] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");

  const loadPeriods = useCallback(async () => {
    const res = await fetch("/api/admin/periods");
    const d   = await res.json();
    if (res.ok) setPeriods(d.periods);
  }, []);

  const loadReport = useCallback(async (periodId: string) => {
    setLoading(true);
    try {
      const url = periodId === "all"
        ? "/api/admin/reports"
        : `/api/admin/reports?periodId=${periodId}`;
      const res = await fetch(url);
      const d   = await res.json();
      if (!res.ok) { toast.error(d.error); return; }
      setRows(d.rows);
      setAllMonths(d.allMonths);
      setMonthTotals(d.monthTotals);
      setGrandPaid(d.grandPaid);
      setGrandPending(d.grandPending);
    } catch { toast.error("Failed to load report"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadPeriods();
      loadReport("all");
    }
  }, [status, loadPeriods, loadReport]);

  const handlePeriodChange = (pid: string) => {
    setSelectedPeriod(pid);
    loadReport(pid);
  };

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.mobile.includes(search)
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financial Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monthly payment breakdown per user</p>
        </div>
        <button onClick={() => loadReport(selectedPeriod)}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-pointer">
          ↻ Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Users</p>
          <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Months</p>
          <p className="text-2xl font-bold text-gray-900">{allMonths.length}</p>
        </div>
        <div className="bg-green-50 rounded-2xl border border-green-200 shadow-sm px-5 py-4">
          <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Total Collected</p>
          <p className="text-lg font-bold text-green-700">{fmtTaka(grandPaid)}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm px-5 py-4">
          <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Total Pending</p>
          <p className="text-lg font-bold text-amber-700">{fmtTaka(grandPending)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select value={selectedPeriod} onChange={e => handlePeriodChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">All Periods</option>
          {periods.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <input type="text" placeholder="Search by name or mobile…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:max-w-xs border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>

      {/* Pivot Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : allMonths.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            No payment data found. Open months inside a subscription period first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse w-full">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold sticky left-0 bg-gray-900 z-10 w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold sticky left-8 bg-gray-900 z-10 min-w-37">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold min-w-27">Mobile</th>
                  {allMonths.map(m => (
                    <th key={m} className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap min-w-30">
                      {displayMonth(m)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold min-w-30 bg-blue-800">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3 + allMonths.length + 1} className="text-center py-12 text-gray-400 text-sm">
                      No users found
                    </td>
                  </tr>
                ) : filtered.map((row, idx) => (
                  <tr key={row.userId} className={idx%2===0?"bg-white":"bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-400 text-xs sticky left-0 bg-inherit">{idx+1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap sticky left-8 bg-inherit">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.mobile||"—"}</td>
                    {allMonths.map(m => {
                      const entry = row.months[m];
                      if (!entry) return (
                        <td key={m} className="px-4 py-3 text-center text-gray-200 text-xs">—</td>
                      );
                      const isPaid = entry.status === "paid";
                      return (
                        <td key={m} className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {isPaid ? "✓" : "⏳"} Tk.{entry.fee.toLocaleString("en-BD")}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center bg-blue-50">
                      <div className="font-bold text-green-700 text-sm">
                        {row.totalPaid > 0 ? fmtTaka(row.totalPaid) : "—"}
                      </div>
                      {row.totalPending > 0 && (
                        <div className="text-xs text-amber-600 mt-0.5">
                          +{fmtTaka(row.totalPending)} due
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-800 text-white">
                    <td colSpan={3} className="px-4 py-3.5 text-sm font-bold text-right whitespace-nowrap">
                      Monthly Total =
                    </td>
                    {allMonths.map(m => {
                      const t = monthTotals[m] ?? { paid:0, pending:0 };
                      return (
                        <td key={m} className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="text-green-400 font-bold text-sm">
                            {t.paid > 0 ? fmtTaka(t.paid) : "—"}
                          </div>
                          {t.pending > 0 && (
                            <div className="text-amber-400 text-xs mt-0.5">
                              +{fmtTaka(t.pending)} due
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3.5 text-center bg-blue-900 whitespace-nowrap">
                      <div className="text-white font-bold">{fmtTaka(grandPaid)}</div>
                      {grandPending > 0 && (
                        <div className="text-amber-400 text-xs mt-0.5">+{fmtTaka(grandPending)} due</div>
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      {!loading && allMonths.length > 0 && (
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500"/> Paid
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-400"/> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-gray-300">—</span> Not in this period
          </span>
        </div>
      )}
    </div>
  );
}

