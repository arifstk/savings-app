import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Banner from "@/models/Banner";

// Public GET — used by frontend to display the banner
export async function GET() {
  try {
    await dbConnect();
    const banner = await Banner.findById("banner").lean();
    return NextResponse.json({
      banner: banner ?? { enabled: false, h1: "", h2: "", p: "" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Admin PUT — update banner content
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { enabled, h1, h2, p } = await req.json();

    await dbConnect();

    const banner = await Banner.findByIdAndUpdate(
      "banner",
      { enabled, h1, h2, p },
      { upsert: true, new: true }
    );

    return NextResponse.json({ banner });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
