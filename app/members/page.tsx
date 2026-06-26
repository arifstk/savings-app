"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

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
    if (status === "authenticated") load();
  }, [status, load]);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.mobile ?? "").includes(search)
  );

  if (status === "loading") return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-5">
      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Our Members</h1>
          <p className="text-gray-500 text-sm mt-2">
            {members.length} member{members.length !== 1 ? "s" : ""} in our community
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-sm">
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
              className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {search ? "No members match your search." : "No members found."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
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

  // Cycle through a few teal/slate accent colors for initials avatars
  const colors = [
    "bg-teal-500", "bg-blue-500", "bg-indigo-500",
    "bg-emerald-500", "bg-cyan-500", "bg-violet-500",
  ];
  const color = colors[index % colors.length];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">

      {/* Card top accent strip */}
      <div className="h-3 bg-linear-to-r from-teal-500 to-cyan-500" />
      <div className="px-5 py-6 flex flex-col items-center text-center">

        {/* Avatar */}
        <div className="relative mb-4">
          {hasImage ? (
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
              <Image
                src={member.image!}
                alt={member.name}
                width={80}
                height={80}
                className="object-cover w-full h-full"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className={`w-20 h-20 rounded-full ${color} flex items-center justify-center border-4 border-white shadow-md`}>
              <span className="text-white text-2xl font-bold">{initial}</span>
            </div>
          )}

          {/* Admin crown badge */}
          {member.role === "admin" && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-sm"
              title="Admin">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}
        </div>

        {/* Name & Role */}
        <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">
          {member.name}
        </h3>
        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-4 ${member.role === "admin"
          ? "bg-amber-100 text-amber-700"
          : "bg-teal-100 text-teal-700"
          }`}>
          {member.role === "admin" ? "Admin" : "Member"}
        </span>

        {/* Divider */}
        <div className="w-full border-t border-gray-100 mb-4" />

        {/* Contact info */}
        <div className="w-full space-y-2.5 text-left">
          {/* Email */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs text-gray-600 truncate">{member.email}</span>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <span className="text-xs text-gray-600">
              {member.mobile || <span className="text-gray-300">Not provided</span>}
            </span>
          </div>
        </div>

        {/* Member since */}
        <p className="text-xs text-gray-300 mt-4">
          Member since {new Date(member.createdAt).toLocaleDateString("en-GB", {
            month: "short", year: "numeric"
          })}
        </p>
      </div>
    </div>
  );
}

