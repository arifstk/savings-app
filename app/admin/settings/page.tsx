"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

interface Settings {
  orgName: string;
  logoUrl: string;
  managerSignatureUrl: string;
}

export default function SettingsPage() {
  const [settings, setSettings]   = useState<Settings>({ orgName: "", logoUrl: "", managerSignatureUrl: "" });
  const [loading, setLoading]     = useState(true);
  const [orgName, setOrgName]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState<"logo" | "signature" | null>(null);

  const logoRef      = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok) { setSettings(data.settings); setOrgName(data.settings.orgName); }
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveOrgName = async () => {
    setSaving(true);
    try {
      const res  = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setSettings(data.settings);
      toast.success("Saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleUpload = async (type: "logo" | "signature", file: File) => {
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res  = await fetch("/api/admin/settings", { method: "PUT", body: formData });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setSettings(data.settings);
      toast.success(`${type === "logo" ? "Logo" : "Signature"} updated!`);
    } catch { toast.error("Upload failed"); }
    finally { setUploading(null); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage organization info used in print reports</p>
      </div>

      <div className="max-w-xl space-y-6"> 

        {/* Org Name */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Organization Name</p>
          <div className="flex gap-3">
            <input type="text" value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Dhaka Savings Club"
              className="flex-1 border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={saveOrgName} disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition cursor-pointer">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Shown in the header of all print reports.</p>
        </div>

        {/* Logo upload */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Organization Logo</p>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
              {settings.logoUrl ? (
                <Image src={settings.logoUrl} alt="Logo" width={80} height={80}
                  className="object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">No logo</span>
              )}
            </div>
            <div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("logo", f); }} />
              <button onClick={() => logoRef.current?.click()} disabled={uploading === "logo"}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer">
                {uploading === "logo" ? "Uploading…" : "Upload Logo"}
              </button>
              <p className="text-xs text-gray-400 mt-1.5">PNG, JPG · Max 5MB</p>
            </div>
          </div>
        </div>

        {/* Manager Signature upload */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Manager / Admin Signature</p>
          <div className="flex items-center gap-5">
            <div className="w-36 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
              {settings.managerSignatureUrl ? (
                <Image src={settings.managerSignatureUrl} alt="Signature" width={140} height={64}
                  className="object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">No signature</span>
              )}
            </div>
            <div>
              <input ref={signatureRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("signature", f); }} />
              <button onClick={() => signatureRef.current?.click()} disabled={uploading === "signature"}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer">
                {uploading === "signature" ? "Uploading…" : "Upload Signature"}
              </button>
              <p className="text-xs text-gray-400 mt-1.5">PNG with transparent background works best</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
