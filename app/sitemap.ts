// app/sitemap.ts

import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { url: "", priority: 1.0, changeFrequency: "daily" as const },
    { url: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    // { url: "/login", priority: 0.5, changeFrequency: "monthly" as const },
    // { url: "/register", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" as const },
    { url: "/terms-and-conditions", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const currentDate = new Date();

  return routes.map((route) => ({
    url: `${SITE_URL}${route.url}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    images: route.url === "" ? [`${SITE_URL}/og-image.jpg`] : undefined,
  }));
}

