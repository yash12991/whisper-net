"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import {
  ModernAuthLayout,
  authErrorStyle,
  authInputStyle,
  authSubmitStyle,
} from '@/components/ui/modern-login-signup';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

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
          : 'Failed to login';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModernAuthLayout mode="login">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && (
          <div role="alert" style={authErrorStyle}>
            {error}
          </div>
        )}

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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/60"
          />
        </div>

        <button
          type="submit"
          style={authSubmitStyle}
          disabled={submitting}
          className="hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Authenticating…</span>
            </>
          ) : (
            <>
              <span>Sign In to WhisperNet</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
    </ModernAuthLayout>
  );
}
