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
  role: z.enum(["user", "admin"]).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Validate request body
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { name, email, mobile, role } = parsed.data;
    await dbConnect();

    // ✅ Find target user first
    const existingUser = await User.findById(id);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check duplicate email
    const emailTaken = await User.findOne({ email, _id: { $ne: id } });
    if (emailTaken) {
      return NextResponse.json(
        { error: "Email already used by another account" },
        { status: 409 },
      );
    }

    // ✅ prevent admin from remove own admin role
    if (session.user.email === existingUser.email && role && role !== "admin") {
      return NextResponse.json(
        {
          error: "You cannot remove your own admin role",
        },
        { status: 400 },
      );
    }

    // Update user
    const updated = await User.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        mobile: mobile?.trim() || undefined,
        ...(role && { role }), // Safely updates role if passed from your Admin Dashboard
      },
      { new: true },
    ).select("name email mobile role isVerified createdAt");

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updated,
    });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate and check for admin role permissions
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    // 2. Locate targeted user in the database
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Security guard preventing self-deletion by mistake
    if (session.user.email === existingUser.email) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account" },
        { status: 400 },
      );
    }

    // 4. Proceed with document deletion
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
