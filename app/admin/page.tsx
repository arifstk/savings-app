// app/admin/page.tsx 
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

/* ─── Types ─────────────────────────────────────────────────────── */
interface UserRow {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  provider: string;
  isVerified: boolean;
  createdAt: string;
}

interface SubRow {
  _id: string;
  userId: string;
  month: string;
  amount: number;
  date: string;
}

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function monthOptions() {
  const now = new Date();
  const opts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = MONTHS[d.getMonth()];
    opts.push(`${m},${d.getFullYear()}`);
  }
  return opts;
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [modal, setModal] = useState<UserRow | null>(null);
  const [editUser, setEditUser] = useState({ name: "", email: "", mobile: "" });
  const [userSaving, setUserSaving] = useState(false);

  // Subscription state
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsTotal, setSubsTotal] = useState(0);
  const [editSub, setEditSub] = useState<SubRow | null>(null);
  const [newSub, setNewSub] = useState({ month: monthOptions()[0], amount: "", date: new Date().toISOString().split("T")[0] });
  const [subSaving, setSubSaving] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role !== "admin") router.replace("/");
  }, [status, session, router]);

  // Load users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (status === "authenticated") loadUsers(); }, [status, loadUsers]);

  // Load subscriptions for a user
  const loadSubs = useCallback(async (userId: string) => {
    setSubsLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions?userId=${userId}`);
      const data = await res.json();
      if (res.ok) { setSubs(data.subscriptions); setSubsTotal(data.total); }
    } catch { toast.error("Failed to load subscriptions"); }
    finally { setSubsLoading(false); }
  }, []);

  // Open modal
  const openModal = (user: UserRow) => {
    setModal(user);
    setEditUser({ name: user.name, email: user.email, mobile: user.mobile ?? "" });
    setEditSub(null);
    setNewSub({ month: monthOptions()[0], amount: "", date: new Date().toISOString().split("T")[0] });
    loadSubs(user._id);
  };

  const closeModal = () => { setModal(null); setSubs([]); setSubsTotal(0); setEditSub(null); };

  // Save user info
  const handleUserSave = async () => {
    if (!modal) return;
    setUserSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${modal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editUser),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("User updated!");
      setModal({ ...modal, ...editUser });
      loadUsers();
    } catch { toast.error("Failed to update user"); }
    finally { setUserSaving(false); }
  };

  // Add new subscription
  const handleAddSub = async () => {
    if (!modal || !newSub.amount) { toast.error("Enter an amount"); return; }
    setSubSaving(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: modal._id, month: newSub.month, amount: Number(newSub.amount), date: newSub.date }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Subscription added!");
      setNewSub({ month: monthOptions()[0], amount: "", date: new Date().toISOString().split("T")[0] });
      loadSubs(modal._id);
    } catch { toast.error("Failed to add subscription"); }
    finally { setSubSaving(false); }
  };

  // Save edited subscription
  const handleSubSave = async () => {
    if (!editSub || !modal) return;
    setSubSaving(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${editSub._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: editSub.month, amount: editSub.amount, date: editSub.date }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Updated!");
      setEditSub(null);
      loadSubs(modal._id);
    } catch { toast.error("Failed to update"); }
    finally { setSubSaving(false); }
  };

  // Delete subscription
  const handleSubDelete = async (subId: string) => {
    if (!modal) return;
    if (!confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      toast.success("Deleted!");
      loadSubs(modal._id);
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.mobile ?? "").includes(search)
  );

  if (status === "loading") return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">User Management</p>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, email or mobile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created At</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((user, idx) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 text-gray-400">{idx + 1}</td>
                      <td className="px-5 py-4 font-medium text-gray-800">{user.name}</td>
                      <td className="px-5 py-4 text-gray-600">{user.email}</td>
                      <td className="px-5 py-4 text-gray-600">{user.mobile || <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${user.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => openModal(user)}
                          className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-501 pt-8 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                <p className="text-xs text-gray-400 mt-0.5">Edit info & manage subscriptions</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* User Info Edit */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">User Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={editUser.name}
                      onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mobile</label>
                    <input
                      type="tel"
                      value={editUser.mobile}
                      onChange={(e) => setEditUser({ ...editUser, mobile: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleUserSave}
                    disabled={userSaving}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition cursor-pointer"
                  >
                    {userSaving ? "Saving…" : "Save User Info"}
                  </button>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Subscription Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Subscriptions</h3>

                {/* Add New Row */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                  <p className="text-xs font-medium text-blue-700 mb-3">Add New Entry</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Month</label>
                      <select
                        value={newSub.month}
                        onChange={(e) => setNewSub({ ...newSub, month: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {monthOptions().map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Amount (Taka)</label>
                      <input
                        type="number"
                        placeholder="1,500"
                        value={newSub.amount}
                        onChange={(e) => setNewSub({ ...newSub, amount: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date</label>
                      <input
                        type="date"
                        value={newSub.date}
                        onChange={(e) => setNewSub({ ...newSub, date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddSub}
                    disabled={subSaving}
                    className="mt-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition cursor-pointer"
                  >
                    {subSaving ? "Adding…" : "+ Add Entry"}
                  </button>
                </div>

                {/* Subscription Table */}
                {subsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-10">#</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Month</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Subscription</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {subs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-400 text-xs">
                              No subscription entries yet
                            </td>
                          </tr>
                        ) : subs.map((sub, idx) => (
                          <tr key={sub._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-400">{idx + 1}</td>

                            {editSub?._id === sub._id ? (
                              <>
                                <td className="px-4 py-3">
                                  <select
                                    value={editSub.month}
                                    onChange={(e) => setEditSub({ ...editSub, month: e.target.value })}
                                    className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    {monthOptions().map((m) => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    value={editSub.amount}
                                    onChange={(e) => setEditSub({ ...editSub, amount: Number(e.target.value) })}
                                    className="border border-gray-300 rounded px-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="date"
                                    value={editSub.date.split("T")[0]}
                                    onChange={(e) => setEditSub({ ...editSub, date: e.target.value })}
                                    className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={handleSubSave}
                                      disabled={subSaving}
                                      className="bg-green-600 hover:bg-green-500 text-white text-xs px-2.5 py-1 rounded transition cursor-pointer"
                                    >
                                      {subSaving ? "…" : "Save"}
                                    </button>
                                    <button
                                      onClick={() => setEditSub(null)}
                                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 font-medium text-gray-800">{sub.month}</td>
                                <td className="px-4 py-3 text-gray-700">
                                  Tk. {sub.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                  {new Date(sub.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".")}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => setEditSub(sub)}
                                      className="bg-amber-500 hover:bg-amber-400 text-white text-xs px-2.5 py-1 rounded transition cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleSubDelete(sub._id)}
                                      className="bg-red-500 hover:bg-red-400 text-white text-xs px-2.5 py-1 rounded transition cursor-pointer"
                                    >
                                      Del
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>

                      {/* Total Row */}
                      {subs.length > 0 && (
                        <tfoot>
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-700 text-right">Total =</td>
                            <td className="px-4 py-3 text-sm font-bold text-blue-700">
                              Tk. {subsTotal.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                            </td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


