// "use client";

// import { useEffect, useState } from "react";
// import { Tiro_Bangla } from "next/font/google";
// import { useSession } from "next-auth/react";

// const banglaFont = Tiro_Bangla({
//   subsets: ["bengali"],
//   weight: ["400"],
// });

// interface BannerData {
//   enabled: boolean;
//   h1: string;
//   h2: string;
//   p: string;
// }

// const isBangla = (text: string) => /[\u0980-\u09FF]/.test(text);

// export default function Banner() {
//   const [banner, setBanner] = useState<BannerData | null>(null);
//   const { data: session } = useSession();
//   const role = session?.user?.role ?? null;

//   useEffect(() => {
//     fetch("/api/admin/banner")
//       .then(r => r.json())
//       .then(d => setBanner(d.banner))
//       .catch(() => { });
//   }, []);

//   if (!banner || !banner.enabled) return null;
//   if (!banner.h1 && !banner.h2 && !banner.p) return null;

//   return (
//     <div>
//       {(role === "user" || role === "admin") && (
//         <div 
//           className="w-full min-h-[40vh] md:min-h-[60vh] px-6 py-16 text-center items-center rounded-2xl relative overflow-hidden border border-gray-100 bg-slate-50 shadow-xs group transition-all duration-300"
//           style={{
//             // Premium crisp light-colored corporate banking & financial high-rise building backdrop
//             backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80')`,
//             backgroundSize: 'cover',
//             backgroundPosition: 'center 35%'
//           }}
//         >
//           <div className="max-w-3xl mx-auto">
//             {banner.h1 && (
//               <h1
//                 className={`text-3xl sm:text-5xl font-bold mb-2 ${isBangla(banner.h1) ? banglaFont.className : ""
//                   }`}
//               >
//                 {banner.h1}
//               </h1>
//             )}
//             {banner.h2 && (
//               <h2
//                 className={`text-2xl sm:text-3xl font-semibold mb-3 ${isBangla(banner.h2) ? banglaFont.className : ""
//                   }`}
//               >
//                 {banner.h2}
//               </h2>
//             )}
//             {banner.p && (
//               <p
//                 className={`mx-auto max-w-xl text-xl ${isBangla(banner.p) ? banglaFont.className : ""
//                   }`}
//               >
//                 {banner.p}
//               </p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




// "use client";

// import { useEffect, useState } from "react";
// import { Tiro_Bangla } from "next/font/google";
// import { useSession } from "next-auth/react";

// const banglaFont = Tiro_Bangla({
//   subsets: ["bengali"],
//   weight: ["400"],
// });

// interface BannerData {
//   enabled: boolean;
//   h1: string;
//   h2: string;
//   p: string;
// }

// const isBangla = (text: string) => /[\u0980-\u09FF]/.test(text);

// export default function Banner() {
//   const [banner, setBanner] = useState<BannerData | null>(null);
//   const { data: session } = useSession();
//   const role = session?.user?.role ?? null;

//   useEffect(() => {
//     fetch("/api/admin/banner")
//       .then(r => r.json())
//       .then(d => setBanner(d.banner))
//       .catch(() => { });
//   }, []);

//   if (!banner || !banner.enabled) return null;
//   if (!banner.h1 && !banner.h2 && !banner.p) return null;

//   return (
//     <div>
//       {(role === "user" || role === "admin") && (
//         <div 
//           className="w-full min-h-[40vh] md:min-h-[60vh] px-6 py-16 text-center items-center rounded-2xl relative overflow-hidden border border-gray-100 bg-slate-50 shadow-xs group transition-all duration-300"
//           style={{
//             // High-quality light abstract financial geometric structure backdrop
//             backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80')`,
//             backgroundSize: 'cover',
//             backgroundPosition: 'center'
//           }}
//         >
//           {/* Crisp Premium Light Overlay Layer for Perfect Typography Contrast */}
//           <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-teal-50/50 backdrop-blur-xs" />
          
//           {/* Subtle Modern Decorative Radiant Ambient Orbs */}
//           <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl transition-all duration-700 group-hover:scale-110" />
//           <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl transition-all duration-700 group-hover:scale-110" />

//           {/* Core Content Box wrapper */}
//           <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center justify-center min-h-[30vh] md:min-h-[45vh]">
//             {banner.h1 && (
//               <h1
//                 className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-800 bg-clip-text text-transparent ${isBangla(banner.h1) ? banglaFont.className : ""
//                   }`}
//               >
//                 {banner.h1}
//               </h1>
//             )}
//             {banner.h2 && (
//               <div className="flex flex-col items-center gap-2.5 mb-4">
//                 {/* Modern clean balance accent divider */}
//                 <div className="w-10 h-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-xs" />
//                 <h2
//                   className={`text-lg sm:text-xl font-bold text-teal-600 tracking-wide uppercase ${isBangla(banner.h2) ? banglaFont.className : ""
//                     }`}
//                 >
//                   {banner.h2}
//                 </h2>
//               </div>
//             )}
//             {banner.p && (
//               <p
//                 className={`mx-auto max-w-xl text-base sm:text-lg text-slate-600 font-medium leading-relaxed ${isBangla(banner.p) ? banglaFont.className : ""
//                   }`}
//               >
//                 {banner.p}
//               </p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





"use client";

import { useEffect, useState } from "react";
import { Tiro_Bangla } from "next/font/google";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const role = session?.user?.role ?? null;

  useEffect(() => {
    fetch("/api/admin/banner")
      .then(r => r.json())
      .then(d => setBanner(d.banner))
      .catch(() => { });
  }, []);

  if (!banner || !banner.enabled) return null;
  if (!banner.h1 && !banner.h2 && !banner.p) return null;

  return (
    <div>
      {(role === "user" || role === "admin") && (
        <div 
          className="w-full min-h-[40vh] md:min-h-[80vh] px-6 py-16 text-center items-center rounded-2xl relative overflow-hidden border border-gray-100 bg-slate-50 shadow-xs group transition-all duration-300"
          style={{
            // Premium crisp light-colored corporate banking & financial high-rise building backdrop
            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%'
          }}
        >
          {/* Light High-Contrast Dynamic Overlay to maintain pristine text legibility */}
          <div className="absolute inset-0 bg-linear-to-b from-white/95 via-white/90 to-teal-50/40 backdrop-blur-[2px]" />
          
          {/* Subtle Modern Decorative Radiant Ambient Orbs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl transition-all duration-700 group-hover:scale-110" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl transition-all duration-700 group-hover:scale-110" />

          {/* Core Content Box wrapper */}
          <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center justify-center min-h-[30vh] md:min-h-[50vh]">
            {banner.h1 && (
              <h1
                className={`text-3xl sm:text-5xl font-extrabold tracking-tight pt-2 mb-3 bg-linear-to-r from-slate-900 via-teal-950 to-slate-800 bg-clip-text text-transparent ${isBangla(banner.h1) ? banglaFont.className : ""
                  }`}
              >
                {banner.h1}
              </h1>
            )}
            {banner.h2 && (
              <div className="flex flex-col items-center gap-2.5 mb-4">
                {/* Modern clean balance accent divider */}
                <div className="w-10 h-1 bg-linear-to-r from-teal-500 to-cyan-500 rounded-full shadow-xs" />
                <h2
                  className={`text-lg sm:text-xl font-bold text-teal-600 tracking-wide uppercase ${isBangla(banner.h2) ? banglaFont.className : ""
                    }`}
                >
                  {banner.h2}
                </h2>
              </div>
            )}
            {banner.p && (
              <p
                className={`mx-auto max-w-xl text-base sm:text-lg text-slate-600 font-medium leading-relaxed ${isBangla(banner.p) ? banglaFont.className : ""
                  }`}
              >
                {banner.p}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

