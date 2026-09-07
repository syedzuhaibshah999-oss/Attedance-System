"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function Login() {
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
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>

      {/* Animated orbs */}
      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
        style={{background: 'radial-gradient(circle, #7c3aed, transparent)', top: '-5rem', left: '-5rem'}} />
      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
        style={{background: 'radial-gradient(circle, #2563eb, transparent)', bottom: '-5rem', right: '-5rem', animationDelay: '1s'}} />
      <div className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl animate-pulse"
        style={{background: 'radial-gradient(circle, #ec4899, transparent)', top: '50%', left: '50%', animationDelay: '2s'}} />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-4 bg-white p-2"
            style={{boxShadow: '0 0 40px rgba(124,58,237,0.5)'}}>
            <Image
              src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
              alt="UET Peshawar"
              width={80}
              height={80}
              className="object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight" style={{fontFamily: 'var(--font-poppins)'}}>
            UET Peshawar
          </h1>
          <p className="text-violet-300 mt-1 text-sm font-semibold">Attendance Management System</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 backdrop-blur-xl border border-white/10"
          style={{background: 'rgba(255,255,255,0.05)', boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'}}>

          <h2 className="text-2xl font-bold text-white mb-1" style={{fontFamily: 'var(--font-poppins)'}}>Teacher Login</h2>
          <p className="text-gray-400 text-sm mb-6">Sign in to your teacher dashboard</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium text-red-300 border border-red-500/30"
              style={{background: 'rgba(239,68,68,0.1)'}}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="teacher@uetpeshawar.edu.pk"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none transition-all border border-white/10 focus:border-violet-500/50"
                style={{background: 'rgba(255,255,255,0.07)', fontFamily: 'var(--font-inter)'}}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none transition-all border border-white/10 focus:border-violet-500/50"
                style={{background: 'rgba(255,255,255,0.07)', fontFamily: 'var(--font-inter)'}}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{
                background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #2563eb)',
                boxShadow: '0 0 30px rgba(124,58,237,0.4)',
                fontFamily: 'var(--font-poppins)'
              }}
            >
              {loading ? '⏳ Signing In...' : '🚀 Sign In'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-4 text-center">
            <div className="pt-4 border-t border-white/10">
              <Link href="/student" className="text-sm font-medium text-gray-500 hover:text-white transition-colors">
                👨‍🎓 Go to Student Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
