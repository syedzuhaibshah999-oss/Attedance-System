"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function StudentSignup() {
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
      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role: 'student',
          tenant_name: 'Department of Software Engineering UET PESHAWAR',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/student?registered=true');
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
            <h1 className="text-2xl font-black text-slate-900">Student Sign Up</h1>
            <p className="text-slate-500 mt-1 text-sm">Create your student account</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
            {error && (
              <div className="mb-5 flex items-start gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-700 border border-red-200 bg-red-50">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-sm"
                  placeholder="Your Full Name" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">University Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-sm"
                  placeholder="student@uetpeshawar.edu.pk" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 outline-none border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-sm"
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
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 bg-emerald-600 mt-2">
                {loading ? 'Creating Account...' : 'Create Student Account'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                Already have an account?{' '}
                <Link href="/student" className="text-emerald-600 font-semibold hover:text-emerald-700">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


