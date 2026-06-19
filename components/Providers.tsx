"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1c1917",
            color: "#fafaf9",
            border: "1px solid #292524",
          },
        }}
      />
    </SessionProvider>
  );
}
