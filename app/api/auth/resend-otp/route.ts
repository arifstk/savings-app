import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateOtp, saveOtp, sendOtpEmail } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Generic response — don't reveal whether email exists
      return NextResponse.json({ message: "OTP sent if account exists" });
    }

    const otp = generateOtp();
    await saveOtp(user.email, otp);
    await sendOtpEmail(user.email, otp);

    return NextResponse.json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return NextResponse.json(
      { error: "Failed to resend OTP" },
      { status: 500 },
    );
  }
}


