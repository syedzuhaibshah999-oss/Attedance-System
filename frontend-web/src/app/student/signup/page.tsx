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
          tenant_name: 'UET Peshawar'
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/student?registered=true');
      } else {
        const errMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        // Show a clear message when account already exists
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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-10"
      style={{background: 'linear-gradient(135deg, #07111f 0%, #102b35 52%, #08251f 100%)'}}>

      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{background: 'radial-gradient(circle, #059669, transparent)', top: '-10%', left: '-10%'}} />
      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{background: 'radial-gradient(circle, #0891b2, transparent)', bottom: '-10%', right: '-10%'}} />

      <div className="z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-4 bg-white p-2"
            style={{boxShadow: '0 0 30px rgba(5,150,105,0.4)'}}>
            <Image
              src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/University_of_Engineering_and_Technology_Peshawar_logo.svg/250px-University_of_Engineering_and_Technology_Peshawar_logo.svg.png"
              alt="UET Peshawar"
              width={80}
              height={80}
              className="object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight" style={{fontFamily: 'var(--font-poppins)'}}>Student Sign Up</h1>
          <p className="text-emerald-300 mt-2 text-sm font-semibold">UET Peshawar Attendance System</p>
        </div>

        <form onSubmit={handleSignup} className="rounded-3xl p-8 border border-white/10 backdrop-blur-xl"
          style={{background: 'rgba(8, 24, 34, 0.78)', boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'}}>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="full-name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none border border-white/10 focus:border-emerald-500/50 transition-all bg-white/5"
                placeholder="Your Full Name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">University Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none border border-white/10 focus:border-emerald-500/50 transition-all bg-white/5"
                placeholder="student@uetpeshawar.edu.pk"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none border border-white/10 focus:border-emerald-500/50 transition-all bg-white/5"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Fixed institution badge */}
          <div className="mt-5 px-4 py-3 rounded-xl border border-emerald-500/30 flex items-center gap-3"
            style={{background: 'rgba(5,150,105,0.08)'}}>
            <span className="text-xl">🏛️</span>
            <div>
              <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Institution</p>
              <p className="text-white text-sm font-semibold">UET Peshawar</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
            style={{background: 'linear-gradient(135deg, #059669, #0891b2)', boxShadow: '0 0 20px rgba(5,150,105,0.4)'}}>
            {loading ? 'Creating account...' : 'Create Student Account'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/student" className="text-emerald-400 font-bold hover:text-emerald-300">
                Log In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
