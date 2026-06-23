// import { NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
// import dbConnect from "@/lib/mongodb";
// import Subscription from "@/models/Subscription";
// import { z } from "zod";

// const schema = z.object({
//   userId: z.string().min(1),
//   month: z.string().min(1, "Month is required"),
//   amount: z.number().min(0, "Amount must be 0 or more"),
//   date: z.string().min(1, "Date is required"),
// });

// // GET all subscriptions for a specific user
// export async function GET(req: Request) {
//   try {
//     const session = await auth();
//     if (!session?.user || session.user.role !== "admin") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const userId = searchParams.get("userId");

//     if (!userId) {
//       return NextResponse.json(
//         { error: "userId is required" },
//         { status: 400 },
//       );
//     }

//     await dbConnect();

//     const subscriptions = await Subscription.find({ userId })
//       .sort({ date: -1 })
//       .lean();

//     const total = subscriptions.reduce((sum, s) => sum + s.amount, 0);

//     return NextResponse.json({ subscriptions, total });
//   } catch (err) {
//     console.error("Get subscriptions error:", err);
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 },
//     );
//   }
// }

// // POST — add new subscription entry
// export async function POST(req: Request) {
//   try {
//     const session = await auth();
//     if (!session?.user || session.user.role !== "admin") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const parsed = schema.safeParse(body);

//     if (!parsed.success) {
//       return NextResponse.json(
//         { error: parsed.error.issues[0]?.message || "Invalid input" },
//         { status: 400 },
//       );
//     }

//     const { userId, month, amount, date } = parsed.data;
//     await dbConnect();

//     const subscription = await Subscription.create({
//       userId,
//       month,
//       amount,
//       date: new Date(date),
//     });

//     return NextResponse.json({ subscription }, { status: 201 });
//   } catch (err) {
//     console.error("Create subscription error:", err);
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 },
//     );
//   }
// }
