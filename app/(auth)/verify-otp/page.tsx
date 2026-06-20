"use client";

import { Suspense, useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import AuthCard from "@/components/AuthCard";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Redirect away if no email param
  useEffect(() => {
    if (!email) router.replace("/login");
  }, [email, router]);

  const focusNext = (index: number) => inputRefs.current[index + 1]?.focus();
  const focusPrev = (index: number) => { if (index > 0) inputRefs.current[index - 1]?.focus(); };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) focusNext(index);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index]) focusPrev(index);
    if (e.key === "ArrowLeft") focusPrev(index);
    if (e.key === "ArrowRight") focusNext(index);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setDigits(next);
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async () => {
    const otp = digits.join("");
    if (otp.length < 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setSubmitting(true);
    try {
      // Now we call signIn() — only OTP + email, no password.
      // NextAuth v4 error messages for this step are fine ("CredentialsSignin")
      // because we show our own toast based on the verify-otp API response.
      // Instead, verify OTP via our own API first, then call signIn.
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        toast.error(verifyData.error || "Invalid OTP");
        if (verifyData.clearOtp) {
          setDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
        setSubmitting(false);
        return;
      }

      // OTP is valid — now sign in via NextAuth (this creates the session)
      const result = await signIn("credentials", {
        otpEmail: email,
        otp: otp,
        otpVerified: "true", // tells authorize() to skip re-checking
        redirect: false,
      });

      if (result?.error) {
        toast.error("Session error. Please try logging in again.");
        router.push("/login");
        return;
      }

      toast.success("Logged in successfully!");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to resend OTP");
      } else {
        toast.success("New OTP sent to your email!");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setResendCooldown(60);
      }
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(b.length) + c)
    : "";

  return (
    <AuthCard
      eyebrow="Two-step verification"
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${maskedEmail}`}
    >
      {/* 6 digit boxes */}
      <div className="flex gap-2 justify-center my-6">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            autoFocus={i === 0}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`w-11 h-14 text-center text-xl font-bold rounded-lg border outline-none transition
              bg-stone-950 text-stone-50
              ${digit
                ? "border-amber-500 bg-amber-500/5"
                : "border-stone-700 focus:border-amber-500"
              }`}
          />
        ))}
      </div>

      {/* Verify button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || digits.join("").length < 6}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-semibold py-2.5 rounded-lg transition"
      >
        {submitting ? "Verifying…" : "Verify & Log in"}
      </button>

      {/* Resend */}
      <div className="mt-5 text-center text-sm text-stone-400">
        Didn&apos;t get the code?{" "}
        {resendCooldown > 0 ? (
          <span className="text-stone-500">
            Resend in <span className="text-stone-300 font-medium">{resendCooldown}s</span>
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-amber-500 hover:text-amber-400 font-medium disabled:opacity-50 cursor-pointer"
          >
            {resending ? "Sending…" : "Resend OTP"}
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-stone-500">
        Wrong account?{" "}
        <a href="/login" className="text-amber-500 hover:text-amber-400">
          Back to login
        </a>
      </p>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <p className="text-stone-500 text-sm">Loading…</p>
      </div>
    }>
      <VerifyOtpForm />
    </Suspense>
  );
}
