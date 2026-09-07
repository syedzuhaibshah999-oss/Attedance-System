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
      // Check if student was redirected here from a QR scan
      const pendingToken = sessionStorage.getItem('pending_qr_token');
      if (pendingToken) {
        sessionStorage.removeItem('pending_qr_token');
        router.push(`/student/scan?token=${pendingToken}`);
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0a1628, #1a2744, #0d2137)' }}>

      {/* Animated orbs */}
      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #059669, transparent)', top: '-5rem', right: '-5rem', animation: 'pulse 3s ease-in-out infinite' }} />
      <div className="absolute w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0891b2, transparent)', bottom: '-5rem', left: '-5rem', animation: 'pulse 5s ease-in-out infinite' }} />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-4 bg-white p-2"
            style={{ boxShadow: '0 0 40px rgba(5,150,105,0.5)' }}>
            <Image
              src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
              alt="UET Peshawar"
              width={80}
              height={80}
              className="object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
            UET Peshawar
          </h1>
          <p className="text-emerald-300 mt-1 text-sm font-semibold">Student Attendance Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 backdrop-blur-xl border border-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}>

          <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>Student Login</h2>
          <p className="text-gray-400 text-sm mb-6">Sign in to mark your attendance</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium text-red-300 border border-red-500/30"
              style={{ background: 'rgba(239,68,68,0.1)' }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="student@uetpeshawar.edu.pk"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none transition-all border border-white/10 focus:border-green-500/50"
                style={{ background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none transition-all border border-white/10 focus:border-green-500/50"
                style={{ background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{
                background: loading ? 'rgba(5,150,105,0.5)' : 'linear-gradient(135deg, #059669, #0891b2)',
                boxShadow: '0 0 30px rgba(5,150,105,0.4)',
                fontFamily: 'var(--font-poppins)'
              }}>
              {loading ? '⏳ Signing In...' : '🚀 Sign In'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-4 text-center">
            <p className="text-gray-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/student/signup" className="text-emerald-400 font-bold hover:text-emerald-300">
                Sign Up
              </Link>
            </p>
            <div className="pt-4 border-t border-white/10">
              <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-white transition-colors">
                👩‍🏫 Go to Teacher Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
