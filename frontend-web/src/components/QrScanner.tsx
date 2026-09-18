"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (token: string) => void;
  onClose: () => void;
}

type QrCodeInstance = {
  start: (
    cameraConfig: { facingMode: string },
    config: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onError: () => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
};

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const scannerRef = useRef<QrCodeInstance | null>(null);
  const isScanningRef = useRef(false);
  const onScanRef = useRef(onScan);
  const containerId = "qr-reader";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let html5QrCode: QrCodeInstance;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        let scanned = false;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            if (scanned) return;
            scanned = true;

            // Extract token from URL if encoded as full URL
            let token = decodedText;
            try {
              const url = new URL(decodedText);
              const t = url.searchParams.get("token");
              if (t) token = t;
            } catch {
              // not a URL, use raw text as token
            }
            try {
              html5QrCode.stop().catch(() => {});
            } catch {}
            onScanRef.current(token);
          },
          () => {} // ignore frame errors
        );
        isScanningRef.current = true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Camera access denied. Please allow camera permissions.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-sm rounded-3xl p-6 border border-white/10"
        style={{ background: "rgba(15,12,41,0.95)", boxShadow: "0 0 60px rgba(5,150,105,0.3), 0 25px 50px rgba(0,0,0,0.8)" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-black text-white" style={{ fontFamily: "var(--font-ui)" }}>
              📷 Scan QR Code
            </h3>
              <p className="text-gray-400 text-xs mt-0.5">Point your camera at the teacher&apos;s QR code</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
        </div>

        {/* Top accent bar */}
        <div className="absolute top-0 left-6 right-6 h-0.5 rounded-full"
          style={{ background: "linear-gradient(90deg, #059669, #0891b2)" }} />

        {error ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="text-5xl">🚫</div>
            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-white/10"
              style={{ background: "rgba(255,255,255,0.05)" }}>Close</button>
          </div>
        ) : (
          <>
            {/* Scanner viewfinder */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30"
              style={{ boxShadow: "0 0 30px rgba(5,150,105,0.2)" }}>
              <div id={containerId} className="w-full" />
              {/* Corner decorators */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg pointer-events-none" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg pointer-events-none" />
            </div>

            <div className="mt-5 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-emerald-400 text-xs font-medium">Camera active — scanning...</p>
              </div>
              <button 
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 hover:text-red-300 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                🛑 Stop Camera
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


