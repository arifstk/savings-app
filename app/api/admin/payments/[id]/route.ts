import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import MonthlyPayment from "@/models/MonthlyPayment";

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
    const payment = await MonthlyPayment.findById(id);
    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (status !== undefined) {
      payment.status = status;
      payment.paidAt = status === "paid" ? new Date() : undefined;
    }
    if (fee !== undefined) payment.fee = fee;
    if (note !== undefined) payment.note = note;

    await payment.save();
    return NextResponse.json({ payment });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
