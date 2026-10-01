"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Shield, Lock, KeyRound, RefreshCw, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { theme } from '@/lib/theme';
import PixelBlast from '@/components/ui/PixelBlast';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatTheme, setChatTheme] = useState<'default' | 'ruixen' | 'sunset'>('default');
  const router = useRouter();

  useEffect(() => {
    const savedTheme = (localStorage.getItem('whispernet_chatTheme') || localStorage.getItem('ciphera_chatTheme')) as 'default' | 'ruixen' | 'sunset' | null;
    if (savedTheme) {
      setChatTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme: 'default' | 'ruixen' | 'sunset') => {
    setChatTheme(newTheme);
    localStorage.setItem('whispernet_chatTheme', newTheme);
  };

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center cyber-grid"
        style={{ background: theme.bg, color: theme.textDim }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex size-14 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20 animate-ping" />
            <div className="size-10 rounded-xl border-2 border-emerald-400 border-t-transparent animate-spin" />
            <Shield className="absolute size-5 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-200">Rehydrating Key Vault…</p>
            <p className="text-xs text-slate-500">Decrypting session state in memory</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: theme.bg, color: theme.text }}
    >
      {/* Sidebar Panel */}
      <div className={`h-full w-full md:w-84 lg:w-96 shrink-0 ${activeConversationId ? 'hidden md:block' : 'block'}`}>
        <Sidebar
          onSelectConversation={setActiveConversationId}
          activeConversationId={activeConversationId}
          onThemeChange={handleThemeChange}
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col min-w-0 ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversationId ? (
          <ChatWindow 
            conversationId={activeConversationId} 
            onBack={() => setActiveConversationId(null)} 
            chatTheme={chatTheme} 
          />
        ) : (
          <div
            className="relative flex flex-1 flex-col items-center justify-center overflow-hidden border-l px-6 cyber-grid"
            style={{
              background: theme.bg,
              borderColor: theme.border,
            }}
          >
            {/* Ambient Background Glow Effect */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
              <PixelBlast
                variant="square"
                pixelSize={5}
                color="#10b981"
                patternScale={2}
                patternDensity={1}
                pixelSizeJitter={0}
                enableRipples={true}
                rippleSpeed={0.4}
                rippleThickness={0.12}
                rippleIntensityScale={1.5}
                liquid={false}
                liquidStrength={0.12}
                liquidRadius={1.2}
                liquidWobbleSpeed={5}
                speed={0.4}
                edgeFade={0.3}
                transparent={true}
              />
            </div>

            {/* Empty State Hero Container */}
            <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
              {/* Glowing Shield Emblem */}
              <div className="relative mb-6">
                <div 
                  className="absolute -inset-4 rounded-3xl opacity-50 blur-xl animate-pulse-glow"
                  style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)' }}
                />
                <div
                  className="relative flex size-20 items-center justify-center rounded-2xl border shadow-2xl backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(20, 29, 51, 0.9) 0%, rgba(14, 21, 38, 0.95) 100%)',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    boxShadow: '0 0 35px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <Shield className="size-10" style={{ color: theme.accent }} strokeWidth={1.5} />
                </div>
              </div>

              {/* Headline & Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span 
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    color: theme.accent, 
                    border: '1px solid rgba(16, 185, 129, 0.3)' 
                  }}
                >
                  <Sparkles className="size-3" />
                  Zero-Knowledge Channel
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                WhisperNet End-to-End Encryption
              </h2>

              <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                Select a conversation from the sidebar or search a contact to begin exchanging
                confidential messages. All text is encrypted in your browser using ephemeral AES-256-GCM.
              </p>

              {/* Three Security Pillars Cards */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
                <div 
                  className="glass-panel rounded-xl p-4 transition-all hover:border-emerald-500/30"
                  style={{ background: 'rgba(20, 29, 51, 0.5)' }}
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-2.5">
                    <KeyRound className="size-4" />
                  </div>
                  <h3 className="text-xs font-semibold text-white">3072-bit RSA</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    OAEP asymmetric exchange wraps ephemeral symmetric keys.
                  </p>
                </div>

                <div 
                  className="glass-panel rounded-xl p-4 transition-all hover:border-cyan-500/30"
                  style={{ background: 'rgba(20, 29, 51, 0.5)' }}
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 mb-2.5">
                    <Lock className="size-4" />
                  </div>
                  <h3 className="text-xs font-semibold text-white">AES-256-GCM</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Authenticated AEAD prevents tampering and ciphertext malleability.
                  </p>
                </div>

                <div 
                  className="glass-panel rounded-xl p-4 transition-all hover:border-indigo-500/30"
                  style={{ background: 'rgba(20, 29, 51, 0.5)' }}
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-2.5">
                    <RefreshCw className="size-4" />
                  </div>
                  <h3 className="text-xs font-semibold text-white">Key Ratchet</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Automatic session rotation every 30 messages protects future keys.
                  </p>
                </div>
              </div>

              {/* Bottom Security Lab Link */}
              <div className="mt-8 flex items-center gap-3">
                <Link
                  href="/security"
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 transition-all hover:bg-emerald-500/20"
                >
                  <ShieldAlert className="size-3.5" />
                  Launch Security Lab & Tampering Tests
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
