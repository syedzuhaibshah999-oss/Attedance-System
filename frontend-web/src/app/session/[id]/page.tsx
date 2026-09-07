"use client";

import { useSearchParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function SessionPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(120);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const shareQrImage = async () => {
    const canvas = document.getElementById('session-qr') as HTMLCanvasElement;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'attendance-qr.png', { type: 'image/png' });

      // If Web Share API is available and supports sharing files (mobile/some desktop)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Attendance QR Code',
            text: 'Scan this QR code to mark your attendance',
            files: [file],
          });
          return;
        } catch (err) {
          console.log('Share failed', err);
        }
      }

      // Fallback: Download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance-qr.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / 120) * 100;

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>
      <div className="text-white text-xl">Invalid session</div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>

      {/* Animated orbs */}
      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{background: 'radial-gradient(circle, #7c3aed, transparent)', top: '-5rem', left: '-5rem', animation: 'pulse 3s ease-in-out infinite'}} />
      <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{background: 'radial-gradient(circle, #2563eb, transparent)', bottom: '-5rem', right: '-5rem', animation: 'pulse 4s ease-in-out infinite'}} />

      {/* Back button */}
      <button onClick={() => router.push('/dashboard')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 border border-white/10 hover:text-white hover:border-white/20 transition-all text-sm"
        style={{background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)'}}>
        ← Back to Dashboard
      </button>

      <div className="relative z-10 text-center max-w-lg w-full px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 mb-4"
            style={{background: 'rgba(5,150,105,0.1)'}}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-semibold">Session Active</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white" style={{fontFamily: 'var(--font-poppins)'}}>
            Scan to Mark
          </h1>
          <p className="text-gray-400 mt-2">Students scan this QR code with the mobile app</p>
        </div>

        {/* QR Card */}
        <div className="relative rounded-3xl p-8 border border-white/10 backdrop-blur-xl mx-auto"
          style={{
            background: 'rgba(255,255,255,0.06)',
            boxShadow: '0 0 60px rgba(124,58,237,0.3), 0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}>

          {/* Top gradient bar */}
          <div className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
            style={{background: 'linear-gradient(90deg, #7c3aed, #2563eb, #ec4899)'}} />

          {/* QR Code */}
          <div className="relative inline-block">
            {/* Glow effect behind QR */}
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-50"
              style={{background: 'linear-gradient(135deg, #7c3aed, #2563eb)'}} />
            <div className="relative p-4 rounded-2xl bg-white shadow-2xl"
              style={{boxShadow: '0 0 40px rgba(124,58,237,0.6)'}}>
              <QRCodeCanvas
                id="session-qr"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/student/scan?token=${token}`}
                size={220}
                fgColor="#1a0533"
                level="H"
              />
            </div>
          </div>

          {/* Timer */}
          <div className="mt-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-gray-400 text-sm font-medium">⏱ Expires in</span>
              <span className={`text-2xl font-black tabular-nums ${timeLeft <= 30 ? 'text-red-400' : timeLeft <= 60 ? 'text-yellow-400' : 'text-white'}`}
                style={{fontFamily: 'var(--font-poppins)'}}>
                {String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full overflow-hidden" style={{background: 'rgba(255,255,255,0.1)'}}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progress}%`,
                  background: timeLeft <= 30
                    ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                    : timeLeft <= 60
                    ? 'linear-gradient(90deg, #ca8a04, #eab308)'
                    : 'linear-gradient(90deg, #7c3aed, #2563eb)'
                }} />
            </div>
          </div>

          {/* Token display */}
          <div className="mt-6 px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between gap-3"
            style={{background: 'rgba(0,0,0,0.3)'}}>
            <div className="flex flex-col text-left flex-1 truncate">
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Session Token</span>
              <span className="text-violet-400 text-sm font-mono truncate">{token}</span>
            </div>
            
            {/* Share buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={shareQrImage}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 transition-all text-lg"
                title="Send QR Code Picture"
              >
                📸
              </button>
              <button 
                onClick={() => {
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/student/scan?token=${token}`;
                  navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard!');
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-lg"
                title="Copy Link"
              >
                📋
              </button>
              <button 
                onClick={() => {
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/student/scan?token=${token}`;
                  const text = encodeURIComponent(`Please mark your attendance using this link:\n${url}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-green-500/30 transition-all text-lg"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
                title="Share on WhatsApp"
              >
                💬
              </button>
            </div>
          </div>
        </div>

        {/* Expired message */}
        {timeLeft <= 0 && (
          <div className="mt-6 px-6 py-4 rounded-2xl border border-red-500/30 text-red-300"
            style={{background: 'rgba(239,68,68,0.1)'}}>
            ⚠️ QR Code has expired. Go back and start a new session.
          </div>
        )}
      </div>
    </div>
  );
}
