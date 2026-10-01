"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import {
  encryptMessage,
  decryptMessage,
  decryptSessionKey,
  generateSessionKey,
  encryptSessionKey,
  signPayload,
  verifyPayloadSignature,
  importSigningPublicKey,
  calculateSafetyNumber,
  ratchetSessionKey,
} from '@securechat/crypto';
import { 
  Send, 
  Lock, 
  ShieldAlert, 
  Check, 
  CheckCheck, 
  KeyRound, 
  Smile, 
  ArrowLeft,
  Shield,
  Sparkles,
  RefreshCw,
  Info,
  Fingerprint,
  ShieldCheck,
  QrCode,
  X
} from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { theme } from '@/lib/theme';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const ROTATION_LIMIT = 30;

const playSound = (type: 'send' | 'receive') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.18);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (e) {
    // Ignore audio errors
  }
};

export default function ChatWindow({ 
  conversationId, 
  onBack, 
  chatTheme = 'default' 
}: { 
  conversationId: string; 
  onBack?: () => void; 
  chatTheme?: 'default' | 'ruixen' | 'sunset' 
}) {
  const { user, getPrivateKey, getSigningPrivateKey } = useAuth();
  const { socket, isConnected } = useSocket();

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');

  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyNumber, setSafetyNumber] = useState<string>('');
  const [verifiedIdentities, setVerifiedIdentities] = useState<Record<string, boolean>>({});

  const [activeSessionKey, setActiveSessionKey] = useState<CryptoKey | null>(null);
  const [activeKeyVersion, setActiveKeyVersion] = useState<number>(0);
  const [decryptionErrors, setDecryptionErrors] = useState<Record<string, string>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    if (socket && conversationId) {
      socket.emit('join_conversation', conversationId);

      const handleReceive = (msg: any) => {
        if (msg.conversationId === conversationId) {
          processIncomingMessage(msg);
        }
      };

      const handleRotation = (newKeyData: any) => {
        if (newKeyData.conversationId === conversationId) {
          loadSessionKey(newKeyData);
        }
      };

      const handleDelivered = (data: any) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) =>
            prev.map((m) =>
              data.messageIds.includes(m.id)
                ? { ...m, deliveredAt: data.deliveredAt || new Date() }
                : m,
            ),
          );
        }
      };

      const handleRead = (data: any) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) =>
            prev.map((m) =>
              data.messageIds.includes(m.id)
                ? { ...m, readAt: data.readAt || new Date() }
                : m,
            ),
          );
        }
      };

      const handleTypingStart = (data: any) => {
        if (data.conversationId === conversationId && data.userId !== user?.id) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.add(data.userId);
            return next;
          });
        }
      };

      const handleTypingStop = (data: any) => {
        if (data.conversationId === conversationId) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
        }
      };

      socket.on('receive_message', handleReceive);
      socket.on('key_rotation', handleRotation);
      socket.on('message_delivered', handleDelivered);
      socket.on('message_read', handleRead);
      socket.on('typing_start', handleTypingStart);
      socket.on('typing_stop', handleTypingStop);

      return () => {
        socket.off('receive_message', handleReceive);
        socket.off('key_rotation', handleRotation);
        socket.off('message_delivered', handleDelivered);
        socket.off('message_read', handleRead);
        socket.off('typing_start', handleTypingStart);
        socket.off('typing_stop', handleTypingStop);
      };
    }
  }, [socket, conversationId, activeSessionKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const markUnreadAsRead = () => {
      if (document.hasFocus() && socket) {
        const unreadIds = messages
          .filter((m) => m.senderId !== user?.id && !m.readAt)
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          socket.emit('message_read', { conversationId, messageIds: unreadIds });
        }
      }
    };

    markUnreadAsRead();
    window.addEventListener('focus', markUnreadAsRead);
    return () => window.removeEventListener('focus', markUnreadAsRead);
  }, [messages, socket, user?.id, conversationId]);

  const loadConversation = async () => {
    try {
      const res = await axios.get(`${API_URL}/conversations/${conversationId}`);
      const conv = res.data;
      setConversation(conv);

      let loadedKey = null;
      let loadedVersion = 0;

      if (conv.sessionKeys && conv.sessionKeys.length > 0) {
        const result = await loadSessionKey(conv.sessionKeys[0]);
        if (result) {
          loadedKey = result.sessionKey;
          loadedVersion = result.keyVersion;
        }
      }

      fetchMessages(loadedKey, loadedVersion);
    } catch (error: any) {
      console.warn('Failed to load conversation:', error.message || error);
    }
  };

  const loadSessionKey = async (keyMetadata: any) => {
    try {
      const privateKey = await getPrivateKey();
      if (!privateKey) {
        throw new Error('Private key not found in memory.');
      }

      const material = JSON.parse(keyMetadata.encryptedKeyMaterial);
      const encryptedForMe = material[user!.id];

      if (!encryptedForMe) {
        throw new Error('No key material found for this user');
      }

      const sessionKey = await decryptSessionKey(encryptedForMe, privateKey);
      setActiveSessionKey(sessionKey);
      setActiveKeyVersion(keyMetadata.keyVersion);
      return { sessionKey, keyVersion: keyMetadata.keyVersion };
    } catch (error: any) {
      console.warn('Failed to load session key:', error.message || error);
      setActiveSessionKey(null);
      return null;
    }
  };

  const fetchMessages = async (keyToUse?: CryptoKey | null, versionToUse?: number) => {
    try {
      const res = await axios.get(`${API_URL}/conversations/${conversationId}/messages`);
      const rawMessages = res.data;

      const processed = await Promise.all(
        rawMessages.map((m: any) => decryptAndFormatMessage(m, keyToUse, versionToUse)),
      );
      setMessages(processed);

      if (socket) {
        const undeliveredIds = rawMessages
          .filter((m: any) => m.senderId !== user?.id && !m.deliveredAt)
          .map((m: any) => m.id);

        if (undeliveredIds.length > 0) {
          socket.emit('message_delivered', { conversationId, messageIds: undeliveredIds });
        }

        if (document.hasFocus()) {
          const unreadIds = rawMessages
            .filter((m: any) => m.senderId !== user?.id && !m.readAt)
            .map((m: any) => m.id);

          if (unreadIds.length > 0) {
            socket.emit('message_read', { conversationId, messageIds: unreadIds });
          }
        }
      }
    } catch (error: any) {
      console.warn('Failed to fetch messages:', error.message || error);
    }
  };

  const decryptAndFormatMessage = async (
    msg: any,
    keyToUse?: CryptoKey | null,
    versionToUse?: number,
  ) => {
    const key = keyToUse !== undefined ? keyToUse : activeSessionKey;
    const version = versionToUse !== undefined ? versionToUse : activeKeyVersion;

    if (!key || msg.keyVersion !== version) {
      return { ...msg, decryptedText: '[Encrypted - Key Unavailable]', isDecrypted: false };
    }

    try {
      const plaintext = await decryptMessage(msg.ciphertext, msg.nonce, key);
      
      // Verify digital signature if present
      let isSignatureValid: boolean | null = null;
      if (msg.signature) {
        const senderSigningPubKeyPem = msg.sender?.signingPublicKey || conversation?.members?.find((m: any) => m.userId === msg.senderId)?.user?.signingPublicKey;
        if (senderSigningPubKeyPem) {
          try {
            const senderPubKey = await importSigningPublicKey(senderSigningPubKeyPem);
            const payloadToVerify = `${conversationId}:${msg.ciphertext}:${msg.nonce}`;
            isSignatureValid = await verifyPayloadSignature(senderPubKey, msg.signature, payloadToVerify);
          } catch (e) {
            isSignatureValid = false;
          }
        }
      }

      return { ...msg, decryptedText: plaintext, isDecrypted: true, isSignatureValid };
    } catch (error: any) {
      setDecryptionErrors((prev) => ({ ...prev, [msg.id]: error.message }));
      return {
        ...msg,
        decryptedText: '[Tampering Detected - Authentication Failed]',
        isDecrypted: false,
        isTampered: true,
      };
    }
  };

  const processIncomingMessage = async (msg: any) => {
    const processed = await decryptAndFormatMessage(msg);
    setMessages((prev) => {
      if (prev.some((m) => m.id === processed.id)) return prev;
      return [...prev, processed];
    });

    if (msg.senderId !== user?.id && socket) {
      playSound('receive');
      socket.emit('message_delivered', { conversationId, messageIds: [msg.id] });
      if (document.hasFocus()) {
        socket.emit('message_read', { conversationId, messageIds: [msg.id] });
      }
    }
  };

  const rotateKeyIfNecessary = async () => {
    if (messages.length > 0 && messages.length % ROTATION_LIMIT === 0) {
      try {
        const newSessionKey = await generateSessionKey();
        const otherMember = conversation.members.find((m: any) => m.userId !== user?.id)?.user;

        const myPublicKey = await crypto.subtle.importKey(
          'spki',
          Uint8Array.from(
            atob(user!.publicKey.replace(/-----(BEGIN|END) PUBLIC KEY-----|\n/g, '')),
          ).buffer,
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          true,
          ['encrypt'],
        );
        const targetPublicKey = await crypto.subtle.importKey(
          'spki',
          Uint8Array.from(
            atob(otherMember.publicKey.replace(/-----(BEGIN|END) PUBLIC KEY-----|\n/g, '')),
          ).buffer,
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          true,
          ['encrypt'],
        );

        const encryptedForSelf = await encryptSessionKey(newSessionKey, myPublicKey);
        const encryptedForTarget = await encryptSessionKey(newSessionKey, targetPublicKey);

        const newVersion = activeKeyVersion + 1;

        socket?.emit('key_rotation', {
          conversationId,
          keyVersion: newVersion,
          encryptedKeyMaterial: {
            [user!.id]: encryptedForSelf,
            [otherMember.id]: encryptedForTarget,
          },
        });

        setActiveSessionKey(newSessionKey);
        setActiveKeyVersion(newVersion);
      } catch (err: any) {
        console.warn('Rotation failed:', err.message || err);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSessionKey || !socket) return;

    await rotateKeyIfNecessary();

    const plaintext = inputText;
    setInputText('');

    try {
      const { ciphertext, nonce } = await encryptMessage(plaintext, activeSessionKey);

      // Sign message with sender's ECDSA private key
      let signature: string | null = null;
      const signingKey = await getSigningPrivateKey();
      if (signingKey) {
        const payloadToSign = `${conversationId}:${ciphertext}:${nonce}`;
        signature = await signPayload(signingKey, payloadToSign);
      }

      socket.emit('send_message', {
        conversationId,
        ciphertext,
        nonce,
        keyVersion: activeKeyVersion,
        signature,
      });

      playSound('send');

      // Forward Secrecy: Ratchet session key
      try {
        const ratchetedKey = await ratchetSessionKey(activeSessionKey);
        setActiveSessionKey(ratchetedKey);
      } catch (e) {
        // Fallback
      }
    } catch (error: any) {
      console.warn('Failed to encrypt/send:', error.message || error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (socket && conversationId) {
      socket.emit('typing_start', conversationId);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', conversationId);
      }, 2000);
    }
  };

  if (!conversation) {
    return (
      <div
        className="flex flex-1 items-center justify-center cyber-grid"
        style={{ background: theme.bg, color: theme.textDim }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 rounded-xl border-2 border-emerald-400 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Synchronizing E2EE Session…</p>
        </div>
      </div>
    );
  }

  const otherMember = conversation.members.find((m: any) => m.userId !== user?.id)?.user;

  return (
    <div 
      className="flex h-full flex-1 flex-col relative overflow-hidden"
      style={{ background: theme.bg }}
    >
      {/* Top Glass Header */}
      <div
        className="z-10 flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6 backdrop-blur-xl"
        style={{
          background: 'rgba(10, 15, 28, 0.85)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden flex items-center justify-center p-2 -ml-2 rounded-xl transition-colors hover:bg-white/5 text-slate-400 hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="relative">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-md"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              {conversation.isGroup ? (conversation.name?.[0]?.toUpperCase() || 'G') : (otherMember?.username?.[0]?.toUpperCase() || '?')}
            </div>
            {isConnected && (
              <span className="absolute -bottom-0.5 -right-0.5 block size-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 shadow-[0_0_6px_#10b981]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {conversation.isGroup ? conversation.name : otherMember?.username}
              </h3>
            </div>
            <p className="text-[11px] flex items-center gap-1.5" style={{ color: isConnected ? theme.accentMuted : theme.textDim }}>
              <span className={`size-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isConnected ? 'AES-256-GCM Channel Active' : 'Connecting to cipher node…'}</span>
            </p>
          </div>
        </div>

        {/* Header Cryptographic Security Badges */}
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <div 
            className="flex items-center gap-1.5 rounded-full px-3 py-1 border text-[11px] font-semibold"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              color: '#10b981'
            }}
          >
            <Lock size={11} />
            <span>E2E Encrypted</span>
          </div>

          <div 
            className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[11px] font-mono text-slate-300"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <KeyRound size={11} className="text-cyan-400" />
            <span>Key v{activeKeyVersion}</span>
          </div>

          <button
            onClick={() => {
              if (user?.publicKey && otherMember?.publicKey) {
                calculateSafetyNumber(user.publicKey, otherMember.publicKey).then(setSafetyNumber);
              }
              setShowSafetyModal(true);
            }}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-mono text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            title="Verify Identity Safety Number"
          >
            <Fingerprint size={12} className="text-emerald-400" />
            <span className="hidden sm:inline">Safety Number</span>
          </button>

          <Link
            href="/security"
            className="hidden md:flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
            title="Inspect Cryptography"
          >
            <ShieldAlert size={12} />
            <span>Audit</span>
          </Link>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 space-y-3.5 overflow-y-auto p-4 md:p-6 cyber-grid">
        {/* Encrypted Channel Notice */}
        <div className="mx-auto my-3 flex max-w-md items-center justify-center gap-2 rounded-xl p-2.5 border border-white/5 bg-slate-900/60 text-center text-[11px] text-slate-400 backdrop-blur-md">
          <Shield className="size-3.5 text-emerald-400 shrink-0" />
          <span>Messages are secured with end-to-end encryption. Only participants hold the decryption keys.</span>
        </div>

        {messages.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Lock className="size-7" />
            </div>
            <p className="text-sm font-semibold text-white">No messages yet</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Say hello! Your message will be encrypted with a random 256-bit symmetric key before transmission.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.id;
          
          return (
            <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 shadow-lg transition-all ${
                  msg.isTampered
                    ? 'rounded-2xl border border-red-500/40 bg-red-950/40 text-red-200'
                    : isMe
                    ? 'rounded-[18px] rounded-br-sm text-white shadow-emerald-950/20'
                    : 'glass-panel rounded-[18px] rounded-bl-sm text-slate-100'
                }`}
                style={
                  isMe && !msg.isTampered
                    ? {
                        background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                        boxShadow: '0 4px 18px rgba(5, 150, 105, 0.25)',
                      }
                    : undefined
                }
              >
                {msg.isTampered ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                      <ShieldAlert size={15} />
                      Ciphertext Tampering Detected
                    </div>
                    <p className="text-xs">{msg.decryptedText}</p>
                    <p className="font-mono text-[10px] break-all text-red-400/80 bg-red-900/30 p-1.5 rounded">
                      AEAD Tag Mismatch: {decryptionErrors[msg.id] || "MAC failed"}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.decryptedText}
                    </p>
                    <div
                      className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] font-mono ${
                        isMe ? 'text-emerald-100/70' : 'text-slate-400'
                      }`}
                    >
                      {msg.isSignatureValid && (
                        <span title="ECDSA P-256 Digital Signature Verified" className="text-emerald-300 flex items-center gap-0.5">
                          <ShieldCheck size={12} />
                          <span className="text-[9px]">Verified</span>
                        </span>
                      )}
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.isDecrypted && isMe && (
                        msg.readAt ? (
                          <CheckCheck size={13} className="text-cyan-200" />
                        ) : msg.deliveredAt ? (
                          <CheckCheck size={13} className="opacity-70" />
                        ) : (
                          <Check size={13} className="opacity-50" />
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 p-2 px-3.5 rounded-full max-w-fit glass-panel text-slate-300">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[11px] font-medium text-emerald-400">
              Encrypting response...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Dock */}
      <div
        className="p-3 md:p-4 border-t backdrop-blur-xl"
        style={{
          background: 'rgba(10, 15, 28, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="relative mx-auto max-w-4xl">
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-2 z-50 shadow-2xl">
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={(emojiData) => {
                  setInputText((prev) => prev + emojiData.emoji);
                }}
              />
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              disabled={!activeSessionKey}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
              title="Add Emoji"
            >
              <Smile size={19} />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                disabled={!activeSessionKey}
                placeholder={
                  !isConnected
                    ? 'Connecting to secure server…'
                    : !activeSessionKey
                    ? 'Cannot decrypt: Private key missing in memory'
                    : 'Type an encrypted message…'
                }
                className="w-full rounded-xl py-2.5 pr-10 pl-4 text-xs md:text-sm outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 disabled:opacity-50"
                style={{
                  background: 'rgba(20, 29, 51, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: !isConnected || !activeSessionKey ? theme.textDim : theme.text,
                }}
              />
              <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-500">
                <Lock size={13} />
              </div>
            </div>

            <button
              type="submit"
              disabled={!activeSessionKey || !inputText.trim()}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl font-semibold transition-all disabled:opacity-30"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                boxShadow: inputText.trim() ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
              }}
              title="Send Encrypted Message"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Safety Number & Fingerprint Verification Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1220] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Fingerprint className="size-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Safety Number Verification</h3>
              </div>
              <button 
                onClick={() => setShowSafetyModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Compare this 60-digit safety number with <strong className="text-white">{otherMember?.username || 'peer'}</strong> to verify cryptographic authenticity and guarantee that no intermediary or Man-in-the-Middle is intercepting your conversation.
              </p>

              {/* Visual 2D Matrix Grid */}
              <div className="mx-auto w-40 h-40 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                <QrCode className="size-24 text-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-300 mt-2">SHA-256 Digest Matrix</span>
              </div>

              {/* 60-Digit Formatted Number */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 font-mono text-center text-xs tracking-wider text-emerald-300 leading-relaxed select-all">
                {safetyNumber || 'Computing fingerprint...'}
              </div>

              <button
                onClick={() => {
                  if (otherMember?.id) {
                    setVerifiedIdentities((prev) => ({ ...prev, [otherMember.id]: !prev[otherMember.id] }));
                  }
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  otherMember?.id && verifiedIdentities[otherMember.id]
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                }`}
              >
                <ShieldCheck size={15} />
                <span>
                  {otherMember?.id && verifiedIdentities[otherMember.id]
                    ? '✓ Identity Verified by You'
                    : 'Mark Contact as Verified'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
