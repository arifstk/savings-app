import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const settings = await SiteSettings.findById("site-settings").lean()
      ?? { orgName: "My Organization", logoUrl: "", managerSignatureUrl: "" };

    return NextResponse.json({ settings });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") ?? "";
    await dbConnect();

    if (contentType.includes("multipart/form-data")) {
      // Handle file uploads (logo or signature)
      const formData = await req.formData();
      const type     = formData.get("type") as string; // "logo" | "signature"
      const file     = formData.get("file") as File | null;

      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

      const bytes  = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "site-settings", public_id: type, overwrite: true, resource_type: "image" },
          (err, res) => { if (err || !res) return reject(err); resolve(res); }
        );
        stream.end(buffer);
      });

      const field = type === "logo" ? "logoUrl" : "managerSignatureUrl";
      const settings = await SiteSettings.findByIdAndUpdate(
        "site-settings",
        { [field]: result.secure_url },
        { upsert: true, new: true }
      );

      return NextResponse.json({ settings });
    }

    // Handle JSON update (org name)
    const { orgName } = await req.json();
    const settings = await SiteSettings.findByIdAndUpdate(
      "site-settings",
      { orgName },
      { upsert: true, new: true }
    );

    return NextResponse.json({ settings });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
