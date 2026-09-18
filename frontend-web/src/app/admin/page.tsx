"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBase } from "@/lib/api";

type Course = { id: number; name: string; code: string; teacher_name: string; teacher_email: string | null; sessions: number; students: number };
type Overview = { courses: Course[]; total_courses: number; total_sessions: number };
type UserAccount = { id: int; email: string; full_name: string; role: string; is_active: boolean };

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  // Create User
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  // Update Password
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updatePasswordStr, setUpdatePasswordStr] = useState("");

  const loadData = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const [overviewRes, usersRes] = await Promise.all([
        fetch(`${getApiBase()}/attendance/admin-overview`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBase()}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (overviewRes.status === 401 || overviewRes.status === 403) { router.push("/login"); return; }
      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch { setError("Unable to connect to the service."); }
  };

  useEffect(() => { void loadData(); }, [router]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${getApiBase()}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newName, role: "teacher" })
      });
      if (res.ok) {
        setNewEmail(""); setNewPassword(""); setNewName("");
        await loadData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create user");
      }
    } catch { alert("Network error"); }
    finally { setCreatingUser(false); }
  };

  const handleUpdatePassword = async (userId: number) => {
    if (!updatePasswordStr) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${getApiBase()}/admin/users/${userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: updatePasswordStr })
      });
      if (res.ok) {
        alert("Password updated successfully");
        setUpdatingId(null);
        setUpdatePasswordStr("");
      } else {
        alert("Failed to update password");
      }
    } catch { alert("Network error"); }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${getApiBase()}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) await loadData();
      else alert("Failed to delete user");
    } catch { alert("Network error"); }
  };

  const logout = () => { localStorage.removeItem("token"); router.push("/login"); };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">UET Peshawar</p><h1 className="font-semibold">Administrator portal</h1></div>
          <button onClick={logout} className="text-sm font-medium text-zinc-600 hover:text-zinc-950">Sign out</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 space-y-12">
        {/* Overview Section */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Academic operations</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Subject activity at a glance</h2>
          <p className="mt-2 text-sm text-zinc-500">Review teacher ownership and total sessions for every subject.</p>
          {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6"><p className="text-sm text-zinc-500">Subjects</p><p className="mt-2 text-4xl font-semibold">{overview?.total_courses ?? "—"}</p></div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6"><p className="text-sm text-zinc-500">Sessions run</p><p className="mt-2 text-4xl font-semibold">{overview?.total_sessions ?? "—"}</p></div>
          </div>
        </div>

        {/* User Management Section */}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Teacher Accounts</h2>
          <p className="mt-2 text-sm text-zinc-500 mb-6">Create dedicated accounts for subjects and manage access.</p>
          
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
            {/* Create form */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 self-start">
              <h3 className="font-semibold mb-4">Create Account</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Full Name / Subject Name</label>
                  <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Mathematics Dept" className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                  <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="math@uet.edu.pk" className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Password</label>
                  <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm" />
                </div>
                <button disabled={creatingUser} type="submit" className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {creatingUser ? "Creating..." : "Create Account"}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-200 px-6 py-4 bg-zinc-50">
                <h3 className="font-semibold">Registered Accounts</h3>
              </div>
              <div className="divide-y divide-zinc-100 max-h-[500px] overflow-y-auto">
                {users.map(u => (
                  <div key={u.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{u.full_name}</p>
                        <p className="text-sm text-zinc-500">{u.email}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-zinc-100 text-xs rounded-md text-zinc-600">{u.role}</span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {updatingId === u.id ? (
                          <div className="flex gap-2">
                            <input autoFocus type="text" placeholder="New Password" value={updatePasswordStr} onChange={e => setUpdatePasswordStr(e.target.value)} className="w-32 rounded-lg border border-zinc-300 px-2 py-1 text-xs" />
                            <button onClick={() => handleUpdatePassword(u.id)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-medium">Save</button>
                            <button onClick={() => { setUpdatingId(null); setUpdatePasswordStr(""); }} className="bg-zinc-200 text-zinc-700 px-3 py-1 rounded-lg text-xs font-medium">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setUpdatingId(u.id)} className="text-xs font-medium text-blue-600 hover:underline">Change Password</button>
                        )}
                        <button onClick={() => handleDeleteUser(u.id)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className="p-6 text-sm text-zinc-500 text-center">No accounts found.</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
