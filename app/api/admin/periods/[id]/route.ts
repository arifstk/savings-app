import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import SubscriptionEntry from "@/models/SubscriptionEntry";
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
    if (!period) return NextResponse.json({ error: "Period not found" }, { status: 404 });

    // Get all entries for this period, joined with user info
    const entries = await SubscriptionEntry.find({ periodId: id }).lean();
    const userIds = entries.map((e) => e.userId);
    const users   = await User.find({ _id: { $in: userIds } }).select("name email mobile").lean();
    const userMap: Record<string, { name: string; email: string; mobile?: string }> = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const enrichedEntries = entries.map((e) => ({
      ...e,
      user: userMap[e.userId.toString()] ?? { name: "Unknown", email: "" },
    }));

    const totalCollected = entries.filter((e) => e.status === "paid").reduce((s, e) => s + e.fee, 0);
    const totalPending   = entries.filter((e) => e.status === "pending").reduce((s, e) => s + e.fee, 0);
    const grandTotal     = totalCollected + totalPending;

    return NextResponse.json({ period, entries: enrichedEntries, totalCollected, totalPending, grandTotal });
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
    await SubscriptionEntry.deleteMany({ periodId: id });

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
