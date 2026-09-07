"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';

function ScanContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login_required'>('loading');
  const [message, setMessage] = useState('');

  const [hasCalled, setHasCalled] = useState(false);

  useEffect(() => {
    if (!token || hasCalled) return;
    setHasCalled(true);

    const studentToken = localStorage.getItem('student_token');
    if (!studentToken) {
      sessionStorage.setItem('pending_qr_token', token);
      setStatus('login_required');
      return;
    }
    markAttendance(token, studentToken);
  }, [token, hasCalled]);

  const markAttendance = async (qrToken: string, authToken: string) => {
    setStatus('loading');
    try {
      const res = await fetch(`${getApiBase()}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ qr_token: qrToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage('Your attendance has been recorded!');
      } else {
        setStatus('error');
        setMessage(data.detail || 'Failed to mark attendance.');
      }
    } catch {
      setStatus('error');
      setMessage('Cannot reach server. Make sure you are on the same WiFi network.');
    }
  };

  return (
    <div className="relative z-10 w-full max-w-sm text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
        style={{ background: 'linear-gradient(135deg, #059669, #0891b2)', boxShadow: '0 0 40px rgba(5,150,105,0.5)' }}>
        <span className="text-4xl">🎓</span>
      </div>
      <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
        Attend<span style={{ background: 'linear-gradient(90deg, #059669, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>X</span>
      </h1>

      <div className="mt-8 rounded-3xl p-8 border border-white/10 backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <p className="text-white font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>Marking Attendance...</p>
            <p className="text-gray-400 text-sm">Please wait</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ background: 'rgba(5,150,105,0.2)', border: '2px solid rgba(5,150,105,0.5)', boxShadow: '0 0 30px rgba(5,150,105,0.4)' }}>✅</div>
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-poppins)' }}>Attendance Marked!</h2>
            <p className="text-emerald-400 text-sm font-medium">{message}</p>
            <button onClick={() => router.push('/student/dashboard')}
              className="mt-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)', boxShadow: '0 0 20px rgba(5,150,105,0.4)' }}>
              View My Dashboard →
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ background: 'rgba(220,38,38,0.15)', border: '2px solid rgba(220,38,38,0.4)', boxShadow: '0 0 30px rgba(220,38,38,0.3)' }}>❌</div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-poppins)' }}>Oops!</h2>
            <p className="text-red-400 text-sm font-medium">{message}</p>
            <button onClick={() => router.push('/student/dashboard')}
              className="mt-2 px-6 py-3 rounded-xl font-bold text-white text-sm border border-white/10 transition-all hover:border-white/20"
              style={{ background: 'rgba(255,255,255,0.05)' }}>← Go to Dashboard</button>
          </div>
        )}

        {status === 'login_required' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-5xl">🔐</div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-poppins)' }}>Login Required</h2>
            <p className="text-gray-400 text-sm">Please sign in to mark your attendance. Your QR token has been saved.</p>
            <button onClick={() => router.push('/student')}
              className="mt-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)', boxShadow: '0 0 20px rgba(5,150,105,0.4)' }}>
              🚀 Login as Student
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #0a1628, #1a2744, #0d2137)' }}>
      <div className="fixed w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #059669, transparent)', top: '-5rem', right: '-5rem', animation: 'pulse 3s ease-in-out infinite' }} />
      <div className="fixed w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0891b2, transparent)', bottom: '-5rem', left: '-5rem', animation: 'pulse 5s ease-in-out infinite' }} />
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-white">Loading...</p>
        </div>
      }>
        <ScanContent />
      </Suspense>
    </div>
  );
}
