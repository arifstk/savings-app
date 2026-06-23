"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface Entry {
  _id: string;
  fee: number;
  status: "paid" | "pending";
  paidAt?: string;
  note?: string;
  user: { name: string; email: string; mobile?: string };
}
interface Period {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  defaultFee: number;
  status: "open" | "closed";
}

function fmtTaka(n: number) {
  return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
}

export default function PeriodDetailPage() {
  const { periodId } = useParams<{ periodId: string }>();
  const router = useRouter();

  const [period, setPeriod] = useState<Period | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totals, setTotals] = useState({ collected: 0, pending: 0, grand: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<{ id: string; fee: string; note: string } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");

  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/periods/${periodId}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); router.back(); return; }
      setPeriod(data.period);
      setEntries(data.entries);
      setTotals({ collected: data.totalCollected, pending: data.totalPending, grand: data.grandTotal });
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, [periodId, router]);

  const syncUsers = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/admin/periods/${periodId}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.added > 0 ? `Added ${data.added} missing user(s)!` : "All users already synced.");
      loadData();
    } catch { toast.error("Sync failed"); }
    finally { setSyncing(false); }
  };

  useEffect(() => { loadData(); }, [loadData]);

  const toggleStatus = async (entry: Entry) => {
    const newStatus = entry.status === "paid" ? "pending" : "paid";
    setSaving(entry._id);
    try {
      const res = await fetch(`/api/admin/entries/${entry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(newStatus === "paid" ? "Marked as paid ✓" : "Marked as pending");
      loadData();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(null); }
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    setSaving(editEntry.id);
    try {
      const res = await fetch(`/api/admin/entries/${editEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee: Number(editEntry.fee), note: editEntry.note }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Updated!");
      setEditEntry(null);
      loadData();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(null); }
  };

  const filtered = entries
    .filter((e) => filter === "all" || e.status === filter)
    .filter((e) =>
      e.user.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.user.mobile ?? "").includes(search)
    );

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isOpen = period?.status === "open";

  return (
    <div>
      {/* Back + Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/admin/subscriptions"
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2">
            ← Back to Periods
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{period?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {period && new Date(period.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            {" → "}
            {period && new Date(period.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            {" · "}
            <span className={`font-medium ${isOpen ? "text-green-600" : "text-gray-500"}`}>
              {isOpen ? "Open" : "Closed"}
            </span>
          </p>
        </div>

        {/* Sync + Print buttons */}
        <div className="flex gap-2">
          <button
            onClick={syncUsers}
            disabled={syncing}
            title="Add missing users to this period"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "Syncing…" : "Sync Users"}
          </button>
          <Link href={`/admin/subscriptions/${periodId}/print`}
            target="_blank"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
          <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Collected</p>
          <p className="text-2xl font-bold text-green-700">{fmtTaka(totals.collected)}</p>
          <p className="text-xs text-green-600 mt-1">{entries.filter((e) => e.status === "paid").length} users paid</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{fmtTaka(totals.pending)}</p>
          <p className="text-xs text-amber-600 mt-1">{entries.filter((e) => e.status === "pending").length} users pending</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
          <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Grand Total</p>
          <p className="text-2xl font-bold text-blue-700">{fmtTaka(totals.grand)}</p>
          <p className="text-xs text-blue-600 mt-1">{entries.length} total users</p>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search by name or mobile…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["all", "paid", "pending"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition cursor-pointer capitalize ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Entries table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["#", "Name", "Mobile", "Fee", "Status", "Paid At", "Note", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No entries found</td></tr>
              ) : filtered.map((entry, idx) => (
                <tr key={entry._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-800 whitespace-nowrap">{entry.user.name}</td>
                  <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{entry.user.mobile || "—"}</td>

                  {/* Fee — editable */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {editEntry?.id === entry._id ? (
                      <input type="number" value={editEntry.fee}
                        onChange={(e) => setEditEntry({ ...editEntry, fee: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    ) : (
                      <span className="font-medium text-gray-700">{fmtTaka(entry.fee)}</span>
                    )}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${entry.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                      }`}>
                      {entry.status === "paid" ? "✓ Paid" : "⏳ Pending"}
                    </span>
                  </td>

                  {/* Paid at */}
                  <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                    {entry.paidAt
                      ? new Date(entry.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </td>

                  {/* Note — editable */}
                  <td className="px-4 py-3.5">
                    {editEntry?.id === entry._id ? (
                      <input type="text" value={editEntry.note}
                        onChange={(e) => setEditEntry({ ...editEntry, note: e.target.value })}
                        placeholder="Optional note"
                        className="border border-gray-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    ) : (
                      <span className="text-gray-400 text-xs">{entry.note || "—"}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    {editEntry?.id === entry._id ? (
                      <div className="flex gap-1.5">
                        <button onClick={saveEdit} disabled={saving === entry._id}
                          className="bg-green-600 hover:bg-green-500 text-white text-xs px-2.5 py-1 rounded cursor-pointer">
                          {saving === entry._id ? "…" : "Save"}
                        </button>
                        <button onClick={() => setEditEntry(null)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleStatus(entry)}
                          disabled={saving === entry._id}
                          className={`text-white text-xs px-2.5 py-1 rounded transition cursor-pointer ${entry.status === "pending"
                              ? "bg-green-600 hover:bg-green-500"
                              : "bg-amber-500 hover:bg-amber-400"
                            }`}>
                          {saving === entry._id ? "…" : entry.status === "pending" ? "Mark Paid" : "Mark Pending"}
                        </button>
                        <button
                          onClick={() => setEditEntry({ id: entry._id, fee: String(entry.fee), note: entry.note ?? "" })}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded cursor-pointer">
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totals footer */}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-700 text-right">Total =</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-700">
                    {fmtTaka(filtered.reduce((s, e) => s + e.fee, 0))}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

