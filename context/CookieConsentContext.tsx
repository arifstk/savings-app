// context/CookieConsentContext.tsx

"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ConsentStatus = "pending" | "accepted" | "rejected";

interface WindowWithGtag extends Window {
  gtag?: (...args: unknown[]) => void;
}

interface CookieConsentContextType {
  status: ConsentStatus;
  accept: () => void;
  reject: () => void;
  setCookie: (name: string, value: string, days?: number) => void;
  getCookie: (name: string) => string | null;
  removeCookie: (name: string) => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const STORAGE_KEY = "cookie_consent";

const updateGoogleConsent = (granted: boolean) => {
  if (typeof window !== "undefined") {
    const customWindow = window as WindowWithGtag;
    if (typeof customWindow.gtag === "function") {
      customWindow.gtag("consent", "update", {
        analytics_storage: granted ? "granted" : "denied",
        ad_storage: granted ? "granted" : "denied",
        ad_user_data: granted ? "granted" : "denied",
        ad_personalization: granted ? "granted" : "denied",
      });
    }
  }
};

const setHttpCookie = (name: string, value: string, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
};

const getHttpCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

const deleteHttpCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
};

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConsentStatus>(() => {
    if (typeof window === "undefined") return "pending";
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentStatus | null;
    return stored === "accepted" || stored === "rejected" ? stored : "pending";
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentStatus | null;
    if (stored === "accepted") {
      updateGoogleConsent(true);
    } else if (stored === "rejected") {
      updateGoogleConsent(false);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setHttpCookie("user_consent", "accepted", 365);
    updateGoogleConsent(true);
    setStatus("accepted");
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, "rejected");
    deleteHttpCookie("user_consent");
    updateGoogleConsent(false);
    setStatus("rejected");
  };

  const setCookie = (name: string, value: string, days = 30) => {
    if (status === "accepted") {
      setHttpCookie(name, value, days);
    }
  };

  const getCookie = (name: string) => getHttpCookie(name);
  const removeCookie = (name: string) => deleteHttpCookie(name);

  return (
    <CookieConsentContext.Provider
      value={{ status, accept, reject, setCookie, getCookie, removeCookie }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}

