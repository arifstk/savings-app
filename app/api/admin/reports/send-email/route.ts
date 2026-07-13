// app/api/admin/reports/send-email/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import MonthlyPayment from "@/models/MonthlyPayment";
import User from "@/models/User";
import mongoose from "mongoose";
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

    // Generate accurate execution date inside the request scope
    const paidDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Generate accurate execution date inside the request scope
    const printDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // 2. Gather matching database documents
    const user = (await User.findById(userId)
      .select("name email mobile")
      .lean()) as any;
    if (!user || !user.email) {
      return NextResponse.json(
        { error: "User or user email not found" },
        { status: 404 },
      );
    }

    const period = (await SubscriptionPeriod.findById(periodId).lean()) as any;
    if (!period) {
      return NextResponse.json(
        { error: "Subscription period not found" },
        { status: 404 },
      );
    }

    // 3. Fetch System Settings dynamically (Logo, Org Name, Signature)
    const settingsColl = mongoose.connection.collection("settings");
    const settingsDoc = await settingsColl.findOne({});
    const settings = {
      orgName: settingsDoc?.settings?.orgName || "Taqwa Savings",
      logoUrl: settingsDoc?.settings?.logoUrl || "",
      managerSignatureUrl: settingsDoc?.settings?.managerSignatureUrl || "",
    };

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
    const tableRowsHtml =
      payments.length === 0
        ? `<tr>
          <td colspan="5" style="text-align: center; padding: 32px; color: #9ca3af; font-size: 13px; font-family: Arial, sans-serif;">
            No subscription records found
          </td>
         </tr>`
        : payments
            .map(
              (p, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f9fafb"}; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 16px; color: #9ca3af; font-size: 12px; font-family: Arial, sans-serif;">${idx + 1}</td>
            <td style="padding: 10px 16px; color: #1f2937; font-weight: 500; font-size: 14px; font-family: Arial, sans-serif;">${displayMonth(p.month)}</td>
            <td style="padding: 10px 16px; color: #4b5563; font-size: 12px; font-family: Arial, sans-serif;">
              ${p.status === "paid" && p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            </td>
            <td style="padding: 10px 16px; text-align: right; color: #1f2937; font-weight: bold; font-size: 14px; font-family: Arial, sans-serif;">
              Tk. ${p.fee.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </td>
            <td style="padding: 10px 16px; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; font-family: Arial, sans-serif; ${
                p.status === "paid"
                  ? "background-color: #dcfce7; color: #15803d;"
                  : "background-color: #fef3c7; color: #b45309;"
              }">
                ${p.status === "paid" ? "✓ Paid" : "Pending"}
              </span>
            </td>
          </tr>
        `,
            )
            .join("");

    // Full Email Body Design layout with injected Headers and Footers
    const mailOptions = {
      from: `"${settings.orgName}" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `Subscription Payment Statement: ${period.name}`,
      html: `
        <div style="background-color: #ffffff; font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb;">

        <table>
        <h2 style="color: #0d9488; margin-bottom: 5px; font-size: 20px;">Dear ${user.name},</h2>
        <p style="color: #4b5563; font-size: 15px; margin-top: 0; line-height: 1.5;">
            Your yearly statement for <strong>${period.name}</strong> has been issued. 
            <span style="color: #0d9488;">All the money you have deposited during this period has been refunded to you on <strong>${paidDate}</strong>.</span>
          </p>
        </table>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #1f2937; padding-bottom: 8px; margin-bottom: 20px;">
            <tr>
              <td align="left" valign="middle">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right: 16px;">
                      ${
                        settings.logoUrl
                          ? `<img src="${settings.logoUrl}" alt="Logo" width="65" height="68" style="display: block; object-fit: contain;" />`
                          : `<div style="width: 56px; height: 56px; background-color: #f3f4f6; border-radius: 8px; text-align: center; line-height: 56px; color: #9ca3af; font-size: 12px;">Logo</div>`
                      }
                    </td>
                    <td>
                      <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: #111827; font-family: Arial, sans-serif;">${settings.orgName}</h1>
                      <p style="margin: 0; font-size: 14px; color: #6b7280; font-family: Arial, sans-serif;">Subscription Payment Statement</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="right" valign="top" style="font-size: 12px; color: #6b7280; font-family: Arial, sans-serif; line-height: 1.4;">
                <p style="margin: 0; font-weight: 600; color: #374151;">${period.name}</p>
                <p style="margin: 0; color: #9ca3af;">${displayMonth(period.startMonth)} – ${displayMonth(period.endMonth)}</p>
                <p style="margin: 0;">Printed: ${printDate}</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 20px; margin-bottom: 24px;">
            <tr>
              <td width="33.33%" valign="top">
                <p style="margin: 0 0 2px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Name</p>
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1f2937;">${user.name}</p>
              </td>
              <td width="33.33%" valign="top">
                <p style="margin: 0 0 2px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Email</p>
                <p style="margin: 0; font-size: 14px; color: #374151;">${user.email}</p>
              </td>
              <td width="33.33%" valign="top">
                <p style="margin: 0 0 2px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Mobile</p>
                <p style="margin: 0; font-size: 14px; color: #374151;">${user.mobile || "—"}</p>
              </td>
            </tr>
          </table>


          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #1f2937; color: #ffffff;">
                <th align="left" style="padding: 10px 16px; font-size: 12px; font-weight: 600; width: 40px; font-family: Arial, sans-serif;">S.I</th>
                <th align="left" style="padding: 10px 16px; font-size: 12px; font-weight: 600; font-family: Arial, sans-serif;">Month</th>
                <th align="left" style="padding: 10px 16px; font-size: 12px; font-weight: 600; font-family: Arial, sans-serif;">Payment Date</th>
                <th align="right" style="padding: 10px 16px; font-size: 12px; font-weight: 600; font-family: Arial, sans-serif;">Amount</th>
                <th align="center" style="padding: 10px 16px; font-size: 12px; font-weight: 600; font-family: Arial, sans-serif;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #1f2937; color: #ffffff;">
                <td colspan="3" align="right" style="padding: 12px 16px; font-size: 14px; font-weight: bold; font-family: Arial, sans-serif;">Total Paid =</td>
                <td align="right" style="padding: 12px 16px; font-size: 14px; font-weight: bold; font-family: Arial, sans-serif;">
                  Tk. ${totalPaid.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 40px;">
            <tr>
              <td align="left" valign="bottom" style="font-size: 14px; color: #4b5563; font-family: Arial, sans-serif; padding-bottom: 4px;">
                <p style="margin: 0; font-weight: 500;">Date: ${printDate}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">Member: ${user.name}</p>
              </td>
              <td align="center" valign="bottom" style="width: 200px;">
                ${
                  settings.managerSignatureUrl
                    ? `<div style="margin-bottom: 8px;">
                      <img src="${settings.managerSignatureUrl}" alt="Signature" width="130" height="52" style="display: block; margin: 0 auto; object-fit: contain;" />
                     </div>`
                    : `<div style="height: 52px; margin-bottom: 8px;"></div>`
                }
                <div style="border-top: 1px solid #1f2937; padding-top: 6px;">
                  <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937; font-family: Arial, sans-serif;">Manager / Admin</p>
                  <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280; font-family: Arial, sans-serif;">${settings.orgName}</p>
                </div>
              </td>
            </tr>
          </table>

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

