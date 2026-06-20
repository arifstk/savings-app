import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email"),
  mobile: z
    .string()
    .min(7, "Enter a valid mobile number")
    .max(15)
    .regex(/^[0-9+\-\s()]*$/, "Enter a valid mobile number")
    .optional()
    .or(z.literal("")),
});

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, mobile } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    await dbConnect();

    // Check email not taken by another user
    const emailTaken = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: session.user.id },
    });
    if (emailTaken) {
      return NextResponse.json(
        { error: "This email is already used by another account" },
        { status: 409 },
      );
    }

    // Check mobile not taken by another user
    if (mobile) {
      const mobileTaken = await User.findOne({
        mobile,
        _id: { $ne: session.user.id },
      });
      if (mobileTaken) {
        return NextResponse.json(
          { error: "This mobile number is already used by another account" },
          { status: 409 },
        );
      }
    }

    const updated = await User.findByIdAndUpdate(
      session.user.id,
      {
        name,
        email: normalizedEmail,
        mobile: mobile || undefined,
      },
      { new: true },
    ).select("name email mobile image role provider");

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

