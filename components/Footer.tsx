'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  // const { data: session } = useSession();
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  // Hide header on print pages
  if (pathname.endsWith("/print")) return null;

  return (
    <footer className="bg-white text-zinc-900 pt-10">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-zinc-400">
          &copy; {currentYear} Taqwa Savings. All rights reserved.
        </p>

        <div className="text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-600 transition-colors">Home</Link>
          <span className='text-zinc-200'> | </span>
          <Link href="/about" className="hover:text-zinc-600 transition-colors">About</Link>
          <span className='text-zinc-200'> | </span>
          <Link href="/contact" className="hover:text-zinc-600 transition-colors">Contact</Link>
          <span className='text-zinc-200'> | </span>
          <Link href="/privacy-policy" className="hover:text-zinc-600 transition-colors">Privacy Policy</Link>
          <span className='text-zinc-200'> | </span>
          <Link href="/terms-and-conditions" className="hover:text-zinc-600 transition-colors">Terms of Service</Link>
        </div>

        <div className="flex flex-col gap-0 text-xs text-zinc-400">
          <p className='tracking-tighter'>developed by: <Link href="https://github.com/rashedjamanraj" className="hover:text-zinc-600 transition-colors">Rashedujjaman (frontend)</Link>
            <span className='text-zinc-200'> | </span>
            <Link href="https://arif-portfolio-eosin.vercel.app/" className="hover:text-zinc-600 transition-colors">arif (backend)</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

