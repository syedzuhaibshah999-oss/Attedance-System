"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

async function getDeviceFingerprint(): Promise<string> {
  // Simple stable fingerprint: hash of user agent + screen info + timezone
  const raw = [
    navigator.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.hardwareConcurrency || 0,
  ].join('|');

  // Use SubtleCrypto for a proper hash
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function TeacherLogin() {
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
      const fingerprint = await getDeviceFingerprint();

      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ email, password, device_fingerprint: fingerprint }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      const profileResponse = await fetch(`${getApiBase()}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const profile = await profileResponse.json() as { role?: string };
      
      if (profile.role === 'student') {
        localStorage.removeItem('token');
        throw new Error('Students cannot access the teacher portal. Please use the student portal.');
      }
      
      router.push(profile.role === 'admin' ? '/admin' : '/dashboard');
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
            <h1 className="text-2xl font-black text-slate-900">Teacher Sign In</h1>
            <p className="text-slate-500 mt-1 text-sm">Access your attendance dashboard</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
            {/* Security notice */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 mb-6">
              <span className="text-blue-600 text-lg mt-0.5">🔒</span>
              <div>
                <p className="text-xs font-semibold text-blue-800">Device-Locked Account</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Teacher accounts are bound to the device used at registration.
                </p>
              </div>
            </div>

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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="teacher@uetpeshawar.edu.pk"
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 mt-2 bg-blue-600"
              >
                {loading ? '⏳ Signing In...' : 'Sign In to Dashboard →'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <Link href="/student" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                Go to Student Portal →
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Only authorized UET faculty can access this portal.
          </p>
        </div>
      </main>
    </div>
  );
}


