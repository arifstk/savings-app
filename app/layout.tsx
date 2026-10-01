// import type { Metadata } from "next";
// import "./globals.css";
// import Header from "@/components/Header";
// import Providers from "@/components/Providers";
// import Footer from "@/components/Footer";
// // import Providers from "@/components/Providers";
// // import HeaderWrapper from "@/components/HeaderWrapper";
// // import { Toaster } from "react-hot-toast";
// // import Footer from "@/components/Footer";
// // import { authOptions } from "./api/auth/[...nextauth]/route";
// // import { getServerSession } from "next-auth";

// export const metadata: Metadata = {
//   title: "Taqwa Savings",
//   description: "Savings App for money",
// };

// export default async function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {

//   return (
//     <html
//       lang="en"
//       className="h-full antialiased font-poppins"
//     >
//       <body className="min-h-full flex flex-col">
//         <Providers>
//           <Header />
//           <main className='w-[95%] md:w-[90%] mx-auto min-h-screen'>
//             {children}
//           </main>
//           <Footer />
//         </Providers>
//       </body>
//     </html>
//   );
// }



// // bg-linear-to-r from-teal-500 to-cyan-500 
// // bg-linear-to-r hover:bg-from-teal-600 hover:bg-to-cyan-600



// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import Footer from "@/components/Footer";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GAPageTracker from "@/components/GAPageTracker";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { Suspense } from "react";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Taqwa Savings",
    "Savings App",
    "Money Management",
    "Islamic Savings",
  ],
  authors: [{ name: SITE_NAME }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
        type: 'image/png',
      },
      {
        url: `${SITE_URL}/og-image.png`,
        width: 800,
        height: 420,
        alt: SITE_NAME,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  verification: {
    google: 'FcspxoAHI7m6K2Oa7Smzvfgn-j2Bek36aDnLVf3exF8',
  },
  other: {
    'og:locale': 'en_US',
    'pinterest': 'nopin',
    'format-detection': 'telephone=no',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-poppins"
    >
      <head>
        {/* Pinterest & Extra Meta Tags */}
        <meta name="pinterest-rich-pin" content="true" />
        <meta property="og:updated_time" content={new Date().toISOString()} />
        <meta name="image" content={`${SITE_URL}/og-image.png`} />
        <meta name="google-site-verification" content="FcspxoAHI7m6K2Oa7Smzvfgn-j2Bek36aDnLVf3exF8" />
      </head>

      <body className="min-h-full flex flex-col">
        <CookieConsentProvider>
          <Providers>
            <Header />
            <main className='w-[95%] md:w-[90%] mx-auto min-h-screen'>
              {children}
            </main>
            <Footer />
            <GoogleAnalytics />
            <Suspense fallback={null}>
              <GAPageTracker />
            </Suspense>
            <CookieConsentBanner />
          </Providers>
        </CookieConsentProvider>
      </body>
    </html>
  );
}

