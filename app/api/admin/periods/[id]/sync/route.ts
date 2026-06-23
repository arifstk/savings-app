import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import SubscriptionEntry from "@/models/SubscriptionEntry";
import User from "@/models/User";

// POST /api/admin/periods/[id]/sync
// Adds missing entries for any users not yet in this period
export async function POST(
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
    if (!period) return NextResponse.json({ error: "Period not found" }, { status: 404 });

    // Get all users (including old accounts without isVerified)
    const allUsers = await User.find({
      $or: [{ isVerified: true }, { isVerified: { $exists: false } }],
    }).select("_id").lean();

    // Get users already having an entry for this period
    const existing = await SubscriptionEntry.find({ periodId: id }).select("userId").lean();
    const existingIds = new Set(existing.map((e) => e.userId.toString()));

    // Only insert for missing users
    const missing = allUsers.filter((u) => !existingIds.has(u._id.toString()));

    if (missing.length > 0) {
      await SubscriptionEntry.insertMany(
        missing.map((u) => ({
          periodId: period._id,
          userId: u._id,
          fee: period.defaultFee,
          status: "pending",
        })),
        { ordered: false }
      );
    }

    return NextResponse.json({
      message: `Synced ${missing.length} missing user(s)`,
      added: missing.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
