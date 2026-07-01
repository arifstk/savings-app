"use client";

import { useEffect, useState } from "react";
import { Tiro_Bangla } from "next/font/google";

const banglaFont = Tiro_Bangla({
  subsets: ["bengali"],
  weight: ["400"],
});

interface BannerData {
  enabled: boolean;
  h1: string;
  h2: string;
  p: string;
}

const isBangla = (text: string) => /[\u0980-\u09FF]/.test(text);

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
    <div className="w-full min-h-[60vh] bg-linear-to-r from-teal-500 to-cyan-500 px-6 py-10 text-center items-center rounded-xl">
      <div className="max-w-3xl mx-auto">
        {banner.h1 && (
          <h1
            className={`text-3xl sm:text-5xl font-bold mb-2 text-white text-shadow-gray-700 ${isBangla(banner.h1) ? banglaFont.className : ""
              }`}
          >
            {banner.h1}
          </h1>
        )}
        {banner.h2 && (
          <h2
            className={`text-xl sm:text-3xl font-semibold text-white text-shadow-gray-700 mb-3 ${isBangla(banner.h2) ? banglaFont.className : ""
              }`}
          >
            {banner.h2}
          </h2>
        )}
        {banner.p && (
          <p
            className={`mx-auto max-w-xl text-base text-white text-shadow-gray-700 ${isBangla(banner.p) ? banglaFont.className : ""
              }`}
          >
            {banner.p}
          </p>
        )}
      </div>
    </div>
  );
}
