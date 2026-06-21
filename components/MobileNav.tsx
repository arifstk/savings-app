// components/MobileNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Logo from "./Logo";

const MobileNav = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const role = session?.user?.role ?? null;

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Helper styles to keep code DRY
  const linkStyles = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
      ? "bg-indigo-50 text-indigo-600 font-semibold"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
    }`;

  return (
    <>
      {/* ── Hamburger button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 group z-50 relative"
        aria-label="Toggle menu"
      >
        <span className={`block h-0.5 bg-slate-800 transition-all duration-300 ease-in-out ${open ? "w-5 rotate-45 translate-y-2" : "w-5"}`} />
        <span className={`block h-0.5 bg-slate-800 transition-all duration-300 ease-in-out ${open ? "w-0 opacity-0" : "w-4"}`} />
        <span className={`block h-0.5 bg-slate-800 transition-all duration-300 ease-in-out ${open ? "w-5 -rotate-45 -translate-y-2" : "w-5"}`} />
      </button>

      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* ── Sidebar ── */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 w-72 h-screen bg-white shadow-2xl border-r border-slate-100/80 z-50 md:hidden flex flex-col pt-6 transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div>
          <div className="px-4"><Logo /></div>
          <div><X className="absolute top-4 right-4 cursor-pointer" onClick={() => setOpen(false)} /></div>
        </div>

        {/* Nav links — dynamically scrollable */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">

          {/* General Links */}
          <Link
            href="/"
            className={linkStyles(pathname === "/")}
          >
            Home
          </Link>

          {(role === "user" || role === "admin") && (
            <Link
              href="/my-subscription"
              className={linkStyles(pathname === "/my-subscription")}
            >
              Subscriptions
            </Link>
          )}

          {(role === "user" || role === "admin") && (
            <Link
              href="/members"
              className={linkStyles(pathname === "/members")}
            >
              Our Members
            </Link>
          )}

          <Link
            href="/about"
            className={linkStyles(pathname === "/about")}
          >
            About
          </Link>

          <Link
            href="/contact"
            className={linkStyles(pathname === "/contact")}
          >
            Contact
          </Link>

          {/* Account section — always shown when logged in */}
          {session?.user && (
            <>
              <div className="border-t border-slate-100 my-4" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider px-3 pb-2">Account</p>

              <Link
                href="/profile"
                className={linkStyles(pathname === "/profile")}
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                My Profile
              </Link>

              {/* {role === "user" && (
                <Link
                  href="/user-dashboard"
                  className={linkStyles(pathname === "/user-dashboard")}
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                  </svg>
                  User Dashboard
                </Link>
              )} */}

              {role === "admin" && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${pathname === "/admin"
                    ? "bg-violet-100 text-violet-700 font-semibold"
                    : "text-violet-600 hover:text-violet-900 hover:bg-violet-50"
                    }`}
                >
                  <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  Admin Dashboard
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Sign out — Anchored to bottom footer */}
        {/* {session?.user && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/40 shrink-0">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100/80 transition-all duration-150 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sign Out
            </button>
          </div>
        )} */}
      </div>
    </>
  );
};

export default MobileNav;

