"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Lock, KeyRound, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import {
  ModernAuthLayout,
  authErrorStyle,
  authInputStyle,
  authSubmitStyle,
} from '@/components/ui/modern-login-signup';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 7) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (strength < 2) {
      return setError(
        'Password is too weak. Please include at least 8 characters, numbers, and symbols.',
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
          : 'Failed to register';
      setError(message);
      setIsGeneratingKeys(false);
    }
  };

  return (
    <ModernAuthLayout mode="register">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && (
          <div role="alert" style={authErrorStyle}>
            {error}
          </div>
        )}

        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            style={{ ...authInputStyle, paddingLeft: '2.75rem' }}
            type="text"
            name="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/60"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            style={{ ...authInputStyle, paddingLeft: '2.75rem' }}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/60"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            style={{ ...authInputStyle, paddingLeft: '2.75rem' }}
            type="password"
            name="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Master password"
            className="focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/60"
          />
        </div>

        {/* Password Strength Meter */}
        {password.length > 0 && (
          <div className="space-y-1.5">
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
                        : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Security strength</span>
              <span className="font-medium text-slate-300">
                {strength <= 1 ? 'Weak' : strength <= 2 ? 'Medium' : 'Strong'}
              </span>
            </div>
          </div>
        )}

        {/* Cryptographic Key Generation Banner */}
        {isGeneratingKeys && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 animate-pulse">
            <KeyRound className="size-4 shrink-0 animate-spin" />
            <div>
              <p className="font-semibold">Generating 3072-bit RSA Keypair...</p>
              <p className="text-[10px] text-emerald-300/80">Using client Web Crypto API. Private key stays in RAM.</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          style={authSubmitStyle}
          disabled={isGeneratingKeys}
          className="hover:brightness-110 active:scale-[0.99] disabled:opacity-50 mt-1"
        >
          {isGeneratingKeys ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Generating Secure Keys…</span>
            </>
          ) : (
            <>
              <span>Create Encrypted Account</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
    </ModernAuthLayout>
  );
}
