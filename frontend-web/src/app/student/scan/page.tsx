"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';
import Image from 'next/image';

function ScanContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login_required'>('loading');
  const [message, setMessage] = useState('');
  const hasCalled = useRef(false);

  useEffect(() => {
    if (!token || hasCalled.current) return;
    hasCalled.current = true;

    const studentToken = localStorage.getItem('student_token');
    if (!studentToken) {
      sessionStorage.setItem('pending_qr_token', token);
      const timeoutId = window.setTimeout(() => setStatus('login_required'), 0);
      return () => window.clearTimeout(timeoutId);
    }
    const markAttendance = async () => {
      try {
        const res = await fetch(`${getApiBase()}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ qr_token: token }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage('Your attendance has been recorded successfully!');
      } else {
        setStatus('error');
        setMessage(data.detail || 'Failed to mark attendance.');
      }
      } catch {
        setStatus('error');
        setMessage('Cannot reach server. Make sure you are connected to the internet.');
      }
    };
    void markAttendance();
  }, [token]);

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-md mb-4 overflow-hidden">
          <Image
            src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
            alt="Department of Software Engineering UET PESHAWAR"
            width={54}
            height={54}
            className="object-contain"
            unoptimized
          />
        </div>
        <h1 className="text-xl font-black text-slate-900">Department of Software Engineering UET PESHAWAR</h1>
        <p className="text-slate-500 text-sm">Smart Attendance System</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <p className="text-slate-700 font-semibold">Marking Attendance...</p>
            <p className="text-slate-400 text-sm">Please wait</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-4xl shadow-sm">
              ✅
            </div>
            <h2 className="text-xl font-black text-slate-900">Attendance Marked!</h2>
            <p className="text-emerald-600 text-sm font-medium text-center">{message}</p>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="mt-2 w-full py-3 rounded-xl font-bold text-white text-sm bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              View My Dashboard →
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-4xl">
              ❌
            </div>
            <h2 className="text-xl font-black text-slate-900">Oops!</h2>
            <p className="text-red-600 text-sm font-medium text-center">{message}</p>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="mt-2 w-full py-3 rounded-xl font-semibold text-slate-700 text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              ← Go to Dashboard
            </button>
          </div>
        )}

        {status === 'login_required' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl">
              🔐
            </div>
            <h2 className="text-xl font-black text-slate-900">Login Required</h2>
            <p className="text-slate-500 text-sm text-center">
              Please sign in to mark your attendance. Your QR token has been saved.
            </p>
            <button
              onClick={() => router.push('/student')}
              className="mt-2 w-full py-3 rounded-xl font-bold text-white text-sm bg-blue-600 hover:bg-blue-700 transition-colors"
            >
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      }>
        <ScanContent />
      </Suspense>
    </div>
  );
}


