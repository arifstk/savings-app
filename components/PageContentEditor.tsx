// components/PageContentEditor.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

interface Section {
  h3: string;
  p: string;
}

export default function PageContentEditor({
  pageKey,
  pageTitle,
}: {
  pageKey: string;
  pageTitle: string;
}) {
  const [sections, setSections] = useState<Section[]>([{ h3: "", p: "" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/page-content/${pageKey}`);
      const data = await res.json();
      if (res.ok) {
        setSections(
          data.page?.sections?.length ? data.page.sections : [{ h3: "", p: "" }]
        );
      }
    } catch {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [pageKey]);

  useEffect(() => { load(); }, [load]);

  const updateSection = (index: number, field: "h3" | "p", value: string) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addSection = () => setSections((prev) => [...prev, { h3: "", p: "" }]);

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleaned = sections.filter((s) => s.h3.trim() || s.p.trim());
      const res = await fetch(`/api/admin/page-content/${pageKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setSections(cleaned.length ? cleaned : [{ h3: "", p: "" }]);
      toast.success(`${pageTitle} updated!`);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage the content shown on your {pageTitle.toLowerCase()} page
        </p>
      </div>

      <div className="max-w-2xl space-y-4">
        {sections.map((section, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Section {index + 1}</p>
              {sections.length > 1 && (
                <button
                  onClick={() => removeSection(index)}
                  className="text-xs text-red-500 hover:text-red-600 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                H3 — Heading
              </label>
              <input
                type="text"
                value={section.h3}
                onChange={(e) => updateSection(index, "h3", e.target.value)}
                placeholder="e.g. Information We Collect"
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                P — Paragraph Text
              </label>
              <textarea
                value={section.p}
                onChange={(e) => updateSection(index, "p", e.target.value)}
                placeholder="e.g. We collect information you provide directly to us..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addSection}
          className="w-full border-2 border-dashed border-gray-300 hover:border-teal-400 hover:text-teal-600 text-gray-400 text-sm font-medium py-3 rounded-xl transition cursor-pointer"
        >
          + Add Another Section
        </button>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white font-medium text-sm px-6 py-2.5 rounded-lg cursor-pointer transition"
          >
            {saving ? "Saving…" : `Save ${pageTitle}`}
          </button>
        </div>
      </div>
    </div>
  );
}

