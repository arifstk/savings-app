// components/CookieConsentBanner.tsx

"use client";
import { useEffect, useState } from "react";
import { useCookieConsent } from "@/context/CookieConsentContext";
import { Cookie } from "lucide-react";

const DELAY_MS = 4000;

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-teal-800/90 text-white animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-3 flex flex-row items-center justify-between gap-1 sm:gap-3">
        <p className="flex sm:items-center gap-2 text-xs sm:text-sm md:text-md text-neutral-200">
          <Cookie size={18} />  <span>This site uses cookies to personalize your experience.</span>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={accept}
            className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-xl bg-white text-neutral-900 hover:bg-neutral-200 transform transition duration-300 ease-in-out cursor-pointer font-medium"
          >
            Accept
          </button>
          <button
            onClick={reject}
            className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-xl border border-neutral-400 hover:bg-teal-900 transform transition duration-300 ease-in-out cursor-pointer"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

