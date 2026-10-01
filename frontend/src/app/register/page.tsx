"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Lock, KeyRound, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { ModernAuthLayout } from '@/components/ui/modern-login-signup';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleDemoFill = () => {
    const randomSuffix = Math.floor(Math.random() * 900 + 100);
    setUsername(`cryptouser_${randomSuffix}`);
    setEmail(`user${randomSuffix}@whispernet.dev`);
    setPassword('MasterKey2026!');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (strength < 2) {
      return setError(
        'Password is too weak. Please use at least 8 characters with numbers or symbols.',
      );
    }

    try {
      setIsGeneratingKeys(true);
      await register(username, email, password);
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
          : 'Registration failed. Username or email may already be registered.';
      setError(message);
      setIsGeneratingKeys(false);
    }
  };

  return (
    <ModernAuthLayout mode="register">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Error Alert Box */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {/* Username Field */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Satoshi"
              className="w-full rounded-xl py-2.5 pr-4 pl-10 text-xs bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1">
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
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">
            Master password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create strong passphrase"
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

        {/* Password Strength Gauge */}
        {password.length > 0 && (
          <div className="space-y-1 pt-0.5">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor:
                      strength >= step
                        ? strength <= 1
                          ? '#ef4444'
                          : strength <= 2
                          ? '#f59e0b'
                          : '#10b981'
                        : 'rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Entropy Strength</span>
              <span className="font-semibold text-slate-300">
                {strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'}
              </span>
            </div>
          </div>
        )}

        {/* Cryptographic Keygen Feedback Notification */}
        {isGeneratingKeys && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300 animate-pulse">
            <KeyRound className="size-5 shrink-0 animate-spin text-emerald-400" />
            <div>
              <p className="font-bold text-white">Computing 3072-bit RSA Keypair…</p>
              <p className="text-[10px] text-emerald-400/80">Using browser W3C SubtleCrypto. Private key stays in RAM.</p>
            </div>
          </div>
        )}

        {/* Quick Demo Pre-fill */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="text-slate-500">Need test account?</span>
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
          >
            Autofill Random
          </button>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isGeneratingKeys}
          className="w-full rounded-xl py-2.5 px-4 font-semibold text-xs transition-all flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] active:scale-[0.99] disabled:opacity-50 mt-1"
        >
          {isGeneratingKeys ? (
            <>
              <Loader2 className="size-4 animate-spin text-slate-950" />
              <span>Generating Secure Keys…</span>
            </>
          ) : (
            <>
              <span>Initialize Identity & Sign Up</span>
              <ArrowRight className="size-3.5" />
            </>
          )}
        </button>
      </form>
    </ModernAuthLayout>
  );
}
