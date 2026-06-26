import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json(
        { error: "Please log in to view members" },
        { status: 401 },
      );

    await dbConnect();

    const users = await User.find({
      $or: [{ isVerified: true }, { isVerified: { $exists: false } }],
    })
      .select("name email mobile image role provider createdAt")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ members: users });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
