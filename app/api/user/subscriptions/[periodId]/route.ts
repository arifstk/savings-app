// app/api/user/subscriptions/[periodId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import MonthlyPayment from "@/models/MonthlyPayment";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ periodId: string }> },
) {
  try {
    const {periodId} = await params;
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const period = await SubscriptionPeriod.findById(periodId)
      .select("name startMonth endMonth")
      .lean();
    if (!period)
      return NextResponse.json({ error: "Period not found" }, { status: 404 });

    const payments = await MonthlyPayment.find({
      userId: session.user.id,
      periodId: periodId,
    })
      .sort({ month: 1 })
      .lean();

    const rows = payments.map((p, idx) => ({
      serial: idx + 1,
      _id: p._id.toString(),
      month: p.month,
      fee: p.fee,
      status: p.status,
      paidAt: p.paidAt ?? null,
    }));

    const totalPaid = payments
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + p.fee, 0);
    const totalPending = payments
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + p.fee, 0);

    return NextResponse.json({
      period: {
        name: period.name,
        startMonth: period.startMonth,
        endMonth: period.endMonth,
      },
      rows,
      totalPaid,
      totalPending,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
