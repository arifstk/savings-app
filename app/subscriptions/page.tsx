"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface UserInfo { name: string; email: string; mobile: string; }
interface PeriodSummary {
  _id: string; name: string;
  startMonth: string; endMonth: string;
  totalMonths: number; paidMonths: number; pendingMonths: number;
  totalPaid: number; totalPending: number;
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

export default function SubscriptionsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [periods, setPeriods] = useState<PeriodSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/subscriptions");
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setUser(data.user);
      setPeriods(data.periods);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  if (status === "loading" || loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">Select a period to view your payment history</p>
        </div>

        {/* User info card */}
        {user && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-3 py-2 md:px-6 md:py-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 flex-1">
                <div className='flex flex-start items-center gap-3'>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Name:</p>
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                </div>
                <div className='flex flex-start items-center gap-3'>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Email:</p>
                  <p className="text-sm text-gray-700">{user.email}</p>
                </div>
                <div className='flex flex-start items-center gap-3'>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Mobile:</p>
                  <p className="text-sm text-gray-700">{user.mobile || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Period cards */}
        {periods.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">No subscription periods found</p>
            <p className="text-gray-400 text-xs mt-1">Your periods will appear here once opened</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {periods.map((period) => {
              const allPaid = period.pendingMonths === 0;
              return (
                <Link
                  key={period._id}
                  href={`/subscriptions/${period._id}`}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm px-2 py-3 md:px-6 md:py-5 flex items-center justify-between gap-4 hover:border-teal-400 hover:shadow-md transition group"
                >
                  {/* Left: period info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${allPaid ? "bg-green-100" : "bg-amber-100"}`}>
                      <svg className={`w-5 h-5 ${allPaid ? "text-green-600" : "text-amber-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-teal-600 transition truncate">{period.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {displayMonth(period.startMonth)} – {displayMonth(period.endMonth)}
                      </p>
                    </div>
                  </div>

                  {/* Middle: month badges */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2.5 py-1 rounded-full">
                      ✓ {period.paidMonths} paid
                    </span>
                    {period.pendingMonths > 0 && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2.5 py-1 rounded-full">
                        ⏳ {period.pendingMonths} pending
                      </span>
                    )}
                  </div>

                  {/* Right: amount + chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{fmtTaka(period.totalPaid)}</p>
                      {period.totalPending > 0 && (
                        <p className="text-xs text-amber-600 mt-0.5">{fmtTaka(period.totalPending)} due</p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

