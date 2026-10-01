'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  Terminal, 
  ArrowRight, 
  Check, 
  Copy,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { theme } from '@/lib/theme';
import { WhisperNetLogo } from './WhisperNetLogo';

export type ModernAuthLayoutProps = {
  mode: 'login' | 'register';
  children: React.ReactNode;
};

export function ModernAuthLayout({ mode, children }: ModernAuthLayoutProps) {
  const isLogin = mode === 'login';
  const [copiedKey, setCopiedKey] = useState(false);

  const sampleKey = "30820122300d06092a864886f70d01010105000382010f003082010a0282010100c5a...";

  return (
    <div className="min-h-screen w-full flex bg-[#070a12] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 font-sans">
      {/* Left Column: Technical Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden border-r border-white/5 bg-[#090e1a]">
        {/* Subtle Ambient Background Gradients */}
        <div 
          className="pointer-events-none absolute -top-32 -left-32 size-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
        />
        <div 
          className="pointer-events-none absolute -bottom-32 -right-32 size-[500px] rounded-full opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        />

        {/* Cyber-Grid Pattern Overlay */}
        <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />

        {/* Top Brand & Version Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WhisperNetLogo size={44} />
            <div>
              <span className="text-lg font-bold tracking-tight text-white">WhisperNet</span>
              <span className="block text-[11px] font-mono text-slate-400">Cryptographic Protocol v1.0</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full px-3 py-1 bg-white/[0.03] border border-white/10 text-[11px] font-mono text-slate-300">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Zero-Knowledge Server</span>
          </div>
        </div>

        {/* Center: Live Architecture Handshake Visualizer */}
        <div className="relative z-10 my-auto py-8 max-w-xl">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                End-to-End Encryption Architecture
              </span>
              <h2 className="mt-2 text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Private messaging without a trusted intermediary.
              </h2>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Keys are generated exclusively in client RAM via the W3C Web Cryptography API. 
                Plaintext never transits the wire or lands on the database.
              </p>
            </div>

            {/* Simulated Live Handshake Console */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1424]/90 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-emerald-400" />
                  <span className="font-mono font-medium text-slate-300">handshake_verification.ts</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  AEAD Verified
                </span>
              </div>

              {/* Code / Protocol Log Steps */}
              <div className="mt-3 space-y-2 font-mono text-[11px] text-slate-300">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-slate-500">1. Client Keygen</span>
                  <span className="text-emerald-400">RSA-OAEP 3072-bit (SHA-256)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-slate-500">2. Session Key</span>
                  <span className="text-cyan-400">AES-256-GCM Ephemeral</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-slate-500">3. Nonce Entropy</span>
                  <span className="text-indigo-400">96-bit CSPRNG (Single-use)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-slate-500">4. Rotation Threshold</span>
                  <span className="text-amber-400">Every 30 Messages</span>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="truncate max-w-[280px] text-slate-500">Fingerprint: {sampleKey}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(sampleKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                <div className="text-lg font-bold text-white">0 bytes</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Plaintext Stored</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                <div className="text-lg font-bold text-emerald-400">3072-bit</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">RSA Margin</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                <div className="text-lg font-bold text-cyan-400">128-bit</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">GMAC Auth Tag</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Technical Guarantee */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-6">
          <p>© 2026 WhisperNet. Open Source Academic Implementation.</p>
          <div className="flex items-center gap-4">
            <Link href="/security" className="hover:text-slate-300 transition-colors">
              Security Lab
            </Link>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400">PostgreSQL + Prisma</span>
          </div>
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-12 lg:p-16 overflow-y-auto">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden flex items-center justify-between pb-6 mb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <WhisperNetLogo size={32} />
            <span className="font-bold text-white text-base">WhisperNet</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            E2EE
          </span>
        </div>

        {/* Centered Form Wrapper */}
        <div className="mx-auto w-full max-w-[380px] my-auto py-6">
          {/* Top Segmented Tab Switcher */}
          <div className="mb-8 p-1 rounded-xl bg-white/[0.04] border border-white/10 flex items-center">
            <Link
              href="/login"
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
                isLogin
                  ? 'bg-slate-800 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
                !isLogin
                  ? 'bg-slate-800 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </Link>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              {isLogin
                ? 'Enter your credentials to decrypt your active sessions.'
                : 'Generate your 3072-bit cryptographic keys to get started.'}
            </p>
          </div>

          {/* Render Actual Form */}
          {children}

          {/* Direct Switch Link */}
          <div className="mt-6 text-center text-xs text-slate-500">
            {isLogin ? (
              <>
                New to WhisperNet?{' '}
                <Link href="/register" className="font-semibold text-emerald-400 hover:underline">
                  Create an encrypted account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-emerald-400 hover:underline">
                  Sign in instead
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom Security Note */}
        <div className="text-center text-[11px] text-slate-600 mt-6 pt-4 border-t border-white/5">
          <span>Protected by client-side Web Crypto API. Private keys stay in browser RAM.</span>
        </div>
      </div>
    </div>
  );
}

export default ModernAuthLayout;
