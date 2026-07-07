// app/api/admin/reports/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import MonthlyPayment from "@/models/MonthlyPayment";
import User from "@/models/User";
import PeriodUserFee from "@/models/PeriodUserFee";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const periodId = searchParams.get("periodId"); // optional filter

    await dbConnect();

    const periodQuery = periodId ? { _id: periodId } : {};
    const periods = await SubscriptionPeriod.find(periodQuery).sort({ startMonth: 1 }).lean();

    const users = await User.find({
      $or: [{ isVerified: true }, { isVerified: { $exists: false } }],
    }).select("name mobile").sort({ name: 1 }).lean();

    const paymentQuery = periodId ? { periodId } : {};
    const payments = await MonthlyPayment.find(paymentQuery).lean();

    // Get all opened months across all selected periods
    const allMonths = [...new Set(payments.map(p => p.month))].sort();

    // Build payment lookup: userId_month → payment
    const payMap: Record<string, typeof payments[0]> = {};
    payments.forEach(p => { payMap[`${p.userId}_${p.month}`] = p; });

    // Get user fees per period
    const fees = await PeriodUserFee.find(
      periodId ? { periodId } : {}
    ).lean();
    const feeMap: Record<string, number> = {};
    fees.forEach(f => { feeMap[`${f.userId}_${f.periodId}`] = f.fee; });

    // Build rows: one per user
    const rows = users.map(u => {
      const uid = u._id.toString();
      const months: Record<string, { _id: string; fee: number; status: string; paidAt?: Date } | null> = {};
      let totalPaid = 0;
      let totalPending = 0;

      allMonths.forEach(m => {
        const p = payMap[`${uid}_${m}`];
        months[m] = p
          ? { _id: p._id.toString(), fee: p.fee, status: p.status, paidAt: p.paidAt }
          : null;
        if (p?.status === "paid") totalPaid += p.fee;
        if (p?.status === "pending") totalPending += p.fee;
      });

      return { userId: uid, name: u.name, mobile: u.mobile ?? "", months, totalPaid, totalPending };
    });

    // Column totals per month
    const monthTotals: Record<string, { paid: number; pending: number }> = {};
    allMonths.forEach(m => {
      let paid = 0; let pending = 0;
      users.forEach(u => {
        const p = payMap[`${u._id}_${m}`];
        if (p?.status === "paid") paid += p.fee;
        if (p?.status === "pending") pending += p.fee;
      });
      monthTotals[m] = { paid, pending };
    });

    const grandPaid    = rows.reduce((s, r) => s + r.totalPaid, 0);
    const grandPending = rows.reduce((s, r) => s + r.totalPending, 0);

    return NextResponse.json({ periods, rows, allMonths, monthTotals, grandPaid, grandPending });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
