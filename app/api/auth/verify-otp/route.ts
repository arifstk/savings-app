// app/api/auth/verify-otp/route.ts

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { email, otp, mode } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Dynamically import models to avoid SSR issues
    const Otp = (await import("@/models/Otp")).default;
    const User = (await import("@/models/User")).default;

    const otpRecord = await Otp.findOne({ email: email.toLowerCase().trim() });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "OTP expired. Please request a new one.", clearOtp: false },
        { status: 400 },
      );
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ email });
      return NextResponse.json(
        {
          error: "Too many wrong attempts. Please request a new OTP.",
          clearOtp: false,
        },
        { status: 400 },
      );
    }

    const bcrypt = (await import("bcryptjs")).default;
    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const left = 5 - otpRecord.attempts;
      return NextResponse.json(
        {
          error: `Incorrect OTP. ${left} attempt${left === 1 ? "" : "s"} left.`,
          clearOtp: true,
        },
        { status: 400 },
      );
    }

    // OTP is correct — delete it
    await Otp.deleteOne({ email });

    // On registration: mark user as verified
    if (mode === "register") {
      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { isVerified: true },
        { new: true },
      );

      // Auto-enrol new user into all already-opened months of every open period
      if (user) {
        const SubscriptionPeriod = (await import("@/models/SubscriptionPeriod"))
          .default;
        const MonthlyPayment = (await import("@/models/MonthlyPayment"))
          .default;
        const PeriodUserFee = (await import("@/models/PeriodUserFee")).default;

        // Get all open periods
        const openPeriods = await SubscriptionPeriod.find({
          status: "open",
        }).lean();

        for (const period of openPeriods) {
          const periodId = period._id.toString();

          // Find all months already opened for this period
          const openedMonthDocs = await MonthlyPayment.distinct("month", {
            periodId: period._id,
          });

          if (openedMonthDocs.length === 0) continue;

          // Get fee set for this user in this period (if any)
          const feeRecord = await PeriodUserFee.findOne({
            periodId: period._id,
            userId: user._id,
          }).lean();
          const fee = feeRecord?.fee ?? 0;

          // Create pending payment for each opened month
          // (skip months already having a record for this user)
          for (const month of openedMonthDocs) {
            const exists = await MonthlyPayment.findOne({
              periodId: period._id,
              userId: user._id,
              month,
            });
            if (!exists) {
              await MonthlyPayment.create({
                periodId: period._id,
                userId: user._id,
                month,
                fee,
                status: "pending",
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
