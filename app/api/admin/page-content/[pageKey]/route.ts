// api/admin/page-content/[pageKey]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import PageContent from "@/models/PageContent";

const VALID_KEYS = ["privacy-policy", "terms-and-conditions", "about"];

// Public GET — used by admin panel to load, and by public pages
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageKey: string }> },
) {
  try {
    const { pageKey } = await params;
    if (!VALID_KEYS.includes(pageKey)) {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }

    await dbConnect();
    const page = await PageContent.findById(pageKey).lean();
    return NextResponse.json({ page: page ?? { sections: [] } });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// Admin PUT — update page sections
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ pageKey: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { pageKey } = await params;
    if (!VALID_KEYS.includes(pageKey)) {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }

    const { sections } = await req.json();
    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { error: "sections must be an array" },
        { status: 400 },
      );
    }

    const cleanSections = sections.map((s) => ({
      h3: String(s?.h3 ?? ""),
      p: String(s?.p ?? ""),
    }));

    await dbConnect();
    const page = await PageContent.findByIdAndUpdate(
      pageKey,
      { _id: pageKey, sections: cleanSections },
      { upsert: true, new: true },
    );

    return NextResponse.json({ page });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
