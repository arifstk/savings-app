"use client";

import { useEffect } from "react";

export default function UserPrintLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.setAttribute("data-page", "print");
    return () => document.body.removeAttribute("data-page");
  }, []);
  return <>{children}</>;
}
