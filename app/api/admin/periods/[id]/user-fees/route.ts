import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import PeriodUserFee from "@/models/PeriodUserFee";

// PUT — save fee for one user in a period
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { userId, fee } = await req.json();

    if (!userId || fee == null || fee < 0)
      return NextResponse.json({ error: "userId and fee are required" }, { status: 400 });

    await dbConnect();

    const record = await PeriodUserFee.findOneAndUpdate(
      { periodId: id, userId },
      { fee },
      { upsert: true, new: true }
    );

    return NextResponse.json({ record });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
