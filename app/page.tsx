// app/page.tsx

import { auth } from "@/lib/auth";
import Banner from "@/components/Banner";
import PublicBanner from "@/components/PublicBanner";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex-1 flex flex-col pt-3">

      {/* Banner - fully controlled by admin */}
      <Banner />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center mt-10">
        <div className="max-w-xl text-center">
          {!session ? (
            <>
              <PublicBanner />
            </>
          )
            : (
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
