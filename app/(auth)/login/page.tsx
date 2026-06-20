// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import AuthCard from "@/components/AuthCard";
import GoogleButton from "@/components/GoogleButton";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/check-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: data.identifier,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Login failed");
        setSubmitting(false);
        return;
      }

      toast.success("OTP sent to your email!");

      router.push(
        `/verify-otp?email=${encodeURIComponent(result.email)}`
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Log in to your account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-black hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Identifier */}
        <div>
          <label
            htmlFor="identifier"
            className="block text-sm text-gray-700 mb-1.5"
          >
            Email or mobile number
          </label>

          <input
            id="identifier"
            type="text"
            autoComplete="username"
            {...register("identifier")}
            placeholder="you@example.com"
            className="w-full bg-white border border-gray-300 focus:border-black outline-none rounded-lg px-3.5 py-2.5 text-black placeholder:text-gray-400 transition"
          />

          {errors.identifier && (
            <p className="text-red-500 text-xs mt-1.5">
              {errors.identifier.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm text-gray-700"
            >
              Password
            </label>

            <Link
              href="/forgot-password"
              className="text-xs text-black hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
              placeholder="••••••••"
              className="w-full bg-white border border-gray-300 focus:border-black outline-none rounded-lg px-3.5 py-2.5 text-black placeholder:text-gray-400 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-black transition cursor-pointer"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="text-red-500 text-xs mt-1.5">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Sending OTP…" : "Continue"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-gray-200" />

        <span className="text-xs text-gray-500 uppercase tracking-wide">
          or
        </span>

        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleButton />
    </AuthCard>
  );
}


