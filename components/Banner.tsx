"use client";

import { useEffect, useState } from "react";

interface BannerData {
  enabled: boolean;
  h1: string;
  h2: string;
  p: string;
}

export default function Banner() {
  const [banner, setBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    fetch("/api/admin/banner")
      .then(r => r.json())
      .then(d => setBanner(d.banner))
      .catch(() => { });
  }, []);

  if (!banner || !banner.enabled) return null;
  if (!banner.h1 && !banner.h2 && !banner.p) return null;

  return (
    <div className="w-full bg-teal-300 px-6 py-10 text-center">
      <div className="max-w-3xl mx-auto">
        {banner.h1 && (
          <h1 className="text-3xl sm:text-4xl font-bold text-teal-900 mb-2">
            {banner.h1}
          </h1>
        )}
        {banner.h2 && (
          <h2 className="text-xl sm:text-2xl font-semibold text-teal-800 mb-3">
            {banner.h2}
          </h2>
        )}
        {banner.p && (
          <p className="text-teal-900/80 text-base max-w-xl mx-auto">
            {banner.p}
          </p>
        )}
      </div>
    </div>
  );
}
