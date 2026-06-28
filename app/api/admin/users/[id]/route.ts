// app/api/admin/users/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email"),
  mobile: z.string().optional().or(z.literal("")),
  role: z.enum(["user", "admin"]).optional(), // Added role option to update dynamically
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { name, email, mobile, role } = parsed.data;
    await dbConnect();

    const emailTaken = await User.findOne({ email, _id: { $ne: id } });
    if (emailTaken) {
      return NextResponse.json(
        { error: "Email already used by another account" },
        { status: 409 },
      );
    }

    const updated = await User.findByIdAndUpdate(
      id,
      {
        name,
        email: email.toLowerCase().trim(),
        mobile: mobile || undefined,
        ...(role && { role }), // Safely updates role if passed from your Admin Dashboard
      },
      { new: true },
    ).select("name email mobile role isVerified createdAt");

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

