"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  Eye, 
  EyeOff, 
  Zap, 
  ShieldAlert, 
  Sparkles,
  Key
} from 'lucide-react';
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
          <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 animate-in fade-in duration-200">
            <ShieldAlert size={16} className="text-red-400 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Email address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 transition-colors group-focus-within:text-emerald-400 pointer-events-none" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@whispernet.dev"
              className="w-full rounded-xl py-3 pr-4 pl-10 text-xs bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              Master password
            </label>
            <span className="text-[11px] text-slate-500 font-mono">Argon2id Hash</span>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 transition-colors group-focus-within:text-emerald-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl py-3 pr-11 pl-10 text-xs bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* One-Click Demo Accounts Pre-fill Pill Bar */}
        <div className="pt-1">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Zap size={12} className="text-amber-400" />
              <span>1-Click Test Login:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoFill('alice')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-medium transition-all"
              >
                Alice
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('bob')}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-medium transition-all"
              >
                Bob
              </button>
            </div>
          </div>
        </div>

        {/* Hero Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-px font-semibold text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none mt-2"
        >
          <div className="relative flex items-center justify-center gap-2 rounded-[11px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 px-4 py-3 text-xs font-bold tracking-tight text-slate-950 transition-colors">
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-slate-950" />
                <span>Decrypting RAM Vault...</span>
              </>
            ) : (
              <>
                <span>Unlock Vault & Sign In</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1 text-slate-950" />
              </>
            )}
          </div>
        </button>
      </form>
    </ModernAuthLayout>
  );
}
