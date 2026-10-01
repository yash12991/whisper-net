'use client';

import Link from 'next/link';
import React from 'react';
import { Shield, Lock, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';
import { theme } from '@/lib/theme';

export type ModernAuthLayoutProps = {
  mode: 'login' | 'register';
  children: React.ReactNode;
};

export const authInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(20, 29, 51, 0.6)',
  color: '#f8fafc',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'all 0.2s ease',
};

export const authSubmitStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: 'none',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: '#ffffff',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
};

export const authErrorStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(239, 68, 68, 0.35)',
  background: 'rgba(239, 68, 68, 0.12)',
  color: '#fca5a5',
  fontSize: '0.825rem',
  textAlign: 'left',
};

export function ModernAuthLayout({ mode, children }: ModernAuthLayoutProps) {
  const isLogin = mode === 'login';

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-12 cyber-grid"
      style={{ background: theme.bg }}
    >
      {/* Ambient background glow orbs */}
      <div 
        className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full opacity-30 blur-3xl animate-pulse-glow"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
      />
      <div 
        className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full opacity-25 blur-3xl animate-pulse-glow"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', animationDelay: '2s' }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div 
          className="glass-panel relative rounded-2xl p-8 shadow-2xl transition-all"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.08)'
          }}
        >
          {/* Header Brand */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div 
              className="mb-3 flex size-14 items-center justify-center rounded-2xl border shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Shield className="size-7" style={{ color: theme.accent }} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              WhisperNet
              <span 
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  color: theme.accent, 
                  border: '1px solid rgba(16, 185, 129, 0.3)' 
                }}
              >
                E2EE
              </span>
            </h1>

            <p className="mt-1.5 text-xs" style={{ color: theme.textMuted }}>
              {isLogin
                ? 'Sign in to access your encrypted conversations.'
                : 'Generate your 3072-bit cryptographic keys to get started.'}
            </p>
          </div>

          {/* Form Content */}
          <div className="w-full">
            {children}
          </div>

          {/* Switch Mode Link */}
          <div className="mt-6 text-center text-xs" style={{ color: theme.textMuted }}>
            {isLogin ? (
              <>
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold transition-colors hover:underline"
                  style={{ color: theme.accent }}
                >
                  Create one now
                </Link>
              </>
            ) : (
              <>
                Already registered?{' '}
                <Link
                  href="/login"
                  className="font-semibold transition-colors hover:underline"
                  style={{ color: theme.accent }}
                >
                  Sign in to your account
                </Link>
              </>
            )}
          </div>

          {/* Security Features Pill Bar */}
          <div 
            className="mt-6 flex items-center justify-around rounded-xl p-2.5 border text-[11px]"
            style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderColor: 'rgba(255, 255, 255, 0.06)',
              color: theme.textDim
            }}
          >
            <div className="flex items-center gap-1.5">
              <Lock className="size-3 text-emerald-400" />
              <span>AES-256-GCM</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <KeyRound className="size-3 text-cyan-400" />
              <span>3072-bit RSA</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3 text-amber-400" />
              <span>Zero Knowledge</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-4 text-center text-[11px]" style={{ color: theme.textDim }}>
          Protected by client-side Web Crypto API. Plaintext never leaves your browser.
        </p>
      </div>
    </div>
  );
}

export default ModernAuthLayout;
