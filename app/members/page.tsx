// pages/members/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { Phone } from "lucide-react";

interface Member {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  image?: string;
  role: "admin" | "user";
  provider: string;
  createdAt: string;
}

export default function OurMembersPage() {
  const { status } = useSession();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setMembers(data.members);
    } catch { toast.error("Failed to load members"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      load();
    }
  }, [status, load]);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.mobile ?? "").includes(search)
  );

  if (status === "loading") return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Community Members</h1>
          <p className="text-gray-500 text-sm mt-2">
            {members.length} member{members.length !== 1 ? "s" : ""} in our community
          </p>
        </div>

        {/* Search */}
        <div className="mb-10 flex justify-center">
          <div className="relative w-full max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or mobile…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white shadow-xs"
            />
          </div>
        </div>

        {/* Loading / Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {search ? "No members match your search." : "No members found."}
          </div>
        ) : (
          /* 2 Cards per row on large screens */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((member, idx) => (
              <MemberCard key={member._id} member={member} index={idx} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function MemberCard({ member, index }: { member: Member; index: number }) {
  const hasImage = !!member.image && member.image.trim() !== "";
  const initial = member.name.charAt(0).toUpperCase();

  const avatarColors = [
    "from-teal-600 to-emerald-800",
    "from-blue-600 to-indigo-800",
    "from-cyan-600 to-teal-800",
    "from-sky-600 to-blue-800",
    "from-rose-600 to-pink-800",
    "from-amber-600 to-orange-800",
  ];
  const gradientColor = avatarColors[index % avatarColors.length];

  const formattedDate = new Date(member.createdAt).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/80 pr-2.5 sm:pr-6 flex flex-row items-center gap-2 sm:gap-6">

      {/* Left side: Theme Gradient Block with Overlapping Circular Avatar */}
      <div className="relative w-20 sm:w-32 h-40 sm:h-48 bg-linear-to-br from-cyan-500 to-teal-600 rounded-tl-2xl rounded-bl-2xl flex items-center justify-center overflow-visible shrink-0 shadow-inner">
        {/* Decorative background blur */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        {/* Overlapping Circular Avatar */}
        <div className="absolute -right-4 sm:-right-10 w-20 sm:w-30 h-20 sm:h-30 rounded-full p-0.5 sm:p-1 bg-white shadow-2xl z-20">
          <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100">
            {hasImage ? (
              <Image
                src={member.image!}
                alt={member.name}
                fill
                quality={100}
                unoptimized={true}
                sizes="200px"
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                style={{ imageRendering: "auto" }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-full h-full bg-linear-to-br ${gradientColor} flex items-center justify-center`}>
                <span className="text-white text-3xl sm:text-4xl font-black">{initial}</span>
              </div>
            )}
          </div>

          {/* Admin Star Badge on top right of the avatar */}
          {member.role === "admin" && (
            <div className="absolute top-0 right-0 sm:top-1 sm:right-1 w-7 h-7 bg-amber-400 border border-white rounded-full flex items-center justify-center shadow-md z-30">
              <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Right side: User details & actions */}
      <div className="flex-1 flex flex-col justify-between w-full space-y-3 sm:space-y-4 pl-4 sm:pl-8 py-2">

        {/* Top badges row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${member.role === "admin"
            ? "bg-amber-100 text-amber-800 border border-amber-200"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}>
            {member.role === "admin" ? "✦ Admin" : "Active"}
          </span>

          <span className="text-[11px] sm:text-xs font-medium text-gray-500 bg-gray-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
            {formattedDate}
          </span>
        </div>

        {/* Name & Email */}
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
              {member.name}
            </h3>
            {member.role === "admin" && (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
            {member.email}
          </p>
        </div>

        {/* Contact Info & Actions */}
        <div className="sm:pt-3 flex items-center justify-between flex-wrap gap-2 border-t border-gray-100">
          <div className="flex items-center truncate">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1.1 1.1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-gray-500 truncate">
              {member.mobile || <span className="text-gray-400 font-normal italic">Not Provided yet</span>}
            </span>
          </div>

          {member.mobile && (() => {
            const cleaned = member.mobile.replace(/\D/g, "");
            const formattedWhatsAppNumber = cleaned.startsWith("0")
              ? `880${cleaned.slice(1)}`
              : cleaned;

            return (
              <div className="flex items-center shrink-0">
                {/* Call Button */}
                <a
                  href={`tel:${member.mobile}`}
                  className="inline-flex items-center justify-center px-4 py-1.5 text-teal-700 hover:text-teal-900 font-semibold transition-all duration-200"
                >
                  <Phone size={17} />
                </a>
                {/* WhatsApp Button */}
                <a
                  href={`https://wa.me/${formattedWhatsAppNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-1 py-1 sm:px-3 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full shadow-sm transition-all duration-200"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </a>
              </div>
            );
          })()}
        </div>

      </div>

    </div>
  );
}
