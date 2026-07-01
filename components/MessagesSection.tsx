// components/MessagesSection.tsx

"use client";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────
interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  repliedAt?: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl bg-white shadow-sm border border-slate-200/80 ${className}`}
  >
    {children}
  </div>
);

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200/60 rounded-xl ${className}`} />
);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

// ─── Subject badge colors (Light Theme) ────────────────────────
const subjectColors: Record<string, string> = {
  "Order Issue": "bg-rose-50 text-rose-700 border-rose-200",
  "Product Question": "bg-sky-50 text-sky-700 border-sky-200",
  "Return & Refund": "bg-amber-50 text-amber-700 border-amber-200",
  "Technical Support": "bg-violet-50 text-violet-700 border-violet-200",
  "Partnership": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Feedback": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "General Inquiry": "bg-slate-50 text-slate-700 border-slate-200",
  "Other": "bg-slate-50 text-slate-700 border-slate-200",
};

// ═══════════════════════════════════════════════════════════════
export default function MessagesSection() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch ──
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  // ── Mark as read ──
  const markRead = async (id: string) => {
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
    setMessages((prev) =>
      prev.map((m) => (m._id === id ? { ...m, read: true } : m))
    );
    if (selected?._id === id) setSelected((p) => p ? { ...p, read: true } : p);
  };

  // ── Mark replied ──
  const markReplied = async (id: string) => {
    const repliedAt = new Date().toISOString();
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true, repliedAt }),
    });
    setMessages((prev) =>
      prev.map((m) => (m._id === id ? { ...m, read: true, repliedAt } : m))
    );
    if (selected?._id === id) {
      setSelected((p) => p ? { ...p, read: true, repliedAt } : p);
    }
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    const ok = window.confirm("Delete this message?");
    if (!ok) return;
    setDeletingId(id);
    try {
      await fetch("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setMessages((prev) => prev.filter((m) => m._id !== id));
      if (selected?._id === id) setSelected(null);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Open message (auto mark read) ──
  const handleOpen = async (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.read) await markRead(msg._id);
  };

  // ── Build mailto link ──
  const buildMailto = (msg: ContactMessage) => {
    const subject = encodeURIComponent(`Re: ${msg.subject} — Taqwa Savings Support`);
    const body = encodeURIComponent(
      `Hi ${msg.name},\n\nThank you for reaching out to us!\n\n` +
      `Regarding your message:\n"${msg.message}"\n\n` +
      `[Our reply here]\n\n` +
      `Best regards,\nTaqwa Savings Support Team`
    );
    return `mailto:${msg.email}?subject=${subject}&body=${body}`;
  };

  // ── Filter ──
  const filtered = messages.filter((m) => {
    const matchFilter =
      filter === "all" ? true : filter === "unread" ? !m.read : m.read;
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="max-w-7xl space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Messages</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? "Loading…" : `${messages.length} total · `}
            {!loading && unreadCount > 0 && (
              <span className="text-indigo-600 font-semibold">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchMessages}
          className="text-xs text-slate-700 hover:bg-slate-100 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 transition-all font-semibold shadow-xs"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Filter tabs + search ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200/60">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === f
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              {f} {f === "unread" && unreadCount > 0 && `(${unreadCount})`}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full pl-8 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs transition-all"
          />
        </div>
      </div>

      {/* ── Split view: list + detail ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-125">

        {/* ── Message List ── */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden p-0 h-full">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-slate-400 text-sm font-semibold">
                  {search ? "No messages match" : "No messages yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-150">
                {filtered.map((msg) => (
                  <button
                    key={msg._id}
                    onClick={() => handleOpen(msg)}
                    className={`w-full text-left px-4 py-4 transition-all hover:bg-slate-50/50 ${selected?._id === msg._id ? "bg-indigo-50/60 border-r-2 border-r-indigo-500" : ""
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Unread dot */}
                        {!msg.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                        <p className={`text-sm truncate ${!msg.read ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                          {msg.name}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>

                    {/* Subject badge */}
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1.5 ${subjectColors[msg.subject] || "bg-slate-50 text-slate-700 border-slate-200"
                      }`}>
                      {msg.subject}
                    </span>

                    {/* Message preview */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {msg.message}
                    </p>

                    {/* Replied badge */}
                    {msg.repliedAt && (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        ✓ Replied
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Message Detail ── */}
        <div className="lg:col-span-3">
          <Card className="p-0 h-full">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                <div className="text-5xl mb-4">📩</div>
                <p className="text-slate-400 text-sm font-semibold">
                  Select a message to read
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Click any message from the list
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full">

                {/* Detail header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${subjectColors[selected.subject] || "bg-slate-50 text-slate-700 border-slate-200"
                        }`}>
                        {selected.subject}
                      </span>
                      {selected.repliedAt && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          ✓ Replied
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900">
                      {selected.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(selected.createdAt)} at {formatTime(selected.createdAt)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(selected._id)}
                    disabled={deletingId === selected._id}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition-all disabled:opacity-40"
                  >
                    {deletingId === selected._id ? "…" : "🗑 Delete"}
                  </button>
                </div>

                {/* Sender info */}
                <div className="px-6 py-4 border-b border-slate-100/60">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-black text-white shrink-0 shadow-xs">
                      {selected.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selected.name}</p>
                      <a
                        href={buildMailto(selected)}
                        onClick={() => markReplied(selected._id)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-2 transition-colors font-semibold"
                      >
                        {selected.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Message body */}
                <div className="px-6 py-5 flex-1 overflow-y-auto">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap gap-3">
                  <a
                    href={buildMailto(selected)}
                    onClick={() => markReplied(selected._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Reply via Email
                  </a>

                  {/* Copy email */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selected.email);
                      alert(`Copied: ${selected.email}`);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold transition-all shadow-xs"
                  >
                    📋 Copy Email
                  </button>

                  {/* Mark unread */}
                  {selected.read && (
                    <button
                      onClick={async () => {
                        await fetch("/api/admin/messages", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: selected._id, read: false }),
                        });
                        setMessages((prev) =>
                          prev.map((m) => m._id === selected._id ? { ...m, read: false } : m)
                        );
                        setSelected((p) => p ? { ...p, read: false } : p);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold transition-all shadow-xs"
                    >
                      Mark Unread
                    </button>
                  )}
                </div>

              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
