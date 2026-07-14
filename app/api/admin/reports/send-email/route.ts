// app/api/admin/reports/send-email/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import MonthlyPayment from "@/models/MonthlyPayment";
import User from "@/models/User";
import SiteSettings from "@/models/SiteSettings";
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
    // Admin Authorization Protection
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

    const printDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Gather matching database documents
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

    // Fetch System Settings via the Mongoose model (fixed — was querying a
    // raw "settings" collection with the wrong nested shape before)
    const settingsDoc = (await SiteSettings.findById(
      "site-settings",
    ).lean()) as any;
    const settings = {
      orgName: settingsDoc?.orgName || "Taqwa Savings",
      logoUrl: settingsDoc?.logoUrl || "",
      managerSignatureUrl: settingsDoc?.managerSignatureUrl || "",
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
        <div style="background-color: #ffffff; font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb;">

        <table>
        <h2 style="color: #0d9488; margin-bottom: 5px; font-size: 18px;">Dear ${user.name},</h2>
        <p style="color: #4b5563; font-size: 13px; margin-top: 0; line-height: 1.5;">
            Your yearly statement for <strong>${period.name}</strong> has been issued. 
            <span style="color: #0d9488;">All the amount <span style="font-weight: bold;">Tk. ${totalPaid.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span> that you have deposited during this period has been refunded to you on <strong>${paidDate}</strong>.</span>
          </p>
        </table>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #1f2937; padding-bottom: 2px; margin-bottom: 6px;">
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

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 20px; margin-bottom: 20px;">
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


          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
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
                <td colspan="3" align="right" style="padding: 10px 16px; font-size: 13px; font-weight: bold; font-family: Arial, sans-serif;">Total Paid =</td>
                <td align="right" style="padding: 10px 16px; font-size: 13px; font-weight: bold; font-family: Arial, sans-serif;">
                  Tk. ${totalPaid.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="border-top:1px solid #e5e7eb;padding-top:24px;margin-top:40px;"
            >
              <tr>

                <!-- Left -->
                <td width="25%" valign="bottom">
                  <p style="margin:0;font-size:14px;font-weight:500;color:#4b5563;">
                    Date: ${printDate}
                  </p>

                  <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">
                    Member: ${user.name}
                  </p>
                </td>

              <!-- Middle (Seal) -->
            <td
              width="50%"
              align="center"
              valign="middle"
              style="padding:0;
              -webkit-transform: rotate(30deg);
              -ms-transform: rotate(30deg);
              transform: rotate(30deg);
              "
            >

              <div
                style="
                  display:inline-block;
                  width:120px;
                  background:#ffffff;
                  border:4px solid #374151;
                  color:#374151;
                  font-family:Arial,sans-serif;
                  font-weight:bold;
                  text-align:center;
                  text-transform:uppercase;
                  letter-spacing:1px;
                  padding:2px;
                  line-height:1;
                "
              >

                <div
                  style="
                    font-size:10px;
                    margin:0;
                    padding:0;
                    line-height:1;
                  "
                >
                  ${settings.orgName}
                </div>

                <div
                  style="
                    font-size:19px;
                    border-top:3px solid #374151;
                    border-bottom:3px solid #374151;
                    margin:2px 0;
                    padding:2px 0;
                    line-height:1;
                    white-space:wrap;
                  "
                >
                  REFUNDED
                  <span
                    style="
                      font-size:8px;
                      font-weight: 600;
                      text-align: right;
                      display: block;
                      align-self: flex-end;
                    "
                  >
                    to member's
                  </span>
                </div>

                <div
                  style="
                    font-size:11px;
                    margin:0;
                    padding:0;
                    line-height:1;
                    color:#f59e0b;
                  "
                >
                  ${paidDate}
                </div>

              </div>

            </td>

    <!-- Right -->
    <td width="25%" align="center" valign="bottom">

      ${
        settings.managerSignatureUrl
          ? `<div style="margin-bottom:8px;">
              <img
                src="${settings.managerSignatureUrl}"
                width="130"
                height="52"
                style="display:block;margin:0 auto;"
              />
            </div>`
          : ``
      }

      <div style="border-top:1px solid #1f2937;padding-top:6px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#1f2937;">
          Manager / Admin
        </p>

        <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">
          ${settings.orgName}
        </p>
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
