import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import MonthlyPayment from "@/models/MonthlyPayment";
import SubscriptionPeriod from "@/models/SubscriptionPeriod";
import User from "@/models/User";
import SiteSettings from "@/models/SiteSettings";
import { sendMail } from "@/lib/mail";

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
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}
function fmtTaka(n: number) {
  return "Tk. " + n.toLocaleString("en-BD", { minimumFractionDigits: 2 });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status, fee, note } = await req.json();

    await dbConnect();

    const payment = await MonthlyPayment.findById(id);
    if (!payment)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const previousStatus = payment.status;

    if (status !== undefined) {
      payment.status = status;
      payment.paidAt = status === "paid" ? new Date() : undefined;
    }
    if (fee !== undefined) payment.fee = fee;
    if (note !== undefined) payment.note = note;

    await payment.save();

    // Send email notification only when status changes TO "paid"
    if (status === "paid" && previousStatus !== "paid") {
      try {
        // Get user, period, and site settings in parallel
        const [user, period, settings] = await Promise.all([
          User.findById(payment.userId).select("name email").lean(),
          SubscriptionPeriod.findById(payment.periodId).select("name").lean(),
          SiteSettings.findById("site-settings").lean(),
        ]);

        if (user?.email) {
          const orgName = settings?.orgName || "Organization";
          const paidDate = new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });

          await sendMail({
            to: user.email,
            subject: `✓ Payment confirmed — ${displayMonth(payment.month)}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="UTF-8"></head>
              <body style="margin:0;padding:0;background:#f9f9f9;font-family:Arial,sans-serif;">
                <table width="100%" cellpadding="0" style="padding:40px 20px;">
                  <tr><td align="center">
                    <table width="480" cellpadding="0"
                      style="background:#ffffff;border-radius:12px;border:1px solid #e5e5e5;overflow:hidden;">

                      <!-- Header -->
                      <tr>
                        <td style="background:#0f766e;padding:24px 32px;">
                          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">
                            ${orgName}
                          </p>
                          <p style="margin:4px 0 0;color:#99f6e4;font-size:13px;">
                            Payment Confirmation
                          </p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding:20px;">
                          <p style="margin:0 0 8px;color:#374151;font-size:15px;">
                            Dear <strong>${user.name}</strong>,
                          </p>
                          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
                            Your subscription payment has been confirmed. Here are the details:
                          </p>

                          <!-- Payment details box -->
                          <table width="100%" cellpadding="0"
                            style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:24px;">
                            <tr>
                              <td style="padding:20px 24px;">
                                <table width="100%" cellpadding="0">
                                  <tr>
                                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Period</td>
                                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">
                                      ${period?.name ?? ""}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Month</td>
                                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">
                                      ${displayMonth(payment.month)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Amount</td>
                                    <td style="padding:6px 0;color:#15803d;font-size:15px;font-weight:700;text-align:right;">
                                      ${fmtTaka(payment.fee)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Payment Date</td>
                                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">
                                      ${paidDate}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Status</td>
                                    <td style="padding:6px 0;text-align:right;">
                                      <span style="background:#dcfce7;color:#15803d;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;">
                                        ✓ Paid
                                      </span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                            This is an automated confirmation. Please keep this email for your records.
                            If you have any questions, contact your organization admin.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;">
                          <p style="margin:0;color:#aaa;font-size:12px;text-align:center;">
                            ${orgName} · Automated payment notification
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td></tr>
                </table>
              </body>
              </html>
            `,
          });
        }
      } catch (mailErr) {
        // Don't fail the request if email fails — just log it
        console.error("Payment confirmation email failed:", mailErr);
      }
    }

    return NextResponse.json({ payment });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
