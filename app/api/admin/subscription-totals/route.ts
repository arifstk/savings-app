import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get all users
    const users = await User.find()
      .select("name email mobile")
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate total subscription per user in one query
    const totals = await Subscription.aggregate([
      { $group: { _id: "$userId", total: { $sum: "$amount" } } },
    ]);

    // Build lookup map: userId → total
    const totalMap: Record<string, number> = {};
    totals.forEach((t) => { totalMap[t._id.toString()] = t.total; });

    // Merge into rows
    const rows = users.map((u, idx) => ({
      _id: u._id.toString(),
      serial: idx + 1,
      name: u.name,
      mobile: u.mobile ?? "",
      total: totalMap[u._id.toString()] ?? 0,
    }));

    const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

    return NextResponse.json({ rows, grandTotal });
  } catch (err) {
    console.error("Subscription totals error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
