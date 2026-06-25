import { auth } from "@/lib/auth";
import Link from "next/link";
import Banner from "@/components/Banner";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex-1 flex flex-col pt-10">

      {/* Banner - fully controlled by admin */}
      <Banner />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center mt-10">
        <div className="max-w-xl text-center">
          {!session ? (
            <>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-amber-500 mb-4">
                Full-stack starter
              </p>
              <h1 className="font-display text-4xl sm:text-5xl mb-4 leading-tight">
                Build on a foundation<br />that already works.
              </h1>
              <p className="text-stone-400 mb-8">
                Next.js, MongoDB, NextAuth, and Cloudinary — wired together and ready to extend.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/register"
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-6 py-2.5 rounded-full transition">
                  Get started
                </Link>
                <Link href="/login"
                  className="border border-stone-700 hover:border-stone-500 px-6 py-2.5 rounded-full transition">
                  Log in
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-amber-500 mb-4">
                {session.user.role === "admin" ? "Administrator" : "Member"}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl mb-4">
                Welcome back, {session.user.name?.split(" ")[0]}.
              </h1>
              <p className="text-stone-400">
                You&apos;re signed in as {session.user.email}.
                {session.user.role === "admin" && " You have admin access to this site."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
