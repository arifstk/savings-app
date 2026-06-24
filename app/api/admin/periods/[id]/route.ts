import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import MonthlyPayment from "@/models/MonthlyPayment";
import PeriodUserFee from "@/models/PeriodUserFee";
import User from "@/models/User";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const period = await SubscriptionPeriod.findById(id).lean();
    if (!period) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // All users
    const users = await User.find({
      $or: [{ isVerified: true }, { isVerified: { $exists: false } }],
    }).select("name email mobile").sort({ name: 1 }).lean();

    // User fees for this period
    const fees = await PeriodUserFee.find({ periodId: id }).lean();
    const feeMap: Record<string, number> = {};
    fees.forEach(f => { feeMap[f.userId.toString()] = f.fee; });

    // All payments for this period
    const payments = await MonthlyPayment.find({ periodId: id }).lean();

    // Group payments by month
    const monthsOpened = [...new Set(payments.map(p => p.month))].sort();

    // Build payment lookup: userId_month → payment
    const paymentMap: Record<string, typeof payments[0]> = {};
    payments.forEach(p => { paymentMap[`${p.userId}_${p.month}`] = p; });

    return NextResponse.json({ period, users, feeMap, monthsOpened, paymentMap });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const period = await SubscriptionPeriod.findById(id);
    if (!period) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (period.status === "closed")
      return NextResponse.json({ error: "Cannot delete a closed period" }, { status: 400 });

    await SubscriptionPeriod.findByIdAndDelete(id);
    await MonthlyPayment.deleteMany({ periodId: id });
    await PeriodUserFee.deleteMany({ periodId: id });

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
