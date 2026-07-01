// app/contact/page.tsx

"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Link from "next/link";

const SUBJECTS = [
  "General Inquiry",
  "Order Issue",
  "Product Question",
  "Return & Refund",
  "Technical Support",
  "Partnership",
  "Feedback",
  "Other",
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all";

export default function ContactPage() {
  const { data: session } = useSession();

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync session data once it arrives
  useEffect(() => {
    if (session?.user) {
      setForm((p) => ({
        ...p,
        name: p.name || session.user?.name || "",
        email: p.email || session.user?.email || "",
      }));
    }
  }, [session]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Please enter your name."); return; }
    if (!form.email.trim()) { toast.error("Please enter your email."); return; }
    if (!form.subject.trim()) { toast.error("Please select a subject."); return; }
    if (!form.message.trim()) { toast.error("Please enter your message."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast.success("Message sent successfully!");
      } else {
        toast.error(data.error || "Failed to send message.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Store info from admin panel
  const [storeSettings, setStoreSettings] = useState<{
    storeEmail: string;
    storePhone: string;
    storeAddress: string;
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  } | null>(null);

  const [settingsLoading, setSettingsLoading] = useState(true);
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStoreSettings(data.settings);
      })
      .finally(() => setSettingsLoading(false));
  }, []);

  // ── Success state ──
  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl mx-auto mb-5">
            ✅
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            Message Sent!
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Thank you for reaching out, <span className="font-semibold text-slate-700">{form.name}</span>!
            We've received your message and will get back to you at{" "}
            <span className="font-semibold text-indigo-600">{form.email}</span> shortly.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({ name: "", email: "", subject: "", message: "" });
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all"
            >
              Send Another Message
            </button>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-10 max-w-7xl mx-auto px-1.5">
      {/* ── Page header ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold px-2 py-1.5 rounded-full mb-4">
          💬 Get in Touch
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight mb-3">
          Contact Us
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Have a question, feedback, or need help? We'd love to hear from you.
          We typically respond within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* ── LEFT: Info cards ── */}
        <div className="space-y-4">
          {settingsLoading ? (
            // Skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-md border border-slate-100 shadow-sm p-5 flex items-start gap-4 animate-pulse"
              >
                <div className="w-10 h-10 rounded-md bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-2.5 w-1/3 bg-slate-200 rounded-md" />
                  <div className="h-3.5 w-2/3 bg-slate-200 rounded-md" />
                  <div className="h-2.5 w-1/2 bg-slate-100 rounded-md" />
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Info cards */}
              {[
                {
                  icon: "📧",
                  title: "Email Us",
                  desc: storeSettings?.storeEmail || "—",
                  sub: "We reply within 24 hours",
                },
                {
                  icon: "📞",
                  title: "Call Us",
                  desc: storeSettings?.storePhone || "—",
                  sub: "Mon–Sat, 9am–6pm",
                },
                {
                  icon: "📍",
                  title: "Visit Us",
                  desc: storeSettings?.storeAddress || "—",
                  sub: "Come say hello",
                },
                {
                  icon: "⏱",
                  title: "Response Time",
                  desc: "Within 24 hours",
                  sub: "Usually much faster",
                },
              ].map((info) => (
                <div
                  key={info.title}
                  className="bg-white rounded-md border border-slate-100 shadow-sm p-5 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
                    {info.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {info.title}
                    </p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {info.desc}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{info.sub}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-md border border-slate-100 shadow-sm p-3 md:p-6 space-y-5">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                Send a Message
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fill in the form below and we'll get back to you.
              </p>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Subject <span className="text-rose-400">*</span>
              </label>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select a subject…</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Message <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us how we can help you…"
                rows={6}
                className={`${inputClass} resize-none`}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {form.message.length} characters
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>Send Message 📨</>
              )}
            </button>

            <p className="text-xs text-slate-400 text-center tracking-tighter">
              🔒 Your information is private and will never be shared.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}