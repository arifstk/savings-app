// app/admin/contact-info/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

interface Card {
  icon: string;
  title: string;
  desc: string;
  sub: string;
}

const EMPTY_CARD: Card = { icon: "📧", title: "", desc: "", sub: "" };

export default function AdminContactInfoPage() {
  const [cards, setCards] = useState<Card[]>([EMPTY_CARD]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/contact-info");
      const data = await res.json();
      if (res.ok) setCards(data.cards?.length ? data.cards : [EMPTY_CARD]);
    } catch {
      toast.error("Failed to load contact info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateCard = (index: number, field: keyof Card, value: string) => {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCard = () => setCards((prev) => [...prev, { ...EMPTY_CARD }]);

  const removeCard = (index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contact-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Contact info updated!");
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
        <h1 className="text-xl font-bold text-gray-900">Contact Info Cards</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Control the info cards shown on your Contact page
        </p>
      </div>

      <div className="max-w-2xl space-y-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Card {index + 1}</p>
              {cards.length > 1 && (
                <button
                  onClick={() => removeCard(index)}
                  className="text-xs text-red-500 hover:text-red-600 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Icon</label>
                <input
                  type="text"
                  value={card.icon}
                  onChange={(e) => updateCard(index, "icon", e.target.value)}
                  placeholder="📧"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => updateCard(index, "title", e.target.value)}
                  placeholder="e.g. Email Us"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Description (main line)
              </label>
              <input
                type="text"
                value={card.desc}
                onChange={(e) => updateCard(index, "desc", e.target.value)}
                placeholder="e.g. support@yourstore.com"
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Sub-text
              </label>
              <input
                type="text"
                value={card.sub}
                onChange={(e) => updateCard(index, "sub", e.target.value)}
                placeholder="e.g. We reply within 24 hours"
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addCard}
          className="w-full border-2 border-dashed border-gray-300 hover:border-teal-400 hover:text-teal-600 text-gray-400 text-sm font-medium py-3 rounded-xl transition cursor-pointer"
        >
          + Add Another Card
        </button>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white font-medium text-sm px-6 py-2.5 rounded-lg cursor-pointer transition"
          >
            {saving ? "Saving…" : "Save Contact Info"}
          </button>
        </div>
      </div>
    </div>
  );
}

