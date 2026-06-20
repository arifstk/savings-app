// // "use client";

// // import { useState } from "react";
// // import { useRouter } from "next/navigation";
// // import Link from "next/link";
// // import { useForm } from "react-hook-form";
// // import { zodResolver } from "@hookform/resolvers/zod";
// // import { signIn } from "next-auth/react";
// // import toast from "react-hot-toast";
// // import AuthCard from "@/components/AuthCard";
// // import GoogleButton from "@/components/GoogleButton";
// // import { loginSchema, type LoginInput } from "@/lib/validations";

// // export default function LoginPage() {
// //   const router = useRouter();
// //   const [submitting, setSubmitting] = useState(false);

// //   const {
// //     register,
// //     handleSubmit,
// //     formState: { errors },
// //   } = useForm<LoginInput>({
// //     resolver: zodResolver(loginSchema),
// //   });

// //   const onSubmit = async (data: LoginInput) => {
// //     setSubmitting(true);
// //     try {
// //       const result = await signIn("credentials", {
// //         identifier: data.identifier,
// //         password: data.password,
// //         redirect: false,
// //       });

// //       if (result?.error) {
// //         toast.error(result.error);
// //         setSubmitting(false);
// //         return;
// //       }

// //       toast.success("Welcome back!");
// //       router.push("/");
// //       router.refresh();
// //     } catch {
// //       toast.error("Something went wrong. Please try again.");
// //       setSubmitting(false);
// //     }
// //   };

// //   return (
// //     <AuthCard
// //       eyebrow="Welcome back"
// //       title="Log in to your account"
// //       footer={
// //         <>
// //           Don&apos;t have an account?{" "}
// //           <Link href="/register" className="text-amber-500 hover:text-amber-400 font-medium">
// //             Sign up
// //           </Link>
// //         </>
// //       }
// //     >
// //       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
// //         <div>
// //           <label htmlFor="identifier" className="block text-sm text-stone-300 mb-1.5">
// //             Email or mobile number
// //           </label>
// //           <input
// //             id="identifier"
// //             type="text"
// //             autoComplete="username"
// //             {...register("identifier")}
// //             className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
// //             placeholder="you@example.com"
// //           />
// //           {errors.identifier && (
// //             <p className="text-red-400 text-xs mt-1.5">{errors.identifier.message}</p>
// //           )}
// //         </div>

// //         <div>
// //           <div className="flex items-center justify-between mb-1.5">
// //             <label htmlFor="password" className="block text-sm text-stone-300">
// //               Password
// //             </label>
// //             <Link
// //               href="/forgot-password"
// //               className="text-xs text-amber-500 hover:text-amber-400"
// //             >
// //               Forgot password?
// //             </Link>
// //           </div>
// //           <input
// //             id="password"
// //             type="password"
// //             autoComplete="current-password"
// //             {...register("password")}
// //             className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
// //             placeholder="••••••••"
// //           />
// //           {errors.password && (
// //             <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
// //           )}
// //         </div>

// //         <button
// //           type="submit"
// //           disabled={submitting}
// //           className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-stone-950 font-semibold py-2.5 rounded-lg transition"
// //         >
// //           {submitting ? "Logging in…" : "Log in"}
// //         </button>
// //       </form>

// //       <div className="flex items-center gap-3 my-6">
// //         <div className="h-px flex-1 bg-stone-800" />
// //         <span className="text-xs text-stone-500 uppercase tracking-wide">or</span>
// //         <div className="h-px flex-1 bg-stone-800" />
// //       </div>

// //       <GoogleButton />
// //     </AuthCard>
// //   );
// // }



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
// import { loginSchema, type LoginInput } from "@/lib/validations";

// export default function LoginPage() {
//   const router = useRouter();
//   const [submitting, setSubmitting] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

//   const onSubmit = async (data: LoginInput) => {
//     setSubmitting(true);
//     try {
//       const result = await signIn("credentials", {
//         identifier: data.identifier,
//         password: data.password,
//         redirect: false,
//       });

//       // Detect our special OTP_REQUIRED signal
//       if (result?.error?.startsWith("OTP_REQUIRED:")) {
//         const email = result.error.split("OTP_REQUIRED:")[1];
//         toast.success("OTP sent to your email!");
//         router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
//         return;
//       }

//       if (result?.error) {
//         toast.error(result.error);
//         setSubmitting(false);
//         return;
//       }

//       toast.success("Welcome back!");
//       router.push("/");
//       router.refresh();
//     } catch {
//       toast.error("Something went wrong. Please try again.");
//       setSubmitting(false);
//     }
//   };

//   return (
//     <AuthCard
//       eyebrow="Welcome back"
//       title="Log in to your account"
//       footer={
//         <>
//           Don&apos;t have an account?{" "}
//           <Link href="/register" className="text-amber-500 hover:text-amber-400 font-medium">
//             Sign up
//           </Link>
//         </>
//       }
//     >
//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <div>
//           <label htmlFor="identifier" className="block text-sm text-stone-300 mb-1.5">
//             Email or mobile number
//           </label>
//           <input
//             id="identifier"
//             type="text"
//             autoComplete="username"
//             {...register("identifier")}
//             className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
//             placeholder="you@example.com"
//           />
//           {errors.identifier && (
//             <p className="text-red-400 text-xs mt-1.5">{errors.identifier.message}</p>
//           )}
//         </div>

//         <div>
//           <div className="flex items-center justify-between mb-1.5">
//             <label htmlFor="password" className="block text-sm text-stone-300">
//               Password
//             </label>
//             <Link href="/forgot-password" className="text-xs text-amber-500 hover:text-amber-400">
//               Forgot password?
//             </Link>
//           </div>
//           <input
//             id="password"
//             type="password"
//             autoComplete="current-password"
//             {...register("password")}
//             className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
//             placeholder="••••••••"
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
//           {submitting ? "Checking…" : "Continue"}
//         </button>
//       </form>

//       <div className="flex items-center gap-3 my-6">
//         <div className="h-px flex-1 bg-stone-800" />
//         <span className="text-xs text-stone-500 uppercase tracking-wide">or</span>
//         <div className="h-px flex-1 bg-stone-800" />
//       </div>

//       <GoogleButton />
//     </AuthCard>
//   );
// }





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

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    try {
      // Step 1: Validate credentials + send OTP via our own API route.
      // We do NOT call signIn() here because NextAuth v4 swallows custom
      // error messages and we can't pass the email back to the client.
      const res = await fetch("/api/auth/check-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      // Step 2: Credentials valid, OTP sent — redirect to verify page
      toast.success("OTP sent to your email!");
      router.push(`/verify-otp?email=${encodeURIComponent(result.email)}`);

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
          <Link href="/register" className="text-amber-500 hover:text-amber-400 font-medium">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="block text-sm text-stone-300 mb-1.5">
            Email or mobile number
          </label>
          <input
            id="identifier"
            type="text"
            autoComplete="username"
            {...register("identifier")}
            className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
            placeholder="you@example.com"
          />
          {errors.identifier && (
            <p className="text-red-400 text-xs mt-1.5">{errors.identifier.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm text-stone-300">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-amber-500 hover:text-amber-400">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 outline-none rounded-lg px-3.5 py-2.5 text-stone-50 placeholder:text-stone-600 transition"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-stone-950 font-semibold py-2.5 rounded-lg transition"
        >
          {submitting ? "Sending OTP…" : "Continue"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-stone-800" />
        <span className="text-xs text-stone-500 uppercase tracking-wide">or</span>
        <div className="h-px flex-1 bg-stone-800" />
      </div>

      <GoogleButton />
    </AuthCard>
  );
}


