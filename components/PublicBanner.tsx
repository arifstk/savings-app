// components/PublicBanner.tsx

'use client';
import { motion } from "motion/react";
import Link from "next/link";

const PublicBanner = () => {
  return (
    <div>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xs font-medium tracking-[0.2em] uppercase bg-linear-to-r from-teal-500 to-cyan-500 mb-4 py-0.5 rounded-full text-white animate-pulse"
      >
        Smart Financial Platform
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-display text-4xl sm:text-5xl mb-4 leading-tight"
      >
        Manage your financial<br />membership with confidence.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-stone-400 mb-8"
      >
        Access premium financial resources, exclusive member benefits, and
        subscription plans designed to support your financial journey.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex items-center justify-center gap-3"
      >
        <Link
          href="/register"
          className="bg-linear-to-r from-teal-500 to-cyan-500 text-white font-semibold px-6 py-2.5 rounded-full transition"
        >
          Become a Member
        </Link>

        <Link
          href="/login"
          className="border border-stone-700 hover:border-stone-500 px-6 py-2.5 rounded-full transition"
        >
          Member Login
        </Link>
      </motion.div>
    </div>
  )
}

export default PublicBanner
