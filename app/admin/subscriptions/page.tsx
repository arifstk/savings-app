// app/admin/subscriptions/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Period {
  _id: string;
  name: string;
  startMonth: string;
  endMonth: string;
  status: "open" | "closed";
  closedAt?: string;
  collected: number;
  pending: number;
  openedMonths: string[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function displayMonth(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

function fmtTaka(n: number) {
  return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
}

export default function SubscriptionsPage() {
  const { status } = useSession();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", startMonth: "", endMonth: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/periods");
      const d = await res.json();
      if (res.ok) setPeriods(d.periods);
      else toast.error(d.error);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  const handleCreate = async () => {
    if (!form.name || !form.startMonth || !form.endMonth) {
      toast.error("All fields required"); return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error); return; }
      toast.success("Period created!");
      setShowForm(false);
      setForm({ name: "", startMonth: "", endMonth: "" });
      load();
    } catch { toast.error("Failed to create"); }
    finally { setCreating(false); }
  };

  const handleClose = async (id: string, name: string) => {
    if (!confirm(`Close period "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/periods/${id}/close`, { method: "POST" });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error); return; }
    toast.success("Period closed!");
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this period and all payment data?")) return;
    const res = await fetch(`/api/admin/periods/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error); return; }
    toast.success("Deleted!");
    load();
  };

  const open = periods.filter(p => p.status === "open");
  const closed = periods.filter(p => p.status === "closed");

  return (
    <div>
      <div className="flex items-center justify-between pt-6 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subscription Periods</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create periods and manage monthly payments</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl cursor-pointer transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Period
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-blue-800 mb-4">New Subscription Period</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Period Name</label>
              <input type="text" placeholder="e.g. 2026–2027 Session" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Month</label>
              <input type="month" value={form.startMonth}
                onChange={e => setForm({ ...form, startMonth: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Month</label>
              <input type="month" value={form.endMonth}
                onChange={e => setForm({ ...form, endMonth: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} disabled={creating}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg cursor-pointer transition">
              {creating ? "Creating…" : "Create Period"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-5 py-2 rounded-lg cursor-pointer">
              Cancel
            </button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            ℹ After creating, go into the period to set per-user fees, then open months as they arrive.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Open ({open.length})</p>
              <div className="space-y-3">
                {open.map(p => (
                  <PeriodCard key={p._id} p={p}
                    onClose={() => handleClose(p._id, p.name)}
                    onDelete={() => handleDelete(p._id)} />
                ))}
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Closed ({closed.length})</p>
              <div className="space-y-3">
                {closed.map(p => (
                  <PeriodCard key={p._id} p={p} onClose={() => { }} onDelete={() => { }} />
                ))}
              </div>
            </div>
          )}
          {periods.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <p className="text-gray-400 text-sm">No periods yet. Click "New Period" to start.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PeriodCard({ p, onClose, onDelete }: { p: Period; onClose: () => void; onDelete: () => void }) {
  const isOpen = p.status === "open";
  return (
    <div className={`bg-white rounded-2xl border shadow-sm ${isOpen ? "border-blue-200" : "border-gray-200"}`}>
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOpen ? "bg-green-400" : "bg-gray-400"}`} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-500">
              {displayMonth(p.startMonth)} → {displayMonth(p.endMonth)}
              {p.closedAt && ` · Closed ${new Date(p.closedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
            </p>
            {p.openedMonths.length > 0 && (
              <p className="text-xs text-blue-600 mt-0.5">
                Opened months: {p.openedMonths.map(displayMonth).join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-5 text-sm shrink-0">
          <div className="text-center">
            <p className="text-xs text-gray-400">Collected</p>
            <p className="font-semibold text-green-700">{(p.collected / 100 | 0) > 0 || p.collected > 0 ? `Tk. ${p.collected.toLocaleString("en-BD")}` : "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="font-semibold text-amber-600">{p.pending > 0 ? `Tk. ${p.pending.toLocaleString("en-BD")}` : "—"}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/admin/subscriptions/${p._id}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition">
            Manage
          </Link>
          {isOpen && (
            <>
              <button onClick={onClose}
                className="bg-amber-500 hover:bg-amber-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition">
                Close Period
              </button>
              <button onClick={onDelete}
                className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition">
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
