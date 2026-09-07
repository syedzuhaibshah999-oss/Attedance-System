"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function Signup() {
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
          role: 'teacher',
          tenant_name: 'UET Peshawar'
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        const errMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        // Show a friendlier message for duplicate accounts
        if (errMsg?.toLowerCase().includes('already registered') || errMsg?.toLowerCase().includes('already exists')) {
          setError('This email is already registered. Please log in instead.');
        } else {
          setError(errMsg || 'Failed to register');
        }
      }
    } catch (err: any) {
      setError('Network error. Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>

      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{background: 'radial-gradient(circle, #7c3aed, transparent)', top: '-10%', left: '-10%'}} />
      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{background: 'radial-gradient(circle, #2563eb, transparent)', bottom: '-10%', right: '-10%'}} />

      <div className="z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-4 bg-white p-2"
            style={{boxShadow: '0 0 30px rgba(124,58,237,0.4)'}}>
            <Image
              src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
              alt="UET Peshawar"
              width={80}
              height={80}
              className="object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight" style={{fontFamily: 'var(--font-poppins)'}}>Teacher Sign Up</h1>
          <p className="text-violet-300 mt-1 text-sm font-semibold">UET Peshawar Attendance System</p>
        </div>

        <form onSubmit={handleSignup} className="rounded-3xl p-8 border border-white/10 backdrop-blur-xl"
          style={{background: 'rgba(255,255,255,0.03)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'}}>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none border border-white/10 focus:border-violet-500/50 transition-all bg-white/5"
                placeholder="Your Full Name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none border border-white/10 focus:border-violet-500/50 transition-all bg-white/5"
                placeholder="teacher@uetpeshawar.edu.pk"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none border border-white/10 focus:border-violet-500/50 transition-all bg-white/5"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Fixed institution badge */}
          <div className="mt-5 px-4 py-3 rounded-xl border border-violet-500/30 flex items-center gap-3"
            style={{background: 'rgba(124,58,237,0.08)'}}>
            <span className="text-xl">🏛️</span>
            <div>
              <p className="text-violet-300 text-xs font-bold uppercase tracking-wider">Institution</p>
              <p className="text-white text-sm font-semibold">UET Peshawar</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
            style={{background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 20px rgba(124,58,237,0.4)'}}>
            {loading ? 'Creating Account...' : 'Create Teacher Account'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-400 font-bold hover:text-violet-300">
                Log In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
