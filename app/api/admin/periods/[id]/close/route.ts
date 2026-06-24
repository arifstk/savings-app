import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";

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
    if (!period) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (period.status === "closed") return NextResponse.json({ error: "Already closed" }, { status: 400 });

    period.status = "closed";
    period.closedAt = new Date();
    await period.save();

    return NextResponse.json({ period });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
