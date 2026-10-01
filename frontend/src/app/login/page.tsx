"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Sparkles, Key } from 'lucide-react';
import { ModernAuthLayout } from '@/components/ui/modern-login-signup';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleDemoFill = (demoUser: 'alice' | 'bob') => {
    if (demoUser === 'alice') {
      setEmail('alice@whispernet.dev');
      setPassword('SecretPass123!');
    } else {
      setEmail('bob@whispernet.dev');
      setPassword('SecretPass123!');
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data &&
        typeof err.response.data.error === 'string'
          ? err.response.data.error
          : 'Invalid credentials or connection error';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModernAuthLayout mode="login">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert Box */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full rounded-xl py-2.5 pr-4 pl-10 text-xs bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              Master password
            </label>
            <span className="text-[11px] text-slate-500">Argon2id Protected</span>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl py-2.5 pr-10 pl-10 text-xs bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Quick Demo Pre-fill for Testing & Review */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span className="text-slate-500">Quick Test Autofill:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('alice')}
                className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors text-[10px] font-mono"
              >
                Alice
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('bob')}
                className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 hover:text-cyan-400 transition-colors text-[10px] font-mono"
              >
                Bob
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl py-2.5 px-4 font-semibold text-xs transition-all flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] active:scale-[0.99] disabled:opacity-50 mt-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin text-slate-950" />
              <span>Decrypting Session Key…</span>
            </>
          ) : (
            <>
              <span>Sign In to WhisperNet</span>
              <ArrowRight className="size-3.5" />
            </>
          )}
        </button>
      </form>
    </ModernAuthLayout>
  );
}
