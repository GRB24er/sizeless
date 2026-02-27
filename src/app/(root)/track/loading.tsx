"use client";

import { useEffect, useState } from "react";

export default function Loading() {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing secure connection...");

  useEffect(() => {
    const statuses = [
      "Initializing secure connection...",
      "Authenticating session...",
      "Loading shipment data...",
      "Syncing tracking updates...",
      "Preparing dashboard...",
    ];
    let currentStatus = 0;
    const statusInterval = setInterval(() => {
      currentStatus = (currentStatus + 1) % statuses.length;
      setStatusText(statuses[currentStatus]);
    }, 1500);
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 15));
    }, 300);
    return () => { clearInterval(statusInterval); clearInterval(progressInterval); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A1628] via-[#0D1F35] to-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(5,150,105,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(5,150,105,0.1) 1px, transparent 1px)`, backgroundSize: "60px 60px", animation: "gridMove 20s linear infinite" }} />
      </div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "0.5s" }} />

      <div className="relative z-10 text-center">
        <div className="mb-12">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full border-2 border-transparent" style={{ borderTopColor: "rgba(5,150,105,0.8)", borderRightColor: "rgba(5,150,105,0.3)", animation: "spin 2s linear infinite" }} />
            <div className="absolute w-24 h-24 rounded-full border border-emerald-500/40" style={{ animation: "pulse 2s ease-in-out infinite" }} />
            <div className="absolute w-16 h-16 rounded-full border-2 border-transparent" style={{ borderBottomColor: "rgba(212,168,83,0.8)", borderLeftColor: "rgba(212,168,83,0.3)", animation: "spin 1.5s linear infinite reverse" }} />
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-light tracking-[0.3em] text-white/90 mb-2" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>ARAMEXLOGISTICS</h1>
        <p className="text-xs tracking-[0.5em] text-emerald-400/80 uppercase mb-12">Global Logistics & Vault Services</p>
        <div className="w-80 mx-auto mb-6">
          <div className="h-[2px] bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 rounded-full transition-all duration-300 ease-out relative" style={{ width: `${progress}%` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: "shimmer 1.5s infinite" }} />
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-400 font-light tracking-wide min-h-[20px] transition-opacity duration-300">{statusText}</p>
        <div className="mt-10 flex items-center justify-center gap-2 text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <span className="text-xs tracking-wider">256-BIT ENCRYPTED</span>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.1); opacity: 0.8; } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes gridMove { 0% { transform: translate(0, 0); } 100% { transform: translate(60px, 60px); } }
      `}</style>
    </div>
  );
}
