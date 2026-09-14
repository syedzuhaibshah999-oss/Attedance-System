"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

async function getDeviceFingerprint(): Promise<string> {
  const raw = [
    navigator.userAgent,
    screen.width, screen.height, screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.hardwareConcurrency || 0,
  ].join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function TeacherSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fingerprint = await getDeviceFingerprint();

      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role: 'teacher',
          tenant_name: 'Department of Software Engineering UET PESHAWAR',
          device_fingerprint: fingerprint,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        const errMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        if (errMsg?.toLowerCase().includes('already registered')) {
          setError('This email is already registered. Please log in instead.');
        } else {
          setError(errMsg || 'Failed to register');
        }
      }
    } catch {
      setError('Network error. Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-slate-100 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              <Image
                src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
                alt="Department of Software Engineering UET PESHAWAR" width={32} height={32} className="object-contain" unoptimized
              />
            </div>
            <span className="font-bold text-slate-900 text-sm">Department of Software Engineering UET PESHAWAR</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-md mb-5 overflow-hidden">
              <Image
                src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
                alt="Department of Software Engineering UET PESHAWAR" width={70} height={70} className="object-contain" unoptimized
              />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Teacher Registration</h1>
            <p className="text-slate-500 mt-1 text-sm">Create your teacher account</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
            {/* Warning notice */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-6">
              <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
              <div>
                <p className="text-xs font-semibold text-amber-800">Restricted Access</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Only pre-authorized UET faculty emails can register. Your device will be permanently linked to this account.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-700 border border-red-200 bg-red-50">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white text-sm"
                  placeholder="Prof. Your Name" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white text-sm"
                  placeholder="teacher@uetpeshawar.edu.pk" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white text-sm"
                  placeholder="••••••••" required />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <span>🏛️</span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Institution (Fixed)</p>
                  <p className="text-sm font-bold text-slate-900">Department of Software Engineering UET PESHAWAR</p>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 bg-blue-600 mt-2">
                {loading ? 'Creating Account...' : '🚀 Create Teacher Account'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


