"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getApiBase } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, Info } from "lucide-react";

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });
type SummaryCourse = { course_id: number; course_name: string; course_code: string; sessions: number; attended: number; percentage: number; at_risk: boolean };
type Summary = { overall_percentage: number; total_sessions: number; attended_sessions: number; at_risk_courses: SummaryCourse[]; courses: SummaryCourse[] };
type User = { full_name: string; email: string };

export default function StudentDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const loadDashboard = async () => {
    const token = localStorage.getItem("student_token");
    if (!token) { router.push("/student"); return; }
    try {
      const [summaryResponse, userResponse] = await Promise.all([
        fetch(`${getApiBase()}/attendance/student-summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBase()}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (summaryResponse.status === 401 || userResponse.status === 401) { router.push("/student"); return; }
      if (summaryResponse.ok) setSummary(await summaryResponse.json() as Summary);
      if (userResponse.ok) setUser(await userResponse.json() as User);
    } catch { setNotice("The dashboard could not be refreshed. Please check your connection."); }
  };
  useEffect(() => { void loadDashboard(); }, []);

  const markAttendance = async (qrToken: string) => {
    if (submitting) return;
    setSubmitting(true); setShowScanner(false);
    const token = localStorage.getItem("student_token");
    try {
      const response = await fetch(`${getApiBase()}/attendance/mark`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ qr_token: qrToken }) });
      const data = await response.json() as { detail?: string };
      setNotice(response.ok ? "Attendance recorded successfully." : data.detail ?? "Attendance could not be recorded.");
      if (response.ok) { setManualToken(""); await loadDashboard(); }
    } catch { setNotice("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  const logout = () => { localStorage.removeItem("student_token"); router.push("/student"); };
  const overall = summary?.overall_percentage ?? 0;

  const chartData = summary?.courses.map(c => ({
    name: c.course_code,
    fullName: c.course_name,
    percentage: c.percentage,
    atRisk: c.at_risk
  })) || [];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {showScanner && <QrScanner onScan={markAttendance} onClose={() => setShowScanner(false)} />}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">UET Peshawar</p><h1 className="font-semibold text-zinc-800">Student Portal</h1></div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block"><p className="text-sm font-medium">{user?.full_name}</p><p className="text-xs text-zinc-500">{user?.email}</p></div>
            <button onClick={logout} className="text-sm font-medium bg-zinc-100 px-3 py-1.5 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 transition-colors">Sign out</button>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Attendance Overview</p>
            <h2 className="text-3xl font-semibold tracking-tight">Welcome, {user?.full_name?.split(" ")[0] ?? "Student"}.</h2>
            <p className="mt-2 text-sm text-zinc-500 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Maintain above 75% attendance in all subjects.
            </p>
          </div>
          <button onClick={() => setShowScanner(true)} className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm flex items-center gap-2">
            📸 Scan Attendance
          </button>
        </div>

        {notice && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 font-medium">
            <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-600"/> {notice}</div>
            <button onClick={() => setNotice(null)} className="text-blue-600 hover:text-blue-800">×</button>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="col-span-1 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              {overall >= 75 ? <TrendingUp className="w-24 h-24 text-emerald-500"/> : <TrendingDown className="w-24 h-24 text-rose-500"/>}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Overall Attendance</p>
              <div className="mt-4 flex items-end gap-3">
                <span className={`text-6xl font-black tracking-tighter ${overall >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {overall}%
                </span>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 border-t border-zinc-100 pt-5 text-sm">
              <div>
                <p className="text-zinc-500 font-medium">Attended</p>
                <p className="mt-1 text-2xl font-bold text-zinc-800">{summary?.attended_sessions ?? 0}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Total Sessions</p>
                <p className="mt-1 text-2xl font-bold text-zinc-800">{summary?.total_sessions ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-zinc-800">Subject Performance</h3>
                <p className="text-sm text-zinc-500">Your attendance percentage across all courses</p>
              </div>
              <div className="px-3 py-1 bg-zinc-100 rounded-md text-xs font-semibold text-zinc-600">
                Target: 75%
              </div>
            </div>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                  <Tooltip 
                    cursor={{ fill: '#f4f4f5' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-900 text-white p-3 rounded-lg shadow-xl border border-zinc-800 text-sm">
                            <p className="font-bold mb-1">{data.fullName}</p>
                            <p className="text-zinc-300">{data.name}</p>
                            <p className={`mt-2 font-black ${data.percentage < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {data.percentage}% Attendance
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.atRisk ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {(summary?.at_risk_courses.length ?? 0) > 0 && (
          <section className="mt-2 mb-8 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-full text-amber-600"><AlertCircle className="w-6 h-6" /></div>
              <div>
                <h3 className="text-xl font-bold text-amber-900">Action Required: Courses at Risk</h3>
                <p className="text-sm text-amber-700">The following subjects are below the 75% threshold.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {summary?.at_risk_courses.map(course => (
                <div key={course.course_id} className="rounded-xl border border-amber-200 bg-white/80 backdrop-blur-sm px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
                  <p className="font-bold text-zinc-900 truncate" title={course.course_name}>{course.course_name}</p>
                  <p className="text-xs text-zinc-500 mb-3">{course.course_code}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-700">{course.attended} / {course.sessions} Sessions</span>
                    <span className="text-lg font-black text-amber-600">{course.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-zinc-800">Manual Attendance</h3>
              <p className="text-sm text-zinc-500">Unable to scan the QR code? Enter the session token provided by your teacher.</p>
            </div>
          </div>
          <div className="flex gap-3 max-w-xl">
            <input 
              value={manualToken} 
              onChange={event => setManualToken(event.target.value)} 
              onKeyDown={event => event.key === "Enter" && manualToken.trim() && void markAttendance(manualToken.trim())} 
              placeholder="e.g., A7b9_XQ12..." 
              className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
            />
            <button 
              disabled={submitting || !manualToken.trim()} 
              onClick={() => void markAttendance(manualToken.trim())} 
              className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-zinc-800 transition-colors shadow-sm"
            >
              {submitting ? "Verifying..." : "Submit Token"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
