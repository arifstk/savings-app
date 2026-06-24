import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import MonthlyPayment from "@/models/MonthlyPayment";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const periods = await SubscriptionPeriod.find().sort({ createdAt: -1 }).lean();

    // Attach quick stats per period
    const enriched = await Promise.all(periods.map(async (p) => {
      const payments = await MonthlyPayment.find({ periodId: p._id }).lean();
      const collected = payments.filter(x => x.status === "paid").reduce((s, x) => s + x.fee, 0);
      const pending   = payments.filter(x => x.status === "pending").reduce((s, x) => s + x.fee, 0);
      // Unique months opened so far
      const openedMonths = [...new Set(payments.map(x => x.month))].sort();
      return { ...p, collected, pending, openedMonths };
    }));

    return NextResponse.json({ periods: enriched });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, startMonth, endMonth } = await req.json();
    if (!name || !startMonth || !endMonth)
      return NextResponse.json({ error: "Name, start month and end month are required" }, { status: 400 });
    if (startMonth > endMonth)
      return NextResponse.json({ error: "Start month must be before end month" }, { status: 400 });

    await dbConnect();
    const period = await SubscriptionPeriod.create({ name, startMonth, endMonth, status: "open" });
    return NextResponse.json({ period }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
