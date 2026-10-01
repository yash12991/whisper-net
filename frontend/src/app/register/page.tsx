"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Mail, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  Loader2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert,
  Sparkles,
  Cpu,
  Dice5
} from 'lucide-react';
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

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0: return { label: 'Too Weak', color: 'text-slate-500' };
      case 1: return { label: 'Weak', color: 'text-red-400' };
      case 2: return { label: 'Fair', color: 'text-amber-400' };
      case 3: return { label: 'Strong', color: 'text-cyan-400' };
      case 4: return { label: 'Cryptographically Resilient', color: 'text-emerald-400' };
      default: return { label: '', color: '' };
    }
  };

  const handleRandomFill = () => {
    const randomSuffix = Math.floor(Math.random() * 900 + 100);
    setUsername(`cryptouser_${randomSuffix}`);
    setEmail(`user_${randomSuffix}@whispernet.dev`);
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
          <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 animate-in fade-in duration-200">
            <ShieldAlert size={16} className="text-red-400 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Username Field */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">
            Username
          </label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 transition-colors group-focus-within:text-emerald-400 pointer-events-none" />
            <input
              type="text"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Satoshi"
              className="w-full rounded-xl py-2.5 pr-4 pl-10 text-xs bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1">
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
              placeholder="you@domain.com"
              className="w-full rounded-xl py-2.5 pr-4 pl-10 text-xs bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              Vault password
            </label>
            <span className="text-[11px] text-slate-500 font-mono">Min 8 chars</span>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 transition-colors group-focus-within:text-emerald-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl py-2.5 pr-11 pl-10 text-xs bg-slate-900/90 border border-white/10 text-white placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20"
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

          {/* Password Strength Gauge */}
          {password && (
            <div className="pt-1.5 space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-mono">Entropy:</span>
                <span className={`font-mono font-medium ${getStrengthLabel(strength).color}`}>
                  {getStrengthLabel(strength).label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-full rounded-full transition-all duration-300 ${
                      strength >= level
                        ? level === 1
                          ? 'bg-red-500'
                          : level === 2
                          ? 'bg-amber-500'
                          : level === 3
                          ? 'bg-cyan-500'
                          : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cryptographic Keypair Generation Banner */}
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-300/90">
          <Cpu className="size-4 shrink-0 text-emerald-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white font-medium">Zero-Knowledge Keygen:</strong> An RSA-OAEP 3072-bit keypair will be generated in your browser RAM. Your private key is never transmitted.
          </p>
        </div>

        {/* Quick Demo Pre-fill for Review */}
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className="text-slate-500">Need a quick test profile?</span>
          <button
            type="button"
            onClick={handleRandomFill}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-[10px] font-mono transition-colors"
          >
            <Dice5 size={12} className="text-emerald-400" />
            <span>Generate Random User</span>
          </button>
        </div>

        {/* Hero Submit Button */}
        <button
          type="submit"
          disabled={isGeneratingKeys}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-px font-semibold text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none mt-2"
        >
          <div className="relative flex items-center justify-center gap-2 rounded-[11px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 px-4 py-3 text-xs font-bold tracking-tight text-slate-950 transition-colors">
            {isGeneratingKeys ? (
              <>
                <Loader2 size={16} className="animate-spin text-slate-950" />
                <span>Generating 3072-bit RSA Keys in RAM...</span>
              </>
            ) : (
              <>
                <KeyRound size={15} className="text-slate-950" />
                <span>Generate Keys & Create Account</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1 text-slate-950" />
              </>
            )}
          </div>
        </button>
      </form>
    </ModernAuthLayout>
  );
}
