import crypto from "crypto";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Otp from "@/models/Otp";
import { sendMail } from "@/lib/mail";

// Generate a random 6-digit OTP
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP before storing (same as password hashing)
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

// Compare plain OTP with stored hash
export async function verifyOtpHash(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// Save OTP to DB (replaces any existing OTP for this email)
export async function saveOtp(email: string, otp: string): Promise<void> {
  await dbConnect();
  const hashed = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Replace existing OTP for this email (upsert)
  await Otp.findOneAndUpdate(
    { email },
    { otp: hashed, expiresAt, attempts: 0 },
    { upsert: true, new: true }
  );
}

// Send OTP email
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  await sendMail({
    to: email,
    subject: "Your login verification code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1c1917;">Login Verification</h2>
        <p style="color: #57534e;">Use the code below to complete your login. It expires in <strong>10 minutes</strong>.</p>
        
        <div style="background: #f5f5f4; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #78716c; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">Your OTP Code</p>
          <p style="margin: 0; font-size: 42px; font-weight: 700; letter-spacing: 0.25em; color: #1c1917;">${otp}</p>
        </div>

        <p style="color: #78716c; font-size: 13px;">
          If you didn't try to log in, you can safely ignore this email. 
          Someone may have typed your email by mistake.
        </p>
      </div>
    `,
  });
}
