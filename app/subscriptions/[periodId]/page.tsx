"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface PeriodInfo { name: string; startMonth: string; endMonth: string; }
interface PaymentRow {
  serial: number; _id: string;
  month: string; fee: number;
  status: string; paidAt: string | null;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function displayMonth(ym: string) {
  if (!ym) return "—";
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}
function fmtTaka(n: number) {
  return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PeriodDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const { periodId } = useParams<{ periodId: string }>();

  const [period, setPeriod] = useState<PeriodInfo | null>(null);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/subscriptions/${periodId}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setPeriod(data.period);
      setRows(data.rows);
      setTotalPaid(data.totalPaid);
      setTotalPending(data.totalPending);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, [periodId]);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  if (status === "loading" || loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const paidRows = rows.filter(r => r.status === "paid");
  const pendingRows = rows.filter(r => r.status === "pending");

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/subscriptions"
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{period?.name ?? "Period"}</h1>
              {period && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {displayMonth(period.startMonth)} – {displayMonth(period.endMonth)}
                </p>
              )}
            </div>
          </div>
          <Link
            href={`/subscriptions/${periodId}/print`}
            target="_blank"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-center">
            <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Total Paid</p>
            <p className="text-xl font-bold text-green-700">{fmtTaka(totalPaid)}</p>
            <p className="text-xs text-green-600 mt-1">{paidRows.length} month{paidRows.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-center">
            <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Pending</p>
            <p className="text-xl font-bold text-amber-700">{fmtTaka(totalPending)}</p>
            <p className="text-xs text-amber-600 mt-1">{pendingRows.length} month{pendingRows.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 text-center">
            <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Total Due</p>
            <p className="text-xl font-bold text-blue-700">{fmtTaka(totalPaid + totalPending)}</p>
            <p className="text-xs text-blue-600 mt-1">{rows.length} month{rows.length !== 1 ? "s" : ""} total</p>
          </div>
        </div>

        {/* Payment table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {rows.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm font-medium">No payments for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide w-12">S.I.</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Month</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Payment Date</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, idx) => (
                    <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-5 py-4 text-gray-400 text-xs">{row.serial}</td>
                      <td className="px-5 py-4 font-medium text-gray-800">{displayMonth(row.month)}</td>
                      <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                        {row.status === "paid" ? fmtDate(row.paidAt) : "—"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-800 whitespace-nowrap">
                        {fmtTaka(row.fee)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${row.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                          }`}>
                          {row.status === "paid" ? "✓ Paid" : "⏳ Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-800 text-white">
                    <td colSpan={3} className="px-5 py-4 text-sm font-bold text-right">Total Paid =</td>
                    <td className="px-5 py-4 text-sm font-bold text-green-400 whitespace-nowrap">
                      {fmtTaka(totalPaid)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

