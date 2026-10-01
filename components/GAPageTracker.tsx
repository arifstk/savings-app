// components/GAPageTracker.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const GA_MEASUREMENT_ID = "G-7YV7GJ4BEG";

interface WindowWithGtag extends Window {
  gtag?: (...args: unknown[]) => void;
}

export default function GAPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    const customWindow = window as WindowWithGtag;
    if (typeof window !== "undefined" && typeof customWindow.gtag === "function") {
      customWindow.gtag("config", GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

