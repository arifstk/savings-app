// app/api/admin/reports/send-email/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import MonthlyPayment from "@/models/MonthlyPayment";
import User from "@/models/User";
import nodemailer from "nodemailer";

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: process.env.EMAIL_SERVER_PORT === "465",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const paidDate = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function displayMonth(ym: string) {
  if (!ym) return "—";
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

export async function POST(req: Request) {
  try {
    // 1. Admin Authorization Protection
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, periodId } = await req.json();
    if (!userId || !periodId) {
      return NextResponse.json(
        { error: "User ID and Period ID are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // 2. Gather matching database documents
    const user = await User.findById(userId).select("name email").lean();
    if (!user || !user.email) {
      return NextResponse.json(
        { error: "User or user email not found" },
        { status: 404 },
      );
    }

    const period = await SubscriptionPeriod.findById(periodId).lean();
    if (!period) {
      return NextResponse.json(
        { error: "Subscription period not found" },
        { status: 404 },
      );
    }

    const payments = await MonthlyPayment.find({ userId, periodId })
      .sort({ month: 1 })
      .lean();

    // Compute Summary Metrics
    const totalPaid = payments
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + p.fee, 0);
    const totalPending = payments
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + p.fee, 0);

    // Generate Clean HTML Mail Template Table Rows
    const tableRowsHtml = payments
      .map(
        (p, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f9fafb"}; text-align: left; border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; color: #4b5563; font-size: 14px;">${idx + 1}</td>
        <td style="padding: 10px; color: #1f2937; font-weight: 500; font-size: 14px;">${displayMonth(p.month)}</td>
        <td style="padding: 10px; color: #4b5563; font-size: 14px;">${p.status === "paid" && p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-GB") : "—"}</td>
        <td style="padding: 10px; color: #1f2937; font-weight: bold; font-size: 14px;">Tk. ${p.fee.toLocaleString("en-BD")}</td>
        <td style="padding: 10px; font-size: 14px;">
          <span style="padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold; ${
            p.status === "paid"
              ? "background-color: #d1fae5; color: #065f46;"
              : "background-color: #fef3c7; color: #92400e;"
          }">
            ${p.status === "paid" ? "Paid" : "Pending"}
          </span>
        </td>
      </tr>
    `,
      )
      .join("");

    // Full Email Body Design layout
    const mailOptions = {
      from: `"Taqwa Savings" <${process.env.EMAIL_FROM}>`, // SMTP_USER
      to: user.email,
      subject: `Yearly Subscription Report: ${period.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #0d9488; margin-bottom: 5px;">Hello ${user.name},</h2>
          <p style="color: #666; font-size: 15px; margin-top: 0;">Your yearly statement for <strong>${period.name}</strong> has been issued. <span style="color: #0d9488;"> All the money you have deposited during this period has been refunded to you on <strong>${paidDate}</strong>.</span></p>
          
          <div style="display: flex; gap: 20px; justify-center: space-between; margin: 20px 0;">
            <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; text-align: center;">
              <span style="font-size: 11px; color: #166534; text-transform: uppercase;">Total Paid</span>
              <div style="font-size: 16px; font-weight: bold; color: #15803d; margin-top: 4px;">Tk. ${totalPaid.toLocaleString("en-BD")}</div>
            </div>
            <div style="flex: 1; background-color: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 8px; text-align: center;">
              <span style="font-size: 11px; color: #92400e; text-transform: uppercase;">Total Due</span>
              <div style="font-size: 16px; font-weight: bold; color: #b45309; margin-top: 4px;">Tk. ${totalPending.toLocaleString("en-BD")}</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(to right, #14b8a6, #06b6d4); color: white; text-align: left;">
                <th style="padding: 12px 10px; font-size: 12px; text-transform: uppercase;">#</th>
                <th style="padding: 12px 10px; font-size: 12px; text-transform: uppercase;">Month</th>
                <th style="padding: 12px 10px; font-size: 12px; text-transform: uppercase;">Payment Date</th>
                <th style="padding: 12px 10px; font-size: 12px; text-transform: uppercase;">Amount</th>
                <th style="padding: 12px 10px; font-size: 12px; text-transform: uppercase;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 12px; color: #9ca3af; text-align: center;">
            This is an automated statement receipt generated by the Administration Dashboard.
          </div>
        </div>
      `,
    };

    // Fire Dispatch Email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Report emailed successfully!",
    });
  } catch (error) {
    console.error("Mail Dispatch Error:", error);
    return NextResponse.json(
      { error: "Something went wrong sending email" },
      { status: 500 },
    );
  }
}
