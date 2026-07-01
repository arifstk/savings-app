// app/api/admin/messages/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ContactInfo from "@/models/ContactInfo";

const DEFAULT_CARDS = [
  { icon: "📧", title: "Email Us", desc: "", sub: "We reply within 24 hours" },
  { icon: "📞", title: "Call Us", desc: "", sub: "Mon–Sat, 9am–6pm" },
  { icon: "📍", title: "Visit Us", desc: "", sub: "Come say hello" },
  {
    icon: "⏱",
    title: "Response Time",
    desc: "Within 24 hours",
    sub: "Usually much faster",
  },
];

// Public GET — used by the contact page and the admin editor
export async function GET() {
  try {
    await dbConnect();
    const doc = await ContactInfo.findById("contact-info").lean();
    return NextResponse.json({
      cards: doc?.cards?.length ? doc.cards : DEFAULT_CARDS,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// Admin PUT — update cards
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { cards } = await req.json();
    if (!Array.isArray(cards)) {
      return NextResponse.json(
        { error: "cards must be an array" },
        { status: 400 },
      );
    }

    const cleanCards = cards.map((c) => ({
      icon: String(c?.icon ?? "").slice(0, 8),
      title: String(c?.title ?? ""),
      desc: String(c?.desc ?? ""),
      sub: String(c?.sub ?? ""),
    }));

    await dbConnect();
    const doc = await ContactInfo.findByIdAndUpdate(
      "contact-info",
      { _id: "contact-info", cards: cleanCards },
      { upsert: true, new: true },
    );

    return NextResponse.json({ cards: doc.cards });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
