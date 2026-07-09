// app/api/admin/periods/[id]/months/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import PeriodUserFee from "@/models/PeriodUserFee";
import MonthlyPayment from "@/models/MonthlyPayment";
import User from "@/models/User";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { month } = await req.json();

    if (!month)
      return NextResponse.json({ error: "Month is required" }, { status: 400 });

    await dbConnect();

    const period = await SubscriptionPeriod.findById(id);
    if (!period)
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    if (period.status === "closed")
      return NextResponse.json({ error: "Period is closed" }, { status: 400 });
    if (month < period.startMonth || month > period.endMonth)
      return NextResponse.json(
        { error: "Month is outside period range" },
        { status: 400 },
      );

    const exists = await MonthlyPayment.findOne({ periodId: id, month });
    if (exists)
      return NextResponse.json(
        { error: "This month is already opened" },
        { status: 400 },
      );

    // Get ALL verified, active users
    const users = await User.find({
      $or: [{ isVerified: true }, { isVerified: { $exists: false } }],
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    // Get per-user fees for this period
    const fees = await PeriodUserFee.find({ periodId: id }).lean();
    const feeMap: Record<string, number> = {};
    fees.forEach((f) => {
      feeMap[f.userId.toString()] = f.fee;
    });

    // Create one pending payment per user
    const docs = users.map((u) => ({
      periodId: id,
      userId: u._id,
      month,
      fee: feeMap[u._id.toString()] ?? 0,
      status: "pending" as const,
    }));

    if (docs.length > 0) {
      await MonthlyPayment.insertMany(docs, { ordered: false });
    }

    return NextResponse.json({
      message: `Month ${month} opened for ${docs.length} users`,
      count: docs.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
