// app/api/admin/periods/[id]/user-fees/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import PeriodUserFee from "@/models/PeriodUserFee";
import MonthlyPayment from "@/models/MonthlyPayment";

// PUT — save fee for one user in a period
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: periodId } = await params;
    const { userId, fee } = await req.json();

    if (!userId || fee == null || fee < 0)
      return NextResponse.json(
        { error: "userId and fee are required" },
        { status: 400 },
      );

    await dbConnect();

    const record = await PeriodUserFee.findOneAndUpdate(
      { periodId: periodId, userId },
      { fee },
      { upsert: true, new: true },
    );

    const openedMonths = await MonthlyPayment.distinct("month", { periodId });

    if (openedMonths.length > 0) {
      for (const month of openedMonths) {
        // Check if this specific user already has a payment record for this month
        const existingPayment = await MonthlyPayment.findOne({
          periodId,
          userId,
          month,
        });

        if (!existingPayment) {
          // If no record exists (like for your new user), create a pending one with the new fee
          await MonthlyPayment.create({
            periodId,
            userId,
            month,
            fee,
            status: "pending",
          });
        } else if (existingPayment.status === "pending") {
          // If a pending record already exists, update its fee to match the new setting
          existingPayment.fee = fee;
          await existingPayment.save();
        }
      }
    }

    return NextResponse.json({ record });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
