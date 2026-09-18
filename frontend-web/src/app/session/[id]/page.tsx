"use client";

import { useSearchParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { getApiBase } from '@/lib/api';

function SessionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(120);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [decodedToken, setDecodedToken] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ title: 'Attendance QR Code', files: [file] }); return; }
        catch { /* fall through */ }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'attendance-qr.png';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('loading');
    setUploadMsg('');
    const authToken = localStorage.getItem('token');
    if (!authToken) { router.push('/login'); return; }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${getApiBase()}/attendance/scan-qr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setDecodedToken(data.decoded_token);
        setUploadStatus('success');
        setUploadMsg(`QR decoded successfully! Token: ${data.decoded_token}`);
      } else {
        setUploadStatus('error');
        setUploadMsg(data.detail || 'Failed to decode QR image');
      }
    } catch {
      setUploadStatus('error');
      setUploadMsg('Network error — could not reach server');
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / 120) * 100;

  if (!token) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-slate-700 font-semibold">Invalid session — no token provided</p>
        <button onClick={() => router.push('/dashboard')} className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );

  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/student/scan?token=${token}`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">Session Active</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: QR Code */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Scan to Attend</h1>
            <p className="text-slate-500 text-sm mb-6">Students scan this QR code to mark their attendance</p>

            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6">
              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-xl shadow-md border border-slate-100">
                  <QRCodeCanvas
                    id="session-qr"
                    value={qrUrl}
                    size={210}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                    level="H"
                  />
                </div>
              </div>

              {/* Timer */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">⏱ Expires in</span>
                  <span className={`text-xl font-black tabular-nums ${
                    timeLeft <= 30 ? 'text-red-600' : timeLeft <= 60 ? 'text-amber-600' : 'text-slate-900'
                  }`}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${progress}%`,
                      background: timeLeft <= 30
                        ? '#dc2626'
                        : timeLeft <= 60
                        ? '#d97706'
                        : '#2563eb'
                    }}
                  />
                </div>
              </div>

              {/* Token */}
              <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 flex items-center justify-between gap-3 mb-4">
                <div className="truncate">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Token</p>
                  <p className="text-blue-600 text-sm font-mono truncate">{token}</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(qrUrl); alert('Link copied!'); }}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Copy
                </button>
              </div>

              {/* Share buttons */}
              <div className="flex gap-2">
                <button
                  onClick={shareQrImage}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  📸 Download QR
                </button>
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`Mark attendance here:\n${qrUrl}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  💬 WhatsApp
                </button>
              </div>
            </div>

            {/* Expired warning */}
            {timeLeft <= 0 && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-red-700 text-sm font-medium">QR has expired. Go back and start a new session.</p>
              </div>
            )}
          </div>

          {/* Right: QR Upload + Manual decode */}
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">FastAPI QR Decode</h2>
            <p className="text-slate-500 text-sm mb-6">
              Upload a QR code image — the server decodes it directly using Python
            </p>

            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors p-8 text-center mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrUpload}
              />
              <div className="text-4xl mb-3">📷</div>
              <p className="text-slate-700 font-semibold text-sm mb-1">Upload QR Image</p>
              <p className="text-slate-400 text-xs mb-4">PNG, JPG, WEBP supported</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadStatus === 'loading'}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {uploadStatus === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Decoding...
                  </span>
                ) : 'Choose Image'}
              </button>
            </div>

            {/* Upload result */}
            {uploadStatus === 'success' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-600">✅</span>
                  <p className="text-emerald-800 font-semibold text-sm">QR Decoded Successfully!</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Decoded Token</p>
                  <p className="text-blue-600 font-mono text-sm break-all">{decodedToken}</p>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">❌</span>
                  <p className="text-red-700 text-sm font-medium">{uploadMsg}</p>
                </div>
              </div>
            )}

            {/* Info card */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-semibold text-blue-800 mb-2">How it works</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>1. Upload any QR code image</li>
                <li>2. FastAPI uses <code className="bg-blue-100 px-1 rounded">pyzbar</code> to decode it server-side</li>
                <li>3. The embedded attendance token is extracted</li>
                <li>4. Use the token to mark a student&apos;s attendance</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}

