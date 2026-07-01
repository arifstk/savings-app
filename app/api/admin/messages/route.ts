// app/api/admin/messages/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";

// GET — list all messages (newest first)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, messages });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// PATCH — mark read/unread, set repliedAt
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, read, repliedAt } = await req.json();
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (typeof read === "boolean") update.read = read;
    if (repliedAt) update.repliedAt = repliedAt;

    await dbConnect();
    const message = await ContactMessage.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (!message)
      return NextResponse.json({ error: "Message not found" }, { status: 404 });

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// DELETE — remove a message
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    await dbConnect();
    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json({ error: "Message not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}


