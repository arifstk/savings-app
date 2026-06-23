"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

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
interface Settings {
  orgName: string;
  logoUrl: string;
  managerSignatureUrl: string;
}

function fmtTaka(n: number) {
  return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default function PrintPage() {
  const { periodId } = useParams<{ periodId: string }>();

  const [period, setPeriod]     = useState<Period | null>(null);
  const [entries, setEntries]   = useState<Entry[]>([]);
  const [totals, setTotals]     = useState({ collected: 0, pending: 0, grand: 0 });
  const [settings, setSettings] = useState<Settings>({ orgName: "", logoUrl: "", managerSignatureUrl: "" });
  const [loading, setLoading]   = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/admin/periods/${periodId}`),
        fetch("/api/admin/settings"),
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();

      if (pRes.ok) {
        setPeriod(pData.period);
        setEntries(pData.entries);
        setTotals({ collected: pData.totalCollected, pending: pData.totalPending, grand: pData.grandTotal });
      }
      if (sRes.ok) setSettings(sData.settings);
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-print once loaded
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

  const printDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; background: white; }
      `}</style>

      {/* Print button — hidden on actual print */}
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

      {/* Print content */}
      <div className="max-w-3xl mx-auto px-8 py-8 bg-white min-h-screen">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pb-5 border-b-2 border-gray-800 mb-6">
          {/* Logo */}
          <div className="flex items-center gap-4">
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt="Logo"
                width={64}
                height={64}
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center">
                Logo
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {settings.orgName || "Organization Name"}
              </h1>
              <p className="text-sm text-gray-500">Subscription Collection Report</p>
            </div>
          </div>

          {/* Report meta */}
          <div className="text-right text-xs text-gray-500 space-y-0.5">
            <p className="font-semibold text-gray-700 text-sm">{period?.name}</p>
            <p>{fmtDate(period!.startDate)} — {fmtDate(period!.endDate)}</p>
            <p>Printed: {printDate}</p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
              period?.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}>
              {period?.status === "open" ? "Open" : "Closed"}
            </span>
          </div>
        </div>

        {/* ── Summary boxes ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border border-green-200 bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600 uppercase tracking-wide">Collected</p>
            <p className="text-lg font-bold text-green-700 mt-0.5">{fmtTaka(totals.collected)}</p>
          </div>
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600 uppercase tracking-wide">Pending</p>
            <p className="text-lg font-bold text-amber-700 mt-0.5">{fmtTaka(totals.pending)}</p>
          </div>
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600 uppercase tracking-wide">Grand Total</p>
            <p className="text-lg font-bold text-blue-700 mt-0.5">{fmtTaka(totals.grand)}</p>
          </div>
        </div>

        {/* ── Table ── */}
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-3 py-2.5 text-left text-xs font-semibold w-8">#</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Name</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Mobile</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold">Fee</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold">Status</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Paid Date</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={entry._id}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-800">{entry.user.name}</td>
                <td className="px-3 py-2 text-gray-600">{entry.user.mobile || "—"}</td>
                <td className="px-3 py-2 text-right font-medium text-gray-700">{fmtTaka(entry.fee)}</td>
                <td className="px-3 py-2 text-center">
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: entry.status === "paid" ? "#dcfce7" : "#fef3c7",
                    color: entry.status === "paid" ? "#15803d" : "#b45309",
                  }}>
                    {entry.status === "paid" ? "✓ Paid" : "Pending"}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-500 text-xs">
                  {entry.paidAt ? new Date(entry.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </td>
                <td className="px-3 py-2 text-gray-400 text-xs">{entry.note || "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1f2937", color: "white" }}>
              <td colSpan={3} className="px-3 py-3 text-sm font-bold text-right">Total =</td>
              <td className="px-3 py-3 text-sm font-bold text-right">{fmtTaka(totals.grand)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>

        {/* ── Signature section ── */}
        <div className="flex justify-between items-end mt-16 pt-6 border-t border-gray-200">
          {/* Left — date */}
          <div className="text-sm text-gray-600">
            <p className="font-medium">Date: {printDate}</p>
          </div>

          {/* Right — Manager/Admin signature */}
          <div className="text-center">
            {settings.managerSignatureUrl ? (
              <div className="mb-2">
                <Image
                  src={settings.managerSignatureUrl}
                  alt="Manager Signature"
                  width={140}
                  height={56}
                  className="object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
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
