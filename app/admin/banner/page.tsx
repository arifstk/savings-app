"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

interface BannerData {
  enabled: boolean;
  h1: string;
  h2: string;
  p: string;
}

export default function BannerAdminPage() {
  const [form, setForm]     = useState<BannerData>({ enabled: true, h1: "", h2: "", p: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/banner");
      const data = await res.json();
      if (res.ok) setForm(data.banner);
    } catch { toast.error("Failed to load banner"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch("/api/admin/banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Banner updated!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Banner</h1>
        <p className="text-sm text-gray-500 mt-0.5">Control the banner shown on your homepage</p>
      </div>

      <div className="max-w-2xl space-y-5">

        {/* Enable / Disable toggle */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Banner Visibility</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {form.enabled ? "Banner is currently visible to all users" : "Banner is hidden"}
            </p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              form.enabled ? "bg-teal-500" : "bg-gray-300"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              form.enabled ? "translate-x-6" : "translate-x-1"
            }`}/>
          </button>
        </div>

        {/* Content fields */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Banner Content</p>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              H1 — Main Heading
            </label>
            <input
              type="text"
              value={form.h1}
              onChange={e => setForm(f => ({ ...f, h1: e.target.value }))}
              placeholder="e.g. Welcome to Taqwa Savings"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              H2 — Sub Heading
            </label>
            <input
              type="text"
              value={form.h2}
              onChange={e => setForm(f => ({ ...f, h2: e.target.value }))}
              placeholder="e.g. Savings for holy purposes"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              P — Paragraph Text
            </label>
            <textarea
              value={form.p}
              onChange={e => setForm(f => ({ ...f, p: e.target.value }))}
              placeholder="e.g. Join our savings community and achieve your financial goals together."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white font-medium text-sm px-6 py-2.5 rounded-lg cursor-pointer transition"
            >
              {saving ? "Saving…" : "Save Banner"}
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Live Preview</p>
          <div className={`rounded-2xl bg-teal-300 px-8 py-10 text-center transition-opacity ${
            form.enabled ? "opacity-100" : "opacity-40"
          }`}>
            {!form.enabled && (
              <p className="text-xs font-semibold text-teal-800 bg-teal-200 rounded-full px-3 py-1 inline-block mb-4">
                Hidden — banner is disabled
              </p>
            )}
            {form.h1 ? (
              <h1 className="text-3xl font-bold text-teal-900 mb-2">{form.h1}</h1>
            ) : (
              <h1 className="text-3xl font-bold text-teal-700/40 mb-2">H1 Heading will appear here</h1>
            )}
            {form.h2 ? (
              <h2 className="text-xl font-semibold text-teal-800 mb-3">{form.h2}</h2>
            ) : (
              <h2 className="text-xl font-semibold text-teal-700/40 mb-3">H2 Sub-heading will appear here</h2>
            )}
            {form.p ? (
              <p className="text-teal-900/80 text-sm max-w-lg mx-auto">{form.p}</p>
            ) : (
              <p className="text-teal-700/40 text-sm max-w-lg mx-auto">Paragraph text will appear here</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
