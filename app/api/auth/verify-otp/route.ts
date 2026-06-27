// app/api/auth/verify-otp/route.ts

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";
import { verifyOtpHash } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const otpRecord = await Otp.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          error: "OTP expired or not found. Please try again.",
          clearOtp: false,
        },
        { status: 400 },
      );
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ email });
      return NextResponse.json(
        {
          error: "Too many wrong attempts. Please try again.",
          clearOtp: false,
        },
        { status: 400 },
      );
    }

    const isValid = await verifyOtpHash(otp, otpRecord.otp);

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

    // ✅ OTP valid — mark email as verified
    await User.updateOne(
      { email: email.toLowerCase().trim() },
      { $set: { emailVerified: true } },
    );

    // Delete used OTP
    await Otp.deleteOne({ email });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

