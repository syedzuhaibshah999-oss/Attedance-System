"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getApiBase } from '@/lib/api';
import Image from 'next/image';

// Dynamically import scanner so it only loads on client (needs browser APIs)
const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false });

const courseColors = [
  { from: '#7c3aed', to: '#2563eb', icon: '🧮' },
  { from: '#059669', to: '#0891b2', icon: '🗄️' },
  { from: '#dc2626', to: '#ea580c', icon: '🌐' },
  { from: '#9333ea', to: '#ec4899', icon: '🤖' },
  { from: '#ca8a04', to: '#16a34a', icon: '📡' },
  { from: '#0284c7', to: '#7c3aed', icon: '📊' },
];

export default function StudentDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('student_token');
    if (!token) { router.push('/student'); return; }

    // Fetch courses
    fetch(`${getApiBase()}/courses/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => { if (res.status === 401) { router.push('/student'); return null; } return res.json(); })
      .then(data => { if (Array.isArray(data)) setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));

    // Fetch user profile
    fetch(`${getApiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(console.error);
  }, [router]);

  const [submitting, setSubmitting] = useState(false);

  const markAttendance = async (qrToken: string) => {
    if (submitting) return;
    setSubmitting(true);
    setShowScanner(false);
    const authToken = localStorage.getItem('student_token');
    try {
      const res = await fetch(`${getApiBase()}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ qr_token: qrToken })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: '✅ Attendance marked successfully!', type: 'success' });
        setManualToken('');
      } else {
        setMessage({ text: `❌ ${data.detail}`, type: 'error' });
      }
    } catch {
      setMessage({ text: '❌ Network error. Try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDropCourse = async (courseId: number, courseName: string) => {
    if (!confirm(`Are you sure you want to drop ${courseName}?`)) return;

    const token = localStorage.getItem('student_token');
    try {
      const res = await fetch(`${getApiBase()}/courses/${courseId}/enrollment`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCourses(courses.filter(c => c.id !== courseId));
        setMessage({ text: '✅ Course dropped successfully!', type: 'success' });
      } else {
        const data = await res.json();
        setMessage({ text: `❌ ${data.detail || 'Failed to drop course'}`, type: 'error' });
      }
    } catch (e) {
      setMessage({ text: '❌ Network error. Try again.', type: 'error' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogout = () => { localStorage.removeItem('student_token'); router.push('/student'); };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628, #1a2744, #0d2137)' }}>
      <div className="fixed w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #059669, transparent)', top: '10%', right: '5%' }} />
      <div className="fixed w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0891b2, transparent)', bottom: '10%', left: '5%' }} />

      {/* QR Scanner Modal */}
      {showScanner && (
        <QrScanner onScan={markAttendance} onClose={() => setShowScanner(false)} />
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10"
        style={{ background: 'rgba(10,22,40,0.85)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white overflow-hidden"
              style={{ boxShadow: '0 0 20px rgba(5,150,105,0.5)' }}>
              <Image
                src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
                alt="UET Peshawar"
                width={32}
                height={32}
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
              UET Peshawar
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-white leading-tight">{user.full_name}</span>
                <span className="text-xs text-emerald-400 font-medium">{user.email}</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-300 font-medium">Student Portal</span>
            </div>
            <button onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)' }}>Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-2">Student Portal</p>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
            My Courses 📚
          </h1>
        </div>

        {/* === ATTENDANCE MARKING CARD === */}
        <div className="mb-10 rounded-3xl p-6 border border-emerald-500/20 backdrop-blur-sm"
          style={{ background: 'rgba(5,150,105,0.07)', boxShadow: '0 0 40px rgba(5,150,105,0.1)' }}>

          <div className="absolute inset-0 pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                📡 Mark Attendance
              </h2>
              <p className="text-gray-400 text-sm">Scan the QR code with your camera or paste the token manually.</p>
            </div>

            {/* Scan Button */}
            <button onClick={() => setShowScanner(true)}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-white text-sm transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #059669, #0891b2)',
                boxShadow: '0 0 30px rgba(5,150,105,0.5)',
                fontFamily: 'var(--font-poppins)'
              }}>
              <span className="text-2xl">📷</span>
              <div className="text-left">
                <div className="text-base font-black">Scan QR Code</div>
                <div className="text-xs font-normal opacity-80">Open camera scanner</div>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-gray-500 text-xs font-medium">or enter token manually</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Status message */}
          {message && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
              message.type === 'success'
                ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                : 'text-red-300 border-red-500/30 bg-red-500/10'
            }`}>
              {message.text}
            </div>
          )}

          {/* Manual token input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              placeholder="Paste QR token here..."
              className="flex-1 px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none border border-white/10 focus:border-emerald-500/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              onKeyDown={e => e.key === 'Enter' && manualToken.trim() && markAttendance(manualToken.trim())}
            />
            <button
              onClick={() => manualToken.trim() && markAttendance(manualToken.trim())}
              className="px-5 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)', boxShadow: '0 0 15px rgba(5,150,105,0.4)' }}>
              ✅ Submit
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 border border-white/10 rounded-3xl" style={{background: 'rgba(255,255,255,0.02)'}}>
            <div className="text-6xl mb-4 opacity-70">🏜️</div>
            <h3 className="text-xl font-bold text-white mb-2">No Courses Yet</h3>
            <p className="text-gray-400 text-sm">You are not enrolled in any courses at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course, i) => {
              const color = courseColors[i % courseColors.length];
              return (
                <div key={course.id}
                  className="group relative rounded-3xl p-6 border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20"
                  style={{ background: 'rgba(255,255,255,0.04)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }}>
                  <div className="absolute top-0 left-6 right-6 h-0.5 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color.from}, ${color.to})` }} />
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4"
                    style={{ background: `linear-gradient(135deg, ${color.from}33, ${color.to}33)`, border: `1px solid ${color.from}44` }}>
                    {color.icon}
                  </div>
                  <div className="inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-2"
                    style={{ background: `${color.from}22`, color: color.from, border: `1px solid ${color.from}44` }}>
                    {course.code}
                  </div>
                  <h3 className="text-lg font-bold text-white leading-snug" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {course.name}
                  </h3>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">Enrolled</span>
                  </div>
                  {/* Quick scan button per course */}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setShowScanner(true)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white/70 border border-white/10 hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      📷 Scan for this course
                    </button>
                    <button onClick={() => handleDropCourse(course.id, course.name)}
                      className="px-4 py-2.5 rounded-xl text-gray-400 border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-all hover:bg-red-500/10"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                      title="Drop Course">
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} University of Engineering and Technology, Peshawar. All rights reserved.</p>
          <p className="text-gray-700 text-xs">Student Portal</p>
        </div>
      </footer>
    </div>
  );
}
