"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface User { _id: string; name: string; email: string; mobile?: string; }
interface Period { _id: string; name: string; startMonth: string; endMonth: string; status: string; }
interface Payment { _id: string; fee: number; status: "paid" | "pending"; paidAt?: string; note?: string; }

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function displayMonth(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}
function fmtTaka(n: number) {
  return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
}

// Generate list of YYYY-MM between start and end inclusive
function monthRange(start: string, end: string): string[] {
  const months = [];
  let [y, m] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++; if (m > 12) { m = 1; y++; }
  }
  return months;
}

export default function PeriodDetailPage() {
  const { periodId } = useParams<{ periodId: string }>();

  const [period, setPeriod] = useState<Period | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [feeMap, setFeeMap] = useState<Record<string, number>>({});
  const [openedMonths, setOpenedMonths] = useState<string[]>([]);
  const [paymentMap, setPaymentMap] = useState<Record<string, Payment>>({});
  const [loading, setLoading] = useState(true);
  const [savingFee, setSavingFee] = useState<string | null>(null);
  const [togglingPay, setTogglingPay] = useState<string | null>(null);
  const [openingMonth, setOpeningMonth] = useState(false);
  const [editFees, setEditFees] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"fees" | "payments">("fees");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/periods/${periodId}`);
      const d = await res.json();
      if (!res.ok) { toast.error(d.error); return; }
      setPeriod(d.period);
      setUsers(d.users);
      setFeeMap(d.feeMap);
      setOpenedMonths(d.monthsOpened);
      setPaymentMap(d.paymentMap);
      // Pre-fill edit fees
      const ef: Record<string, string> = {};
      d.users.forEach((u: User) => { ef[u._id] = d.feeMap[u._id] != null ? String(d.feeMap[u._id]) : ""; });
      setEditFees(ef);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, [periodId]);

  useEffect(() => { load(); }, [load]);

  // Save fee for one user
  const saveFee = async (userId: string) => {
    const fee = Number(editFees[userId]);
    if (isNaN(fee) || fee < 0) { toast.error("Enter a valid fee"); return; }
    setSavingFee(userId);
    try {
      const res = await fetch(`/api/admin/periods/${periodId}/user-fees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, fee }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error); return; }
      setFeeMap(prev => ({ ...prev, [userId]: fee }));
      toast.success("Fee saved!");
    } catch { toast.error("Failed to save fee"); }
    finally { setSavingFee(null); }
  };

  // Save all fees at once
  const saveAllFees = async () => {
    setSavingFee("all");
    let saved = 0;
    for (const u of users) {
      const fee = Number(editFees[u._id]);
      if (!isNaN(fee) && fee >= 0) {
        await fetch(`/api/admin/periods/${periodId}/user-fees`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: u._id, fee }),
        });
        saved++;
      }
    }
    toast.success(`Saved fees for ${saved} users!`);
    setSavingFee(null);
    load();
  };

  // Open a month
  const openMonth = async (month: string) => {
    if (!confirm(`Open ${displayMonth(month)} for all users?`)) return;
    setOpeningMonth(true);
    try {
      const res = await fetch(`/api/admin/periods/${periodId}/months`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error); return; }
      toast.success(d.message);
      setActiveTab("payments");
      load();
    } catch { toast.error("Failed to open month"); }
    finally { setOpeningMonth(false); }
  };

  // Toggle payment status
  const togglePayment = async (paymentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "paid" ? "pending" : "paid";
    setTogglingPay(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error); return; }
      toast.success(newStatus === "paid" ? "Marked paid ✓" : "Marked pending");
      load();
    } catch { toast.error("Failed to update"); }
    finally { setTogglingPay(null); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const allMonths = period ? monthRange(period.startMonth, period.endMonth) : [];
  const notOpened = allMonths.filter(m => !openedMonths.includes(m));
  const isOpen = period?.status === "open";

  // Totals for opened months
  const totalPaid = Object.values(paymentMap).filter(p => p.status === "paid").reduce((s, p) => s + p.fee, 0);
  const totalPending = Object.values(paymentMap).filter(p => p.status === "pending").reduce((s, p) => s + p.fee, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between pt-6 mb-6">
        <div>
          <Link href="/admin/subscriptions" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2">
            ← Back to Periods
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{period?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {period && displayMonth(period.startMonth)} → {period && displayMonth(period.endMonth)}
            <span className={`ml-2 font-medium ${isOpen ? "text-green-600" : "text-gray-500"}`}>
              · {isOpen ? "Open" : "Closed"}
            </span>
          </p>
        </div>
        <Link href={`/admin/subscriptions/${periodId}/print`} target="_blank"
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
          <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Collected</p>
          <p className="text-2xl font-bold text-green-700">{fmtTaka(totalPaid)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{fmtTaka(totalPending)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
          <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Months Opened</p>
          <p className="text-2xl font-bold text-blue-700">{openedMonths.length} <span className="text-sm font-normal text-blue-500">/ {allMonths.length}</span></p>
        </div>
      </div>

      {/* Open next month */}
      {isOpen && notOpened.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Open Next Month</p>
            <p className="text-xs text-gray-500 mt-0.5">Opens payment records for all users for that month</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {notOpened.slice(0, 3).map(m => (
              <button key={m} onClick={() => openMonth(m)} disabled={openingMonth}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-medium px-4 py-2 rounded-lg cursor-pointer transition">
                {openingMonth ? "Opening…" : `Open ${displayMonth(m)}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {(["fees", "payments"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition cursor-pointer capitalize ${activeTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
            {t === "fees" ? "User Fees" : "Monthly Payments"}
          </button>
        ))}
      </div>

      {/* Tab: User Fees */}
      {activeTab === "fees" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Set Monthly Fee Per User</p>
              <p className="text-xs text-gray-400 mt-0.5">This fee will be applied when you open each month</p>
            </div>
            <button onClick={saveAllFees} disabled={savingFee === "all"}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition">
              {savingFee === "all" ? "Saving…" : "Save All Fees"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500">#</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500">Name</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500">Mobile</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500">Monthly Fee (Taka)</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u, idx) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-1 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-1 py-3 font-medium text-gray-800">{u.name}</td>
                    <td className="px-1 py-3 text-gray-500">{u.mobile || "—"}</td>
                    <td className="px-1 py-3">
                      <input type="number" placeholder="0" value={editFees[u._id] ?? ""}
                        onChange={e => setEditFees(prev => ({ ...prev, [u._id]: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-1.5 py-3">
                      <button onClick={() => saveFee(u._id)} disabled={savingFee === u._id}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-1.5 py-1.5 rounded-lg cursor-pointer disabled:opacity-60">
                        {savingFee === u._id ? "…" : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Monthly Payments */}
      {activeTab === "payments" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {openedMonths.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-xs">
              No months opened yet. Use "Open Next Month" above to start collecting payments.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse w-full">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="px-1.5 py-3 text-left text-xs font-semibold whitespace-nowrap sticky left-0 bg-gray-900 z-10">#</th>
                    <th className="px-1.5 py-3 text-left text-xs font-semibold whitespace-nowrap sticky left-8 bg-gray-900 z-10 min-w-37">Name</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold whitespace-nowrap min-w-37">Mobile</th>
                    {openedMonths.map(m => (
                      <th key={m} className="px-1.5 py-3 text-center text-xs font-semibold whitespace-nowrap min-w-32">
                        {displayMonth(m)}
                      </th>
                    ))}
                    <th className="px-1.5 py-3 text-center text-xs font-semibold whitespace-nowrap min-w-30 bg-blue-800">Total Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u, idx) => {
                    const userPaid = openedMonths.reduce((s, m) => {
                      const p = paymentMap[`${u._id}_${m}`];
                      return s + (p?.status === "paid" ? p.fee : 0);
                    }, 0);
                    return (
                      <tr key={u._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-1.5 py-3 text-gray-400 text-xs sticky left-0 bg-inherit">{idx + 1}</td>
                        <td className="px-1.5 py-3 font-medium text-gray-800 whitespace-nowrap sticky left-8 bg-inherit">{u.name}</td>
                        <td className="px-1.5 py-3 text-gray-500 whitespace-nowrap">{u.mobile || "—"}</td>
                        {openedMonths.map(m => {
                          const pay = paymentMap[`${u._id}_${m}`];
                          if (!pay) return (
                            <td key={m} className="px-1.5 py-3 text-center text-gray-200 text-xs">—</td>
                          );
                          const isPaid = pay.status === "paid";
                          return (
                            <td key={m} className="px-1.5 py-3 text-center">
                              <button
                                onClick={() => togglePayment(pay._id, pay.status)}
                                disabled={togglingPay === pay._id}
                                className={`inline-block px-1.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${isPaid
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  }`}>
                                {togglingPay === pay._id ? "…" : isPaid
                                  ? `✓ ${fmtTaka(pay.fee)}`
                                  : `⏳ ${fmtTaka(pay.fee)}`}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-1.5 py-3 text-center bg-blue-50">
                          <span className="font-bold text-green-700 text-sm">
                            {userPaid > 0 ? fmtTaka(userPaid) : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer totals */}
                <tfoot>
                  <tr className="bg-gray-800 text-white">
                    <td colSpan={3} className="px-1.5 py-3.5 text-sm font-bold text-right">Monthly Total =</td>
                    {openedMonths.map(m => {
                      const paid = users.reduce((s, u) => {
                        const p = paymentMap[`${u._id}_${m}`];
                        return s + (p?.status === "paid" ? p.fee : 0);
                      }, 0);
                      return (
                        <td key={m} className="px-1.5 py-3.5 text-center whitespace-nowrap">
                          <div className="text-green-400 font-bold text-sm">
                            {paid > 0 ? fmtTaka(paid) : "—"}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-1.5 py-3.5 text-center bg-blue-900">
                      <div className="text-white font-bold text-sm">{fmtTaka(totalPaid)}</div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
