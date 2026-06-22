// app/admin/subscriptions/page.tsx

"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface SubTotalRow {
  _id: string;
  serial: number;
  name: string;
  mobile: string;
  total: number;
}

function fmtTaka(n: number) {
  return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
}

export default function SubscriptionsPage() {
  const { status } = useSession();
  const [rows, setRows] = useState<SubTotalRow[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscription-totals");
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to load"); return; }
      setRows(data.rows);
      setGrandTotal(data.grandTotal);
    } catch {
      toast.error("Failed to load subscription totals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status, loadData]);

  const filtered = rows.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.mobile.includes(search)
  );

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 pt-4">
        <h1 className="text-xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Total subscription amount collected from all users
        </p>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Users with Subscriptions</p>
          <p className="text-2xl font-bold text-gray-900">{rows.filter((r) => r.total > 0).length}</p>
        </div>
        <div className="bg-sky-100 rounded-2xl border border-sky-200 shadow-sm px-5 py-4">
          <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Grand Total</p>
          <p className="text-2xl font-bold text-green-700">{fmtTaka(grandTotal)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["S.I.", "Name", "Mobile", "Total Subscription"].map((h) => (
                    <th key={h}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => (
                    <tr key={row._id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-5 py-4 font-medium text-gray-800">{row.name}</td>
                      <td className="px-5 py-4 text-gray-600">
                        {row.mobile || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        {row.total > 0 ? (
                          <span className="font-semibold text-green-700">{fmtTaka(row.total)}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">No subscription</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Grand Total row */}
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-sky-100 border-t- border-sky-200">
                    <td colSpan={3}
                      className="px-5 py-4 text-sm font-bold text-gray-700 text-right">
                      Total =
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-green-700">
                      {fmtTaka(filtered.reduce((sum, r) => sum + r.total, 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
