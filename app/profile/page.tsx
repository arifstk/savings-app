"use client";

import { useSession } from "next-auth/react";
import { useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

/* ─── tiny helpers ────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:bg-gray-50 disabled:text-gray-400 transition ${props.className ?? ""}`}
    />
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── avatar state ──────────────────────────────────────────────────
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── profile form state ────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    mobile: "",
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // ── password form state ───────────────────────────────────────────
  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Populate form once session loads
  if (status === "authenticated" && session?.user && !profileLoaded) {
    setProfile({
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      mobile: (session.user as { mobile?: string }).mobile ?? "",
    });
    setAvatarSrc(session.user.image || null);
    setProfileLoaded(true);
  }

  // ── redirect if not logged in ─────────────────────────────────────
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const user = session!.user;
  const hasImage = !!avatarSrc && avatarSrc.trim() !== "";
  const initial = user.name?.charAt(0).toUpperCase() ?? "U";
  const isGoogleUser = (user as { provider?: string }).provider === "google";

  /* ── avatar upload ─────────────────────────────────────────────── */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarSrc(previewUrl);

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        setAvatarSrc(user.image || null);
        return;
      }

      setAvatarSrc(data.url);
      await update({ image: data.url });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Upload failed. Please try again.");
      setAvatarSrc(user.image || null);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── profile save ──────────────────────────────────────────────── */
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error("Name is required");
    if (!profile.email.trim()) return toast.error("Email is required");

    setProfileSaving(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }

      await update({ name: data.user.name, email: data.user.email });
      toast.success("Profile updated!");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setProfileSaving(false);
    }
  };

  /* ── password save ─────────────────────────────────────────────── */
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setPwSaving(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pw),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to change password");
        return;
      }

      toast.success("Password changed!");
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setPwSaving(false);
    }
  };

  /* ── render ────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account information and settings
          </p>
        </div>

        {/* ── Avatar section ─────────────────────────────────────── */}
        <Section
          title="Profile Picture"
          subtitle="Click the avatar to upload a new photo (max 5MB)"
        >
          <div className="flex items-center gap-5">
            {/* Clickable avatar */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="relative w-20 h-20 rounded-full overflow-hidden focus:outline-none focus:ring-4 focus:ring-blue-300 cursor-pointer"
              >
                {hasImage ? (
                  <Image
                    src={avatarSrc!}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {initial}
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-full">
                  {avatarUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <p className="font-semibold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className={`inline-block mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${user.role === "admin"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
                }`}>
                {user.role === "admin" ? "Administrator" : "User"}
              </span>
              {isGoogleUser && (
                <span className="inline-block ml-2 mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  Google Account
                </span>
              )}
            </div>
          </div>
        </Section>

        {/* ── Account info ───────────────────────────────────────── */}
        <Section
          title="Account Information"
          subtitle="Read-only details about your account"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">User ID</p>
              <p className="text-gray-800 font-mono text-xs break-all">{user.id}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Sign-in Method</p>
              <p className="text-gray-800 capitalize">{isGoogleUser ? "Google" : "Email & Password"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Role</p>
              <p className="text-gray-800 capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Email Verified</p>
              <p className="text-gray-800">Yes</p>
            </div>
          </div>
        </Section>

        {/* ── Edit profile ───────────────────────────────────────── */}
        <Section
          title="Edit Profile"
          subtitle="Update your name, email, and mobile number"
        >
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <Label>Full name</Label>
              <Input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            <div>
              <Label>Email address</Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label>Mobile number</Label>
              <Input
                type="tel"
                value={profile.mobile}
                onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                placeholder="+1 555 123 4567"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={profileSaving}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg text-sm transition"
              >
                {profileSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </Section>

        {/* ── Change password ────────────────────────────────────── */}
        {!isGoogleUser ? (
          <Section
            title="Change Password"
            subtitle="Use a strong password with uppercase, lowercase, and numbers"
          >
            <form onSubmit={handlePasswordSave} className="space-y-4">
              {/* Current password */}
              <div>
                <Label>Current password</Label>
                <div className="relative">
                  <Input
                    type={showPw.current ? "text" : "password"}
                    value={pw.currentPassword}
                    onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw.current ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <Label>New password</Label>
                <div className="relative">
                  <Input
                    type={showPw.new ? "text" : "password"}
                    value={pw.newPassword}
                    onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                    placeholder="At least 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw({ ...showPw, new: !showPw.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw.new ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {/* Password strength hints */}
                {pw.newPassword && (
                  <div className="mt-2 space-y-1">
                    {[
                      { label: "At least 8 characters", ok: pw.newPassword.length >= 8 },
                      { label: "One uppercase letter", ok: /[A-Z]/.test(pw.newPassword) },
                      { label: "One lowercase letter", ok: /[a-z]/.test(pw.newPassword) },
                      { label: "One number", ok: /[0-9]/.test(pw.newPassword) },
                    ].map((rule) => (
                      <p key={rule.label} className={`text-xs flex items-center gap-1.5 ${rule.ok ? "text-green-600" : "text-gray-400"}`}>
                        <span>{rule.ok ? "✓" : "○"}</span> {rule.label}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <Label>Confirm new password</Label>
                <div className="relative">
                  <Input
                    type={showPw.confirm ? "text" : "password"}
                    value={pw.confirmPassword}
                    onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw.confirm ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {pw.confirmPassword && pw.newPassword !== pw.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                )}
                {pw.confirmPassword && pw.newPassword === pw.confirmPassword && (
                  <p className="text-xs text-green-600 mt-1.5">✓ Passwords match</p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={pwSaving || pw.newPassword !== pw.confirmPassword || !pw.currentPassword}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg text-sm transition"
                >
                  {pwSaving ? "Changing…" : "Change Password"}
                </button>
              </div>
            </form>
          </Section>
        ) : (
          <Section title="Change Password">
            <div className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                You signed in with Google. To change your password, go to your{" "}
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Google Account settings
                </a>
                .
              </p>
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}

/* ── icon helpers ─────────────────────────────────────────────────── */
function Eye() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}
