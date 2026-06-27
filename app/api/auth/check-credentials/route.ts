// app/api/auth/check-credentials/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateOtp, saveOtp, sendOtpEmail } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/mobile and password are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const normalized = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalized }, { mobile: identifier.trim() }],
    }).select("+password +emailVerified");

    if (!user) {
      return NextResponse.json(
        { error: "Incorrect email/mobile or password" },
        { status: 401 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "This account uses Google sign-in. Please continue with Google.",
        },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect email/mobile or password" },
        { status: 401 },
      );
    }

    // ✅ Email already verified — skip OTP, allow direct login
    if (user.emailVerified) {
      return NextResponse.json({
        email: user.email,
        skipOtp: true,
      });
    }

    // First-time login (email not verified yet) — send OTP
    const otp = generateOtp();
    await saveOtp(user.email, otp);
    await sendOtpEmail(user.email, otp);

    return NextResponse.json({
      email: user.email,
      skipOtp: false,
    });
  } catch (err) {
    console.error("Check credentials error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

