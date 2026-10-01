'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Shield, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  Terminal, 
  ArrowRight, 
  Sparkles,
  Cpu,
  Layers,
  Fingerprint,
  Zap,
  Globe,
  Check
} from 'lucide-react';
import { WhisperNetLogo } from './WhisperNetLogo';

// Dynamically import GradientWaves so it renders purely on client WebGL
const GradientWaves = dynamic(() => import('./GradientWaves'), { ssr: false });

export type ModernAuthLayoutProps = {
  mode: 'login' | 'register';
  children: React.ReactNode;
};

export function ModernAuthLayout({ mode, children }: ModernAuthLayoutProps) {
  const isLogin = mode === 'login';
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#050811] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 font-sans">
      {/* Background Layer 1: WebGL Gradient Waves */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-screen">
        {mounted && (
          <GradientWaves
            horizonColor="#050811"
            waveColor="#05251d"
            crestColor="#10b981"
            speed={0.35}
            amplitude={0.5}
            waveScale={2.5}
            waveRatio={1.2}
            swell={0.4}
            turbulence={0.5}
            tilt={0.3}
            height={-0.3}
            fogDepth={0.12}
            brightness={0.8}
            opacity={0.6}
            mouseInteraction={true}
            grain={true}
            grainIntensity={0.06}
          />
        )}
      </div>

      {/* Background Layer 2: Interactive Ambient Cursor Light Spotlight */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.04) 40%, transparent 70%)`
        }}
      />

      {/* Background Layer 3: Cyber-Grid and Angular Neon Lights */}
      <div className="absolute inset-0 cyber-grid opacity-25 pointer-events-none z-0" />
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[650px] rounded-full opacity-20 blur-[140px] z-0"
        style={{ background: 'radial-gradient(circle, #10b981 0%, #06b6d4 40%, transparent 70%)' }}
      />

      {/* Top Floating Navigation Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <WhisperNetLogo size={36} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                WhisperNet
              </span>
              <span className="rounded-full px-2 py-0.2 text-[9px] font-semibold tracking-wider font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                v1.0 E2EE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight">Zero-Knowledge Messaging</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/security"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all shadow-sm"
          >
            <Terminal size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">Security Lab</span>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Server Zero-Knowledge</span>
            <span className="sm:hidden">Active</span>
          </div>
        </div>
      </header>

      {/* Main Center Stage: Glassmorphic Vault Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[460px] animate-in fade-in zoom-in-95 duration-500">
          {/* Card Container with Specular Highlight and Glow */}
          <div className="relative rounded-3xl border border-white/[0.08] bg-[#0b101e]/85 backdrop-blur-3xl shadow-[0_20px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(16,185,129,0.08)] overflow-hidden transition-all duration-300 hover:border-emerald-500/25">
            {/* Top Glowing Bevel Line */}
            <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

            {/* Inner Padding Container */}
            <div className="p-6 sm:p-9">
              {/* Center Logo & Brand Identity */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-3.5">
                  <div 
                    className="absolute -inset-3 rounded-full opacity-60 blur-lg animate-pulse-glow"
                    style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(6, 182, 212, 0.2) 60%, transparent 80%)' }}
                  />
                  <WhisperNetLogo size={56} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{isLogin ? 'Access Cryptographic Vault' : 'Create Identity'}</span>
                </h1>
                <p className="mt-1.5 text-xs text-slate-400 max-w-[320px] leading-relaxed">
                  {isLogin
                    ? 'Authenticate to derive RSA keys and decrypt peer sessions.'
                    : 'Initialize your 3072-bit client keys via Web Crypto API.'}
                </p>
              </div>

              {/* Segmented Controller Tab Switcher */}
              <div className="mb-6 p-1 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-1 shadow-inner">
                <Link
                  href="/login"
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    isLogin
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock size={13} className={isLogin ? 'text-emerald-400' : 'text-slate-500'} />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    !isLogin
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound size={13} className={!isLogin ? 'text-emerald-400' : 'text-slate-500'} />
                  <span>Create Account</span>
                </Link>
              </div>

              {/* Form Body Injection */}
              <div className="relative">
                {children}
              </div>

              {/* Subtle Switch Link */}
              <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-slate-400">
                {isLogin ? (
                  <p>
                    Don&apos;t have an identity yet?{' '}
                    <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors">
                      Generate keys now
                    </Link>
                  </p>
                ) : (
                  <p>
                    Already generated a keypair?{' '}
                    <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors">
                      Sign in to your vault
                    </Link>
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Security Guarantee Strip */}
            <div className="bg-[#070b16] px-6 py-3.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Shield size={12} />
                <span>Zero Server Plaintext</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Cpu size={12} />
                <span>RSA-OAEP 3072</span>
              </div>
            </div>
          </div>

          {/* Under-Card Feature Badges */}
          <div className="mt-6 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 backdrop-blur-md">
              <div className="text-xs font-bold text-white">E2EE Stream</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">AES-256-GCM</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 backdrop-blur-md">
              <div className="text-xs font-bold text-emerald-400">WebCrypto</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">In-Memory Keys</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 backdrop-blur-md">
              <div className="text-xs font-bold text-cyan-400">PostgreSQL</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ciphertext Only</div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Legal / Technical Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-white/5">
        <p>© 2026 WhisperNet. End-to-End Encrypted Communications. MIT License.</p>
        <div className="flex items-center gap-4 text-xs font-mono">
          <Link href="/security" className="hover:text-emerald-400 transition-colors">
            Audit Cryptography
          </Link>
          <span>•</span>
          <span className="text-slate-400">W3C SubtleCrypto Spec</span>
        </div>
      </footer>
    </div>
  );
}

export default ModernAuthLayout;
