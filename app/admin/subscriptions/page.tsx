// // app/admin/subscriptions/page.tsx

// "use client";
// import { useEffect, useState, useCallback } from "react";
// import { useSession } from "next-auth/react";
// import toast from "react-hot-toast";

// interface SubTotalRow {
//   _id: string;
//   serial: number;
//   name: string;
//   mobile: string;
//   total: number;
// }

// function fmtTaka(n: number) {
//   return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
// }

// export default function SubscriptionsPage() {
//   const { status } = useSession();
//   const [rows, setRows] = useState<SubTotalRow[]>([]);
//   const [grandTotal, setGrandTotal] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");

//   const loadData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/admin/subscription-totals");
//       const data = await res.json();
//       if (!res.ok) { toast.error(data.error || "Failed to load"); return; }
//       setRows(data.rows);
//       setGrandTotal(data.grandTotal);
//     } catch {
//       toast.error("Failed to load subscription totals");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (status === "authenticated") loadData();
//   }, [status, loadData]);

//   const filtered = rows.filter((r) =>
//     r.name.toLowerCase().includes(search.toLowerCase()) ||
//     r.mobile.includes(search)
//   );

//   return (
//     <div>
//       {/* Page header */}
//       <div className="mb-6 pt-4">
//         <h1 className="text-xl font-bold text-gray-900">Subscriptions</h1>
//         <p className="text-sm text-gray-500 mt-0.5">
//           Total subscription amount collected from all users
//         </p>
//       </div>

//       {/* Summary card */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
//         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
//           <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Users</p>
//           <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
//         </div>
//         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
//           <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Users with Subscriptions</p>
//           <p className="text-2xl font-bold text-gray-900">{rows.filter((r) => r.total > 0).length}</p>
//         </div>
//         <div className="bg-sky-100 rounded-2xl border border-sky-200 shadow-sm px-5 py-4">
//           <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Grand Total</p>
//           <p className="text-2xl font-bold text-green-700">{fmtTaka(grandTotal)}</p>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="mb-4">
//         <input
//           type="text"
//           placeholder="Search by name or mobile…"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="w-full max-w-sm border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
//         {loading ? (
//           <div className="flex items-center justify-center py-20">
//             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-50 border-b border-gray-200">
//                 <tr>
//                   {["S.I.", "Name", "Mobile", "Total Subscription"].map((h) => (
//                     <th key={h}
//                       className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {filtered.length === 0 ? (
//                   <tr>
//                     <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">
//                       No users found
//                     </td>
//                   </tr>
//                 ) : (
//                   filtered.map((row, idx) => (
//                     <tr key={row._id} className="hover:bg-gray-50 transition">
//                       <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
//                       <td className="px-5 py-4 font-medium text-gray-800">{row.name}</td>
//                       <td className="px-5 py-4 text-gray-600">
//                         {row.mobile || <span className="text-gray-300">—</span>}
//                       </td>
//                       <td className="px-5 py-4">
//                         {row.total > 0 ? (
//                           <span className="font-semibold text-green-700">{fmtTaka(row.total)}</span>
//                         ) : (
//                           <span className="text-gray-300 text-xs">No subscription</span>
//                         )}
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>

//               {/* Grand Total row */}
//               {filtered.length > 0 && (
//                 <tfoot>
//                   <tr className="bg-sky-100 border-t- border-sky-200">
//                     <td colSpan={3}
//                       className="px-5 py-4 text-sm font-bold text-gray-700 text-right">
//                       Total =
//                     </td>
//                     <td className="px-5 py-4 text-sm font-bold text-green-700">
//                       {fmtTaka(filtered.reduce((sum, r) => sum + r.total, 0))}
//                     </td>
//                   </tr>
//                 </tfoot>
//               )}
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


















"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Period {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  defaultFee: number;
  status: "open" | "closed";
  closedAt?: string;
  totalCollected: number;
  totalPending: number;
  userCount: number;
}

function fmtTaka(n: number) {
  return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SubscriptionsPage() {
  const { status } = useSession();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    defaultFee: "",
  });

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/periods");
      const data = await res.json();
      if (res.ok) setPeriods(data.periods);
      else toast.error(data.error);
    } catch { toast.error("Failed to load periods"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (status === "authenticated") loadPeriods(); }, [status, loadPeriods]);

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate || !form.defaultFee) {
      toast.error("All fields are required"); return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, defaultFee: Number(form.defaultFee) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Period created & entries added for all users!");
      setShowForm(false);
      setForm({ name: "", startDate: "", endDate: "", defaultFee: "" });
      loadPeriods();
    } catch { toast.error("Failed to create period"); }
    finally { setCreating(false); }
  };

  const handleClose = async (id: string, name: string) => {
    if (!confirm(`Close period "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/periods/${id}/close`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Period closed!");
      loadPeriods();
    } catch { toast.error("Failed to close period"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this period and all its entries?")) return;
    try {
      const res = await fetch(`/api/admin/periods/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Cannot delete a closed period"); return; }
      toast.success("Deleted!");
      loadPeriods();
    } catch { toast.error("Failed to delete"); }
  };

  const openPeriods = periods.filter((p) => p.status === "open");
  const closedPeriods = periods.filter((p) => p.status === "closed");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subscription Periods</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage subscription periods</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Period
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-blue-800 mb-4">Create New Subscription Period</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Period Name</label>
              <input type="text" placeholder="e.g. July 2026" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <input type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Default Fee (Taka)</label>
              <input type="number" placeholder="1500" value={form.defaultFee}
                onChange={(e) => setForm({ ...form, defaultFee: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} disabled={creating}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition cursor-pointer">
              {creating ? "Creating…" : "Create Period"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition cursor-pointer">
              Cancel
            </button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            ℹ️ Creating a period will automatically add a pending entry for every verified user.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Open periods */}
          {openPeriods.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Open Periods ({openPeriods.length})
              </p>
              <div className="space-y-3">
                {openPeriods.map((p) => (
                  <PeriodCard key={p._id} period={p}
                    onClose={() => handleClose(p._id, p.name)}
                    onDelete={() => handleDelete(p._id)} />
                ))}
              </div>
            </div>
          )}

          {/* Closed periods */}
          {closedPeriods.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Closed Periods ({closedPeriods.length})
              </p>
              <div className="space-y-3">
                {closedPeriods.map((p) => (
                  <PeriodCard key={p._id} period={p}
                    onClose={() => { }}
                    onDelete={() => { }} />
                ))}
              </div>
            </div>
          )}

          {periods.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <p className="text-gray-400 text-sm">No subscription periods yet.</p>
              <p className="text-gray-400 text-xs mt-1">Click "New Period" to get started.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PeriodCard({ period, onClose, onDelete }: {
  period: Period;
  onClose: () => void;
  onDelete: () => void;
}) {
  const isOpen = period.status === "open";
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isOpen ? "border-blue-200" : "border-gray-200"}`}>
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Status badge + name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${isOpen ? "bg-green-400" : "bg-gray-400"}`} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{period.name}</p>
            <p className="text-xs text-gray-500">
              {fmtDate(period.startDate)} → {fmtDate(period.endDate)}
              {period.closedAt && ` · Closed ${fmtDate(period.closedAt)}`}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-5 text-sm shrink-0">
          <div className="text-center">
            <p className="text-xs text-gray-400">Default Fee</p>
            <p className="font-medium text-gray-700">{fmtTaka(period.defaultFee)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Collected</p>
            <p className="font-semibold text-green-700">{fmtTaka(period.totalCollected)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="font-semibold text-amber-600">{fmtTaka(period.totalPending)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Users</p>
            <p className="font-medium text-gray-700">{period.userCount}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <Link href={`/admin/subscriptions/${period._id}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition">
            View Details
          </Link>
          {isOpen && ( 
            <>
              <button onClick={onClose}
                className="bg-amber-500 hover:bg-amber-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer">
                Close Period
              </button>
              <button onClick={onDelete}
                className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer">
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


