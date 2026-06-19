"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import AuthCard from "@/components/AuthCard";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      toast.success("Password reset successfully!");
      router.push("/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthCard eyebrow="Reset password" title="Invalid link">
        <p className="text-stone-400 text-sm mb-4">
          This password reset link is missing a token. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="text-amber-500 hover:text-amber-400 font-medium text-sm"
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Reset password"
      title="Choose a new password"
      footer={
        <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("token")} value={token} />

        <div>
          <label htmlFor="password" className="block text-sm text-stone-300 mb-1.5">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
            placeholder="At least 8 characters"
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm text-stone-300 mb-1.5">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
            placeholder="Re-enter your new password"
          />
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-stone-950 font-semibold py-2.5 rounded-lg transition"
        >
          {submitting ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <p className="text-stone-500 text-sm">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
