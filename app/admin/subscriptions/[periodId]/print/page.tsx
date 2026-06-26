"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface User { _id: string; name: string; mobile?: string; }
interface Period { _id: string; name: string; startMonth: string; endMonth: string; status: string; }
interface Payment { _id: string; fee: number; status: string; paidAt?: string; }
interface Settings { orgName: string; logoUrl: string; managerSignatureUrl: string; }

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function displayMonth(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}
function fmtTaka(n: number) {
  return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
}

export default function PrintPage() {
  const { periodId } = useParams<{ periodId: string }>();
  const [period, setPeriod] = useState<Period | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [openedMonths, setOpenedMonths] = useState<string[]>([]);
  const [paymentMap, setPaymentMap] = useState<Record<string, Payment>>({});
  const [settings, setSettings] = useState<Settings>({ orgName: "", logoUrl: "", managerSignatureUrl: "" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/admin/periods/${periodId}`),
        fetch("/api/admin/settings"),
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();
      if (pRes.ok) {
        setPeriod(pData.period);
        setUsers(pData.users);
        setOpenedMonths(pData.monthsOpened);
        setPaymentMap(pData.paymentMap);
      }
      if (sRes.ok) setSettings(sData.settings);
    } finally { setLoading(false); }
  }, [periodId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!loading && period) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [loading, period]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 text-sm">Preparing print…</p>
    </div>
  );

  const totalPaid = Object.values(paymentMap).filter(p => p.status === "paid").reduce((s, p) => s + p.fee, 0);
  const totalPending = Object.values(paymentMap).filter(p => p.status === "pending").reduce((s, p) => s + p.fee, 0);
  const printDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm 7mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; background: white; }
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

      <div className="w-max min-w-full mx-auto px-8 py-8 bg-white min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b-2 border-gray-800 mb-5">
          <div className="flex items-center gap-4">
            {settings.logoUrl ? (
              <Image src={settings.logoUrl} alt="Logo" width={64} height={64}
                className="object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">Logo</div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{settings.orgName || "Organization Name"}</h1>
              <p className="text-sm text-gray-500">Monthly Subscription Report</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 space-y-0.5">
            <p className="font-semibold text-gray-700 text-sm">{period?.name}</p>
            <p>{period && displayMonth(period.startMonth)} — {period && displayMonth(period.endMonth)}</p>
            <p>Printed: {printDate}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 justify-between gap-4 mb-5">
          <div className="border border-green-200 bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600 uppercase">Collected</p>
            <p className="text-lg font-bold text-green-700">{fmtTaka(totalPaid)}</p>
          </div>
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600 uppercase">Pending</p>
            <p className="text-lg font-bold text-amber-700">{fmtTaka(totalPending)}</p>
          </div>
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600 uppercase">Grand Total</p>
            <p className="text-lg font-bold text-blue-700">{fmtTaka(totalPaid + totalPending)}</p>
          </div>
        </div>

        {/* Pivot Table */}
        <table className="w-full text-xs border-collapse mb-8">
          <thead>
            <tr style={{ background: "#1f2937", color: "white" }}>
              <th className="px-3 py-2.5 text-left font-semibold w-6">#</th>
              <th className="px-3 py-2.5 text-left font-semibold min-w-32">Name</th>
              <th className="px-3 py-2.5 text-left font-semibold min-w-25">Mobile</th>
              {openedMonths.map(m => (
                <th key={m} className="px-3 py-2.5 text-center font-semibold whitespace-nowrap min-w-22">
                  {displayMonth(m)}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center font-semibold min-w-25" style={{ background: "#1e3a5f" }}>
                Total Paid
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => {
              const userPaid = openedMonths.reduce((s, m) => {
                const p = paymentMap[`${u._id}_${m}`];
                return s + (p?.status === "paid" ? p.fee : 0);
              }, 0);
              return (
                <tr key={u._id} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{u.name}</td>
                  <td className="px-3 py-2 text-gray-600">{u.mobile || "—"}</td>
                  {openedMonths.map(m => {
                    const pay = paymentMap[`${u._id}_${m}`];
                    if (!pay) return <td key={m} className="px-3 py-2 text-center text-gray-300">—</td>;
                    return (
                      <td key={m} className="px-3 py-2 text-center">
                        <span style={{
                          display: "inline-block", padding: "2px 6px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                          background: pay.status === "paid" ? "#dcfce7" : "#fef3c7",
                          color: pay.status === "paid" ? "#15803d" : "#b45309",
                        }}>
                          {pay.status === "paid" ? `✓ Tk.${pay.fee.toLocaleString("en-BD")}` : `⏳ Tk.${pay.fee.toLocaleString("en-BD")}`}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-bold" style={{ background: "#eff6ff", color: userPaid > 0 ? "#15803d" : "#9ca3af" }}>
                    {userPaid > 0 ? fmtTaka(userPaid) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1f2937", color: "white" }}>
              <td colSpan={3} className="px-3 py-3 text-sm font-bold text-right">Monthly Total =</td>
              {openedMonths.map(m => {
                const paid = users.reduce((s, u) => {
                  const p = paymentMap[`${u._id}_${m}`];
                  return s + (p?.status === "paid" ? p.fee : 0);
                }, 0);
                return (
                  <td key={m} className="px-3 py-3 text-center font-bold text-green-400">
                    {paid > 0 ? fmtTaka(paid) : "—"}
                  </td>
                );
              })}
              <td className="px-3 py-3 text-center font-bold text-white" style={{ background: "#1e3a5f" }}>
                {fmtTaka(totalPaid)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Signature */}
        <div className="flex justify-between items-end mt-12 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p className="font-medium">Date: {printDate}</p>
          </div>
          <div className="text-center">
            {settings.managerSignatureUrl ? (
              <div className="mb-2">
                <Image src={settings.managerSignatureUrl} alt="Signature" width={140} height={56}
                  className="object-contain mx-auto" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-40 h-12 mb-2" />
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

