"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('student_token', data.access_token);

      // If redirected here after QR scan, continue to that scan URL
      const pendingToken = sessionStorage.getItem('pending_qr_token');
      if (pendingToken) {
        sessionStorage.removeItem('pending_qr_token');
        router.push(`/student/scan?token=${pendingToken}`);
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              <Image
                src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
                alt="Department of Software Engineering UET PESHAWAR"
                width={32}
                height={32}
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="font-bold text-slate-900 text-sm">Department of Software Engineering UET PESHAWAR</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-md mb-5 overflow-hidden">
              <Image
                src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
                alt="Department of Software Engineering UET PESHAWAR"
                width={70}
                height={70}
                className="object-contain"
                unoptimized
              />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Student Sign In</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to mark your attendance</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
            {error && (
              <div className="mb-5 flex items-start gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-700 border border-red-200 bg-red-50">
                <span className="text-base">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="student@uetpeshawar.edu.pk"
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 mt-2 bg-emerald-600"
              >
                {loading ? '⏳ Signing In...' : 'Sign In →'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-slate-500 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/student/signup" className="text-emerald-600 font-semibold hover:text-emerald-700">
                  Sign Up
                </Link>
              </p>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                Go to Teacher Portal →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


