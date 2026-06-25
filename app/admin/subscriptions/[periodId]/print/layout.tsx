// app/admin/subscriptions/[periodId]/print/layout.tsx

"use client";

import { useEffect } from "react";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Mark body so global CSS can hide navbar/sidebar
    document.body.setAttribute("data-page", "print");
    return () => document.body.removeAttribute("data-page");
  }, []);

  return <>{children}</>;
}
