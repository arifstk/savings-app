import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionEntry from "@/models/SubscriptionEntry";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { 
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status, fee, note } = await req.json();

    await dbConnect();

    const entry = await SubscriptionEntry.findById(id);
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    if (status !== undefined) {
      entry.status = status;
      entry.paidAt = status === "paid" ? new Date() : undefined;
    }
    if (fee !== undefined) entry.fee = fee;
    if (note !== undefined) entry.note = note;

    await entry.save();
    return NextResponse.json({ entry });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
