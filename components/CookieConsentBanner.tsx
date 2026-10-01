// components/CookieConsentBanner.tsx

"use client";
import { useEffect, useState } from "react";
import { useCookieConsent } from "@/context/CookieConsentContext";
import { Cookie, ShieldCheck } from "lucide-react";

const DELAY_MS = 3000;

export default function CookieConsentBanner() {
  const { status, accept, reject } = useCookieConsent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== "pending") return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [status]);

  if (status !== "pending" || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 p-5 text-white shadow-2xl ring-1 ring-white/10">

        {/* Subtle decorative background glow */}
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Cookie size={20} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide text-neutral-100 flex items-center gap-1.5">
                Cookie Preferences <ShieldCheck size={14} className="text-teal-400" />
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. Read our{" "}
              <a href="/privacy-policy" className="text-teal-400 underline underline-offset-2 hover:text-teal-300 transition-colors">
                Privacy Policy
              </a>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2.5 pt-2 border-t border-neutral-800/80">
          <button
            onClick={accept}
            className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-500 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Accept All
          </button>
          <button
            onClick={reject}
            className="flex-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-2 text-xs font-medium text-neutral-300 transition-all duration-200 active:scale-95 cursor-pointer border border-neutral-700/50"
          >
            Reject Optional
          </button>
        </div>
      </div>
    </div>
  );
}

