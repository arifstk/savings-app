"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface UserInfo { name: string; email: string; mobile: string; }
interface PaymentRow {
  serial: number; _id: string;
  month: string; fee: number;
  status: string; paidAt: string | null;
}
interface PeriodInfo { name: string; startMonth: string; endMonth: string; }
interface Settings { orgName: string; logoUrl: string; managerSignatureUrl: string; }

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

export default function UserPrintPage() {
  const { status } = useSession();
  const { periodId } = useParams<{ periodId: string }>();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [period, setPeriod] = useState<PeriodInfo | null>(null);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [settings, setSettings] = useState<Settings>({ orgName: "", logoUrl: "", managerSignatureUrl: "" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [subRes, userRes, settingsRes] = await Promise.all([
        fetch(`/api/user/subscriptions/${periodId}`),
        fetch("/api/user/subscriptions"),          // for user info only
        fetch("/api/admin/settings"),
      ]);
      const subData = await subRes.json();
      const userData = await userRes.json();
      const settingsData = await settingsRes.json();

      if (subRes.ok) {
        setPeriod(subData.period);
        setRows(subData.rows);
        setTotalPaid(subData.totalPaid);
        setTotalPending(subData.totalPending);
      }
      if (userRes.ok) setUser(userData.user);
      if (settingsRes.ok) setSettings(settingsData.settings);
    } finally { setLoading(false); }
  }, [periodId]);

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  useEffect(() => {
    if (!loading && user) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [loading, user]);

  const printDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  if (loading || status === "loading") return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 text-sm">Preparing statement…</p>
    </div>
  );

  const paidRows = rows.filter(r => r.status === "paid");

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; background: white; margin: 0; padding: 0; }
      `}</style>

      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 cursor-pointer">
          🖨 Print / Save PDF
        </button>
        <button onClick={() => window.close()}
          className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg shadow hover:bg-gray-200 cursor-pointer">
          ✕ Close
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-8 bg-white min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-5">
          <div className="flex items-center gap-4">
            {settings.logoUrl ? (
              <Image src={settings.logoUrl} alt="Logo" width={65} height={68}
                className="object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">Logo</div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">{settings.orgName || "Organization"}</h1>
              <p className="text-sm text-gray-500">Subscription Payment Statement</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-semibold text-gray-700">
              {period ? `${period.name}` : "Payment Statement"}
            </p>
            {period && (
              <p className="text-gray-400">
                {displayMonth(period.startMonth)} – {displayMonth(period.endMonth)}
              </p>
            )}
            <p>Printed: {printDate}</p>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="border border-gray-200 rounded-xl px-5 py-4 mb-6 grid grid-cols-3 gap-3 bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Name</p>
              <p className="text-sm font-bold text-gray-800">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
              <p className="text-sm text-gray-700">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Mobile</p>
              <p className="text-sm text-gray-700">{user.mobile || "—"}</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="border border-green-200 bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600 uppercase tracking-wide">Total Paid</p>
            <p className="text-base font-bold text-green-700 mt-0.5">{fmtTaka(totalPaid)}</p>
            <p className="text-xs text-green-600 mt-0.5">{paidRows.length} months</p>
          </div>
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600 uppercase tracking-wide">Pending</p>
            <p className="text-base font-bold text-amber-700 mt-0.5">{fmtTaka(totalPending)}</p>
          </div>
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600 uppercase tracking-wide">Grand Total</p>
            <p className="text-base font-bold text-blue-700 mt-0.5">{fmtTaka(totalPaid + totalPending)}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr style={{ background: "#1f2937", color: "white" }}>
              <th className="px-4 py-2.5 text-left text-xs font-semibold w-10">#</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold">Month</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold">Payment Date</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold">Amount</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#9ca3af", fontSize: 13 }}>
                  No subscription records found
                </td>
              </tr>
            ) : rows.map((row, idx) => (
              <tr key={row._id}
                style={{ background: idx % 2 === 0 ? "#ffffff" : "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <td className="px-4 py-2.5 text-gray-400 text-xs">{row.serial}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{displayMonth(row.month)}</td>
                <td className="px-4 py-2.5 text-gray-600 text-xs">
                  {row.status === "paid" ? fmtDate(row.paidAt) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                  {fmtTaka(row.fee)}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 999,
                    fontSize: 11, fontWeight: 600,
                    background: row.status === "paid" ? "#dcfce7" : "#fef3c7",
                    color: row.status === "paid" ? "#15803d" : "#b45309",
                  }}>
                    {row.status === "paid" ? "✓ Paid" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1f2937", color: "white" }}>
              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-right">Total Paid =</td>
              <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: "#4ade80" }}>
                {fmtTaka(totalPaid)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>

        {/* Signature */}
        <div className="flex justify-between items-end mt-12 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p className="font-medium">Date: {printDate}</p>
            {user && <p className="text-xs text-gray-400 mt-0.5">Member: {user.name}</p>}
          </div>
          <div className="text-center">
            {settings.managerSignatureUrl ? (
              <div className="mb-2">
                <Image src={settings.managerSignatureUrl} alt="Signature" width={130} height={52}
                  className="object-contain mx-auto" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-36 h-12 mb-2" />
            )}
            <div className="border-t border-gray-800 pt-1.5">
              <p className="text-sm font-semibold text-gray-800">Manager / Admin</p>
              <p className="text-xs text-gray-500">{settings.orgName || "Organization"}</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

