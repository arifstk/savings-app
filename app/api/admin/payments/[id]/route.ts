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

    // Send email only when status changes TO "paid"
    if (status === "paid" && previousStatus !== "paid") {
      try {
        const [user, period, settings] = await Promise.all([
          User.findById(payment.userId).select("name email").lean(),
          SubscriptionPeriod.findById(payment.periodId)
            .select("name startMonth endMonth")
            .lean(),
          SiteSettings.findById("site-settings").lean(),
        ]);

        if (user?.email) {
          const orgName = settings?.orgName || "Organization";
          const logoUrl = settings?.logoUrl || "";
          const paidDate = new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });

          // Calculate previous total (all paid payments for this user EXCEPT current)
          const previousPayments = await MonthlyPayment.find({
            userId: payment.userId,
            status: "paid",
            _id: { $ne: payment._id },
          }).lean();
          const previousTotal = previousPayments.reduce((s, p) => s + p.fee, 0);
          const newTotal = previousTotal + payment.fee;

          // Period date range e.g. "Jan 2026 – Jun 2026"
          const periodRange = period
            ? `${displayMonth(period.startMonth)} – ${displayMonth(period.endMonth)}`
            : "";

          await sendMail({
            to: user.email,
            subject: `✓ Payment confirmed — ${displayMonth(payment.month)}`,
            html: `
              <!DOCTYPE html>
              <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
              <html>
              <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
              <table width="100%" cellpadding="0" style="padding:32px 16px;">
                <tr><td align="center">
                <table width="520" cellpadding="0"
                style="background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

  <!-- ── HEADER ── -->
  <tr>
    <td style="padding:15px 28px 0px;border-bottom:1px solid #111827;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <!-- Logo + Org name left -->
          <td style="vertical-align:middle;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                ${
                  logoUrl
                    ? `
                <td style="vertical-align:middle;padding-right:12px;">
                  <img src="${logoUrl}" width="65" height="68"
                    style="display:block;object-fit:contain;"
                    alt="${orgName} logo"/>
                </td>`
                    : ""
                }
                <td style="vertical-align:middle;">
                  <p style="margin:0;font-size:17px;font-weight:700;color:#111827;line-height:1.2;">
                    ${orgName}
                  </p>
                  <p style="margin:3px 0 0;font-size:12px;color:#6b7280;">
                    Subscription Payment Statement
                  </p>
                </td>
              </tr>
            </table>
          </td>
          <!-- Period info right -->
          <td style="text-align:right;vertical-align:middle;">
            <p style="margin:0;font-size:13px;font-weight:700;color:#111827;">${period?.name ?? ""}</p>
            <p style="margin: 0;font-size:11px;color:#6b7280;">${periodRange}</p>
            <p style="margin: 0;font-size:11px;color:#6b7280;">Confirmed: ${paidDate}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── BODY ── -->
  <tr>
    <td style="padding:25px;">

      <p style="margin:0 0 6px;color:#374151;font-size:15px;">
        Dear <strong>${user.name}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
        Your subscription payment has been confirmed. Here are the details:
      </p>

      <!-- Payment details box -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:20px;">
        <tr>
          <td style="padding:18px 22px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:7px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #d1fae5;">Period</td>
                <td style="padding:7px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #d1fae5;">
                  ${period?.name ?? ""}
                </td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #d1fae5;">Month</td>
                <td style="padding:7px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #d1fae5;">
                  ${displayMonth(payment.month)}
                </td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #d1fae5;">Amount</td>
                <td style="padding:7px 0;color:#15803d;font-size:15px;font-weight:700;text-align:right;border-bottom:1px solid #d1fae5;">
                  ${fmtTaka(payment.fee)}
                </td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #d1fae5;">Payment Date</td>
                <td style="padding:7px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #d1fae5;">
                  ${paidDate}
                </td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#6b7280;font-size:13px;">Status</td>
                <td style="padding:7px 0;text-align:right;">
                  <span style="background:#dcfce7;color:#15803d;padding:3px 12px;border-radius:999px;font-size:12px;font-weight:700;">
                    ✓ Paid
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- ── TOTAL SECTION ── -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:20px;">
        <tr>
          <td style="padding:16px 22px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">
              Payment Summary
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:5px 0;color:#6b7280;font-size:13px;">Previous total paid</td>
                <td style="padding:5px 0;color:#374151;font-size:13px;font-weight:600;text-align:right;">
                  ${fmtTaka(previousTotal)}
                </td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#6b7280;font-size:13px;">This month</td>
                <td style="padding:5px 0;color:#15803d;font-size:13px;font-weight:600;text-align:right;">
                  + ${fmtTaka(payment.fee)}
                </td>
              </tr>
              <!-- Divider -->
              <tr>
                <td colspan="2" style="padding:6px 0;">
                  <div style="border-top:1px solid #cbd5e1;"></div>
                </td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#111827;font-size:14px;font-weight:700;">Total Paid</td>
                <td style="padding:5px 0;color:#0f766e;font-size:16px;font-weight:800;text-align:right;">
                  ${fmtTaka(newTotal)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.7;">
        This is an automated confirmation. Please keep this email for your records.
        If you have any questions, contact your organization admin.
      </p>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="background:#f9fafb;padding:14px 28px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
        ${orgName} &middot; Automated payment notification
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
