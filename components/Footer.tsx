'use client';
import Link from 'next/link';
import Logo from './Logo';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const role = session?.user?.role ?? null;

  // Helper styles to keep code DRY
  const linkStyles = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
      ? "bg-indigo-50 text-indigo-600 font-semibold"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
    }`;

  return (
    <footer className="bg-white text-zinc-900 border-t border-zinc-100">
      <div className="w-[96%] md:w-[90%] mx-auto px-3 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand Column */}
        <div className="space-y-4">
          <Logo />
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus, sint!</p>
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
              href="/my-subscriptions"
              className={linkStyles(pathname === "/my-subscriptions")}
            >
              Subscriptions
            </Link>
          )}

          {(role === "user" || role === "admin") && (
            <Link
              href="/our-members"
              className={linkStyles(pathname === "/our-members")}
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

      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto px-6 py-6 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-zinc-400">
          &copy; {currentYear} Tarnix. All rights reserved.
        </p>
        <div className="flex flex-col gap-0 text-xs text-zinc-400">
          <div>
            <Link href="/privacy" className="hover:text-zinc-600 transition-colors">Privacy Policy</Link>
            <span className='text-zinc-200'> | </span>
            <Link href="/terms" className="hover:text-zinc-600 transition-colors">Terms of Service</Link>
          </div>
          <p className='tracking-widest'>developed by: <Link href="https://arif-portfolio-eosin.vercel.app/" className="hover:text-zinc-600 transition-colors">arif hossain</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

