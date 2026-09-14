"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getApiBase } from '@/lib/api';
import Image from 'next/image';

// Dynamically import scanner so it only loads on client (needs browser APIs)
const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false });

const COURSE_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100' },
];

export default function StudentDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('student_token');
    if (!token) { router.push('/student'); return; }

    Promise.all([
      fetch(`${getApiBase()}/courses/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { if (res.status === 401) { router.push('/student'); return null; } return res.json(); }),
      fetch(`${getApiBase()}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json()),
    ]).then(([coursesData, userData]) => {
      if (Array.isArray(coursesData)) setCourses(coursesData);
      if (userData) setUser(userData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  const markAttendance = async (qrToken: string) => {
    if (submitting) return;
    setSubmitting(true);
    setShowScanner(false);
    const authToken = localStorage.getItem('student_token');
    try {
      const res = await fetch(`${getApiBase()}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ qr_token: qrToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Attendance marked successfully!', type: 'success' });
        setManualToken('');
      } else {
        setMessage({ text: data.detail || 'Failed to mark attendance', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDropCourse = async (courseId: number, courseName: string) => {
    if (!confirm(`Drop "${courseName}"?`)) return;
    const token = localStorage.getItem('student_token');
    try {
      const res = await fetch(`${getApiBase()}/courses/${courseId}/enrollment`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== courseId));
        setMessage({ text: 'Course dropped successfully.', type: 'success' });
      } else {
        const data = await res.json();
        setMessage({ text: data.detail || 'Failed to drop course', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error.', type: 'error' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogout = () => { localStorage.removeItem('student_token'); router.push('/student'); };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* QR Scanner Modal */}
      {showScanner && <QrScanner onScan={markAttendance} onClose={() => setShowScanner(false)} />}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              <Image
                src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
                alt="Department of Software Engineering UET PESHAWAR" width={32} height={32} className="object-contain" unoptimized
              />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">Department of Software Engineering UET PESHAWAR</div>
              <div className="text-xs text-slate-500">Attendance System</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900 leading-tight">{user.full_name}</span>
                <span className="text-xs text-emerald-600">{user.email}</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-700 font-medium">Student Portal</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-3xl font-black text-slate-900">My Courses</h1>
        </div>

        {/* Attendance Marking Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-5 mb-5">
            <div className="flex-1">
              <h2 className="text-base font-bold text-slate-900 mb-1">📡 Mark Attendance</h2>
              <p className="text-slate-500 text-sm">Scan the QR code or paste the session token manually</p>
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold text-white text-sm bg-emerald-600 hover:bg-emerald-700 transition-colors shrink-0"
            >
              <span className="text-xl">📷</span>
              <div className="text-left">
                <div className="font-bold">Scan QR Code</div>
                <div className="text-xs font-normal opacity-80">Open camera</div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-slate-400 text-xs font-medium">or enter token manually</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {message && (
            <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
              message.type === 'success'
                ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
                : 'text-red-700 border-red-200 bg-red-50'
            }`}>
              <span>{message.type === 'success' ? '✅' : '❌'}</span>
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              placeholder="Paste session token here..."
              className="flex-1 px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-sm"
              onKeyDown={e => e.key === 'Enter' && manualToken.trim() && markAttendance(manualToken.trim())}
            />
            <button
              onClick={() => manualToken.trim() && markAttendance(manualToken.trim())}
              disabled={submitting || !manualToken.trim()}
              className="px-5 py-3 rounded-xl font-bold text-white text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              <p className="text-slate-500 text-sm">Loading courses...</p>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="text-5xl mb-4">🏜️</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Courses Yet</h3>
            <p className="text-slate-500 text-sm">You are not enrolled in any courses at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {courses.map((course, i) => {
              const color = COURSE_COLORS[i % COURSE_COLORS.length];
              return (
                <div key={course.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${color.bg} ${color.border} border flex items-center justify-center text-xl`}>
                      📘
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${color.badge} ${color.text}`}>
                      {course.code}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{course.name}</h3>
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Enrolled</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowScanner(true)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all"
                    >
                      📷 Scan QR
                    </button>
                    <button
                      onClick={() => handleDropCourse(course.id, course.name)}
                      className="px-3.5 py-2.5 rounded-xl text-slate-500 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all text-sm"
                      title="Drop Course"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-1">
          <p className="text-slate-400 text-xs">© {new Date().getFullYear()} University of Engineering and Technology, Peshawar</p>
          <p className="text-slate-400 text-xs">Student Portal</p>
        </div>
      </footer>
    </div>
  );
}


