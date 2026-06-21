// components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import MobileNav from "./MobileNav";
import Logo from "./Logo";

const Header = () => {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // True only when image is a real non-empty URL
  const hasImage = !!session?.user?.image && session.user.image.trim() !== "";

  // First letter of name for fallback avatar
  const initial = session?.user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="top-0 left-0 w-full sticky z-500 flex items-center justify-between border-b bg-white border-gray-300 shadow-lg py-1">
      <div className="w-[95%] md:w-[90%] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MobileNav />
          {/* Logo */}
          <Logo />
        </div>

        {/* Links */}
        <div>All Links Go Here</div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Admin badge (desktop only) */}
          {session?.user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-700 text-xs font-semibold hover:bg-violet-600/30 transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              Dashboard
            </Link>
          )}
          <div className="relative" ref={dropdownRef}>

            {/* Loading skeleton */}
            {status === "loading" && (
              <div className="h-9 w-24 rounded-full bg-gray-200 animate-pulse" />
            )}

            {/* Not logged in */}
            {status === "unauthenticated" && (
              <Link href="/login">
                <button className="bg-black text-white py-1.5 px-4 rounded-lg cursor-pointer">
                  Login
                </button>
              </Link>
            )}

            {/* Logged in */}
            {status === "authenticated" && session?.user && (
              <>
                <button
                  onClick={() => setOpen((prev) => !prev)}
                  className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
                >
                  {/* Avatar — Google image OR initial letter fallback */}
                  {hasImage ? (
                    <Image
                      src={session.user.image!}
                      alt={session.user.name ?? "User"}
                      width={36}
                      height={36}
                      className="rounded-full object-cover border border-gray-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                      {initial}
                    </div>
                  )}

                  {/* Name */}
                  <span className="text-sm font-medium hidden sm:inline">
                    {session.user.name}
                  </span>

                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {open && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">

                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      {/* Mini avatar in dropdown too */}
                      {hasImage ? (
                        <Image
                          src={session.user.image!}
                          alt={session.user.name ?? "User"}
                          width={32}
                          height={32}
                          className="rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                        <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${session.user.role === "admin"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                          }`}>
                          {session.user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </Link>

                      {session.user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 transition"
                        >
                          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

