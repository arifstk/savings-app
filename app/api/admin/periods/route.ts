import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import SubscriptionEntry from "@/models/SubscriptionEntry";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const periods = await SubscriptionPeriod.find()
      .sort({ createdAt: -1 })
      .lean();

    // Attach summary counts to each period
    const enriched = await Promise.all(
      periods.map(async (p) => {
        const entries = await SubscriptionEntry.find({
          periodId: p._id,
        }).lean();
        const totalCollected = entries
          .filter((e) => e.status === "paid")
          .reduce((s, e) => s + e.fee, 0);
        const totalPending = entries
          .filter((e) => e.status === "pending")
          .reduce((s, e) => s + e.fee, 0);
        return {
          ...p,
          totalCollected,
          totalPending,
          userCount: entries.length,
        };
      }),
    );

    return NextResponse.json({ periods: enriched });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, startDate, endDate, defaultFee } = await req.json();

    if (!name || !startDate || !endDate || defaultFee == null)
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );

    if (defaultFee < 0)
      return NextResponse.json(
        { error: "Fee cannot be negative" },
        { status: 400 },
      );

    await dbConnect();

    const period = await SubscriptionPeriod.create({
      name,
      startDate,
      endDate,
      defaultFee,
      status: "open",
    });

    // Auto-create a pending entry for every user
    // Include users where isVerified is true OR field doesn't exist (old accounts)
    const users = await User.find({
      $or: [{ isVerified: true }, { isVerified: { $exists: false } }],
    })
      .select("_id")
      .lean();
    if (users.length > 0) {
      await SubscriptionEntry.insertMany(
        users.map((u) => ({
          periodId: period._id,
          userId: u._id,
          fee: defaultFee,
          status: "pending",
        })),
        { ordered: false },
      );
    }

    return NextResponse.json({ period }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
