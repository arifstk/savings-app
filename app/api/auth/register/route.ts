// app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, mobile, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    await dbConnect();

    const existingByEmail = await User.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const existingByMobile = await User.findOne({ mobile });
    if (existingByMobile) {
      return NextResponse.json(
        { error: "An account with this mobile number already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if this is the very first user registering on the system
    const isFirstUser = (await User.countDocuments({})) === 0;

    const user = await User.create({
      name,
      email: normalizedEmail,
      mobile,
      password: hashedPassword,
      provider: "credentials",
      role: isFirstUser ? "admin" : "user", // First user is automatically admin
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}


