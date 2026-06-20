// // app/(auth)/register/page.tsx
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { signIn } from "next-auth/react";
// import toast from "react-hot-toast";
// import AuthCard from "@/components/AuthCard";
// import GoogleButton from "@/components/GoogleButton";
// import { registerSchema, type RegisterInput } from "@/lib/validations";

// export default function RegisterPage() {
//   const router = useRouter();
//   const [submitting, setSubmitting] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<RegisterInput>({
//     resolver: zodResolver(registerSchema),
//   });

//   const onSubmit = async (data: RegisterInput) => {
//     setSubmitting(true);
//     try {
//       const res = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });

//       const result = await res.json();

//       if (!res.ok) {
//         toast.error(result.error || "Something went wrong");
//         setSubmitting(false);
//         return;
//       }

//       toast.success("Account created! Logging you in…");

//       // Automatically log the user in after successful registration
//       const signInResult = await signIn("credentials", {
//         identifier: data.email,
//         password: data.password,
//         redirect: false,
//       });

//       if (signInResult?.error) {
//         toast.success("Account created. Please log in.");
//         router.push("/login");
//         return;
//       }

//       router.push("/");
//       router.refresh();
//     } catch {
//       toast.error("Something went wrong. Please try again.");
//       setSubmitting(false);
//     }
//   };

//   return (
//     <AuthCard
//       eyebrow="Get started"
//       title="Create your account"
//       subtitle="Join in under a minute."
//       footer={
//         <>
//           Already have an account?{" "}
//           <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium">
//             Log in
//           </Link>
//         </>
//       }
//     >
//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <div>
//           <label htmlFor="name" className="block text-sm text-stone-300 mb-1.5">
//             Full name
//           </label>
//           <input
//             id="name"
//             type="text"
//             autoComplete="name"
//             {...register("name")}
//             className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
//             placeholder="Jordan Lee"
//           />
//           {errors.name && (
//             <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>
//           )}
//         </div>

//         <div>
//           <label htmlFor="email" className="block text-sm text-stone-300 mb-1.5">
//             Email
//           </label>
//           <input
//             id="email"
//             type="email"
//             autoComplete="email"
//             {...register("email")}
//             className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
//             placeholder="you@example.com"
//           />
//           {errors.email && (
//             <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>
//           )}
//         </div>

//         <div>
//           <label htmlFor="mobile" className="block text-sm text-stone-300 mb-1.5">
//             Mobile number
//           </label>
//           <input
//             id="mobile"
//             type="tel"
//             autoComplete="tel"
//             {...register("mobile")}
//             className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
//             placeholder="+1 555 123 4567"
//           />
//           {errors.mobile && (
//             <p className="text-red-400 text-xs mt-1.5">{errors.mobile.message}</p>
//           )}
//         </div>

//         <div>
//           <label htmlFor="password" className="block text-sm text-stone-300 mb-1.5">
//             Password
//           </label>
//           <input
//             id="password"
//             type="password"
//             autoComplete="new-password"
//             {...register("password")}
//             className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
//             placeholder="At least 8 characters"
//           />
//           {errors.password && (
//             <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
//           )}
//         </div>

//         <button
//           type="submit"
//           disabled={submitting}
//           className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-stone-950 font-semibold py-2.5 rounded-lg transition"
//         >
//           {submitting ? "Creating account…" : "Create account"}
//         </button>
//       </form>

//       <div className="flex items-center gap-3 my-6">
//         <div className="h-px flex-1 bg-stone-800" />
//         <span className="text-xs text-stone-500 uppercase tracking-wide">or</span>
//         <div className="h-px flex-1 bg-stone-800" />
//       </div>

//       <GoogleButton label="Sign up with Google" />
//     </AuthCard>
//   );
// }






"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

import AuthCard from "@/components/AuthCard";
import GoogleButton from "@/components/GoogleButton";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      toast.success("Account created! Logging you in…");

      // Auto login after register
      const signInResult = await signIn("credentials", {
        identifier: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.success("Account created. Please log in.");
        router.push("/login");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Get started"
      title="Create your account"
      subtitle="Join in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-black hover:underline font-semibold"
          >
            Log in
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm text-gray-700 mb-1.5"
          >
            Full name
          </label>

          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name")}
            placeholder="Jordan Lee"
            className="w-full bg-white border border-gray-300 focus:border-black outline-none rounded-lg px-3.5 py-2.5 text-black placeholder:text-gray-400 transition"
          />

          {errors.name && (
            <p className="text-red-500 text-xs mt-1.5">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm text-gray-700 mb-1.5"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            placeholder="you@example.com"
            className="w-full bg-white border border-gray-300 focus:border-black outline-none rounded-lg px-3.5 py-2.5 text-black placeholder:text-gray-400 transition"
          />

          {errors.email && (
            <p className="text-red-500 text-xs mt-1.5">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Mobile */}
        <div>
          <label
            htmlFor="mobile"
            className="block text-sm text-gray-700 mb-1.5"
          >
            Mobile number
          </label>

          <input
            id="mobile"
            type="tel"
            autoComplete="tel"
            {...register("mobile")}
            placeholder="+1 555 123 4567"
            className="w-full bg-white border border-gray-300 focus:border-black outline-none rounded-lg px-3.5 py-2.5 text-black placeholder:text-gray-400 transition"
          />

          {errors.mobile && (
            <p className="text-red-500 text-xs mt-1.5">
              {errors.mobile.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm text-gray-700 mb-1.5"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              placeholder="At least 8 characters"
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
          className="w-full bg-black hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition"
        >
          {submitting
            ? "Creating account…"
            : "Create account"}
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

      <GoogleButton label="Sign up with Google" />
    </AuthCard>
  );
}

