// app/api/user/subscriptions/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import MonthlyPayment from "@/models/MonthlyPayment";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const user = await User.findById(session.user.id)
      .select("name email mobile")
      .lean();
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const payments = await MonthlyPayment.find({
      userId: session.user.id,
    }).lean();

    const periodIds = [...new Set(payments.map((p) => p.periodId.toString()))];
    const periods = await SubscriptionPeriod.find({ _id: { $in: periodIds } })
      .select("name startMonth endMonth")
      .sort({ startMonth: -1 })
      .lean();

    // Build per-period summaries
    const summaries = periods.map((period) => {
      const pRows = payments.filter(
        (p) => p.periodId.toString() === period._id.toString(),
      );
      const paid = pRows.filter((p) => p.status === "paid");
      const pending = pRows.filter((p) => p.status === "pending");
      return {
        _id: period._id.toString(),
        name: period.name,
        startMonth: period.startMonth,
        endMonth: period.endMonth,
        totalMonths: pRows.length,
        paidMonths: paid.length,
        pendingMonths: pending.length,
        totalPaid: paid.reduce((s, p) => s + p.fee, 0),
        totalPending: pending.reduce((s, p) => s + p.fee, 0),
      };
    });

    return NextResponse.json({
      user: { name: user.name, email: user.email, mobile: user.mobile ?? "" },
      periods: summaries,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

