import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import PeriodUserFee from "@/models/PeriodUserFee";
import MonthlyPayment from "@/models/MonthlyPayment";
import User from "@/models/User";

// POST — open a month (generate payment records for all users)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { month } = await req.json(); // "2026-07"

    if (!month) return NextResponse.json({ error: "Month is required" }, { status: 400 });

    await dbConnect();

    const period = await SubscriptionPeriod.findById(id);
    if (!period) return NextResponse.json({ error: "Period not found" }, { status: 404 });
    if (period.status === "closed")
      return NextResponse.json({ error: "Period is closed" }, { status: 400 });

    // Check month is within period range
    if (month < period.startMonth || month > period.endMonth)
      return NextResponse.json({ error: "Month is outside period range" }, { status: 400 });

    // Check not already opened
    const exists = await MonthlyPayment.findOne({ periodId: id, month });
    if (exists) return NextResponse.json({ error: "This month is already opened" }, { status: 400 });

    // Get all users
    const users = await User.find({
      $or: [{ isVerified: true }, { isVerified: { $exists: false } }],
    }).select("_id").lean();

    // Get per-user fees
    const fees = await PeriodUserFee.find({ periodId: id }).lean();
    const feeMap: Record<string, number> = {};
    fees.forEach(f => { feeMap[f.userId.toString()] = f.fee; });

    // Create one payment per user
    const docs = users.map(u => ({
      periodId: id,
      userId:   u._id,
      month,
      fee:    feeMap[u._id.toString()] ?? 0,
      status: "pending" as const,
    }));

    await MonthlyPayment.insertMany(docs, { ordered: false });

    return NextResponse.json({ message: `Month ${month} opened for ${docs.length} users`, count: docs.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
