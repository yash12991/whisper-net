"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, 
  Plus, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  ShieldAlert, 
  Trash2, 
  MoreVertical, 
  Palette, 
  Users, 
  Lock, 
  KeyRound, 
  Check, 
  CheckCheck,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { generateSessionKey, encryptSessionKey, importPublicKey } from '@securechat/crypto';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { theme } from '@/lib/theme';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function Sidebar({
  onSelectConversation,
  activeConversationId,
  onThemeChange,
}: {
  onSelectConversation: (id: string) => void;
  activeConversationId: string | null;
  onThemeChange?: (theme: 'default' | 'ruixen' | 'sunset') => void;
}) {
  const { user, logout, deleteAccount, getPrivateKey } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  
  const settingsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = () => {
        fetchConversations();
      };

      socket.on('receive_message', handleNewMessage);

      return () => {
        socket.off('receive_message', handleNewMessage);
      };
    }
  }, [socket]);

  async function fetchConversations() {
    try {
      const res = await axios.get(`${API_URL}/conversations`);
      setConversations(res.data);
    } catch (error: any) {
      console.warn('Failed to fetch conversations:', error.message || error);
    }
  }

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 2) {
      setIsSearching(true);
      try {
        const res = await axios.get(`${API_URL}/users?q=${q}`);
        setSearchResults(res.data);
      } catch (error: any) {
        console.warn('Search failed:', error.message || error);
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const startConversation = async (targetUser: any) => {
    try {
      const sessionKey = await generateSessionKey();
      const targetPublicKey = await importPublicKey(targetUser.publicKey);
      const encryptedForTarget = await encryptSessionKey(sessionKey, targetPublicKey);
      const myPublicKey = await importPublicKey(user!.publicKey);
      const encryptedForSelf = await encryptSessionKey(sessionKey, myPublicKey);

      const initialEncryptedKeyMaterial = {
        [targetUser.id]: encryptedForTarget,
        [user!.id]: encryptedForSelf,
      };

      const res = await axios.post(`${API_URL}/conversations`, {
        targetUserId: targetUser.id,
        initialEncryptedKeyMaterial,
      });

      setSearchQuery('');
      setIsSearching(false);
      await fetchConversations();
      onSelectConversation(res.data.id);
    } catch (error: any) {
      console.warn('Failed to start conversation:', error.message || error);
      alert(
        'Failed to start conversation due to cryptographic constraints. Did you lose your private key?',
      );
    }
  };

  const startGroupConversation = async () => {
    if (groupMembers.length === 0 || !groupName.trim()) return;

    try {
      const sessionKey = await generateSessionKey();
      const myPublicKey = await importPublicKey(user!.publicKey);
      const encryptedForSelf = await encryptSessionKey(sessionKey, myPublicKey);
      
      const initialEncryptedKeyMaterial: Record<string, string> = {
        [user!.id]: encryptedForSelf
      };

      for (const m of groupMembers) {
        const targetPublicKey = await importPublicKey(m.publicKey);
        initialEncryptedKeyMaterial[m.id] = await encryptSessionKey(sessionKey, targetPublicKey);
      }

      const res = await axios.post(`${API_URL}/conversations/group`, {
        name: groupName,
        targetUserIds: groupMembers.map(m => m.id),
        initialEncryptedKeyMaterial,
      });

      setSearchQuery('');
      setIsSearching(false);
      setIsCreatingGroup(false);
      setGroupMembers([]);
      setGroupName('');
      await fetchConversations();
      onSelectConversation(res.data.id);
    } catch (error: any) {
      console.warn('Failed to start group conversation:', error.message || error);
      alert('Failed to start group conversation. Please try again.');
    }
  };

  const handleSelectConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, _count: { ...c._count, messages: 0 } } : c
      )
    );
    onSelectConversation(id);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to permanently delete your account? This will wipe all your conversations and session keys, and cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteAccount();
      router.push('/login');
    } catch (error) {
      alert("Failed to delete account. Please try again.");
    }
  };

  return (
    <div
      className="flex h-full w-full flex-col border-r backdrop-blur-xl"
      style={{ 
        background: 'rgba(10, 15, 28, 0.95)', 
        borderColor: 'rgba(255, 255, 255, 0.08)', 
        color: theme.text 
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div 
            className="flex size-9 items-center justify-center rounded-xl border shadow-md"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
            }}
          >
            <Shield className="size-4.5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">WhisperNet</span>
              <span className="rounded-full px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                E2EE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">3072-bit Hybrid Shield</p>
          </div>
        </div>

        {/* Settings Dropdown Button */}
        <div className="flex items-center gap-1 relative" ref={settingsRef}>
          <Link
            href="/security"
            className="rounded-lg p-2 transition-all hover:bg-white/5 text-slate-400 hover:text-emerald-400"
            title="Security Lab"
          >
            <ShieldAlert size={17} />
          </Link>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-lg p-2 transition-all hover:bg-white/5 text-slate-400 hover:text-white"
            title="Options & Settings"
          >
            <MoreVertical size={17} />
          </button>

          {showSettings && (
            <div
              className="absolute top-full right-0 mt-2 w-56 rounded-xl shadow-2xl border z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
              style={{ background: 'rgba(16, 24, 44, 0.95)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
            >
              <div className="p-1.5">
                <Link
                  href="/security"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300"
                  onClick={() => setShowSettings(false)}
                >
                  <ShieldAlert size={15} className="text-emerald-400" />
                  Security Lab & Audits
                </Link>

                <div className="h-px w-full my-1 bg-white/5" />

                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Theme Presets
                </div>

                <button
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 transition-colors hover:bg-white/5"
                  onClick={() => {
                    onThemeChange?.('default');
                    setShowSettings(false);
                  }}
                >
                  <Palette size={14} className="text-slate-400" />
                  Default Cyber Dark
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 transition-colors hover:bg-white/5"
                  onClick={() => {
                    onThemeChange?.('ruixen');
                    setShowSettings(false);
                  }}
                >
                  <Palette size={14} className="text-cyan-400" />
                  Ruixen Moon Theme
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 transition-colors hover:bg-white/5"
                  onClick={() => {
                    onThemeChange?.('sunset');
                    setShowSettings(false);
                  }}
                >
                  <Palette size={14} className="text-amber-400" />
                  Sunset Glow Theme
                </button>

                <div className="h-px w-full my-1 bg-white/5" />

                <button
                  onClick={() => {
                    setShowSettings(false);
                    handleDeleteAccount();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                  Delete Encrypted Account
                </button>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 transition-colors hover:bg-white/5"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action / Search Bar */}
      <div className="p-3 pb-2 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreatingGroup(!isCreatingGroup)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
              isCreatingGroup 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                : 'glass-panel text-slate-300 hover:text-white hover:border-white/20'
            }`}
          >
            <Users size={14} />
            {isCreatingGroup ? 'Cancel Group' : 'New Group'}
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            strokeWidth={2}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder={isCreatingGroup ? "Search contacts to add..." : "Search user or start chat…"}
            className="block w-full rounded-xl py-2 pr-8 pl-9 text-xs outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50"
            style={{
              background: 'rgba(20, 29, 51, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: theme.text,
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setIsSearching(false); setSearchResults([]); }}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Conversation / Search Stream List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {/* Create Group Drawer */}
        {isCreatingGroup && (
          <div className="glass-panel rounded-xl p-3 my-2 space-y-2 border border-emerald-500/30 bg-emerald-950/20">
            <p className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">Group Setup</p>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group Title (e.g. Core Crypto Team)"
              className="w-full rounded-lg py-1.5 px-3 text-xs bg-slate-900/80 border border-white/10 text-white outline-none focus:border-emerald-500"
            />
            {groupMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 py-1">
                {groupMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span>{m.username}</span>
                    <button onClick={() => setGroupMembers(prev => prev.filter(u => u.id !== m.id))} className="hover:text-white ml-0.5">×</button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={startGroupConversation}
              disabled={groupMembers.length === 0 || !groupName.trim()}
              className="w-full rounded-lg py-2 text-xs font-semibold bg-emerald-500 text-slate-950 transition-all hover:bg-emerald-400 disabled:opacity-40"
            >
              Initialize Encrypted Group
            </button>
          </div>
        )}

        {/* Searching Results Mode */}
        {isSearching ? (
          <div className="py-2">
            <h3 className="mb-2 px-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Users Found ({searchResults.length})
            </h3>
            {searchResults.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  if (isCreatingGroup) {
                    if (!groupMembers.find(m => m.id === u.id)) {
                      setGroupMembers([...groupMembers, u]);
                    }
                  } else {
                    startConversation(u);
                  }
                }}
                className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-slate-800/60 border border-transparent hover:border-white/5"
              >
                <Avatar initials={u.username?.[0]?.toUpperCase() || '?'} active={false} isOnline={onlineUsers.has(u.id)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">{u.username}</p>
                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <KeyRound size={10} className="text-emerald-400" />
                    3072-bit RSA Public Key
                  </p>
                </div>
                <div className="rounded-lg p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Plus size={14} />
                </div>
              </div>
            ))}
            {searchResults.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-slate-500">
                No users matching &quot;{searchQuery}&quot;
              </p>
            )}
          </div>
        ) : (
          <div className="py-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                Encrypted Chats
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {conversations.length} Active
              </span>
            </div>

            {(() => {
              const visibleConvs = conversations.filter(
                (conv) => activeConversationId === conv.id || (conv.messages && conv.messages.length > 0)
              );

              if (visibleConvs.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="size-6 text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400">No active conversations</p>
                    <p className="text-[11px] text-slate-500 mt-1">Search for a username above to start an E2EE session.</p>
                  </div>
                );
              }

              return visibleConvs.map((conv) => {
                const otherMember = conv.members.find((m: any) => m.userId !== user?.id)?.user;
                if (!otherMember) return null;

                const isActive = activeConversationId === conv.id;
                const unreadCount = conv._count?.messages || 0;
                const displayName = conv.isGroup ? conv.name : otherMember?.username;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`relative mx-0.5 mb-1.5 flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all ${
                      isActive 
                        ? 'bg-slate-800/80 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                        : 'hover:bg-slate-800/40 border border-transparent hover:border-white/5'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                    )}

                    <Avatar
                      initials={conv.isGroup ? (conv.name?.[0]?.toUpperCase() || 'G') : (otherMember?.username?.[0]?.toUpperCase() || '?')}
                      active={isActive}
                      isOnline={!conv.isGroup && otherMember ? onlineUsers.has(otherMember.id) : undefined}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`truncate text-xs font-semibold ${isActive ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {displayName}
                        </p>
                        {conv.messages && conv.messages[0] && (
                          <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                            {new Date(conv.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <p className="truncate text-[11px] text-slate-400 flex items-center gap-1">
                          <Lock size={10} className="text-slate-500" />
                          <span>
                            {conv.messages && conv.messages[0] ? 'Encrypted Payload' : 'New session ready'}
                          </span>
                        </p>

                        {!isActive && unreadCount > 0 && (
                          <div className="flex h-4 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[9px] font-bold bg-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* User Identity Footer */}
      <div 
        className="p-3 border-t border-white/5 flex items-center justify-between"
        style={{ background: 'rgba(14, 21, 38, 0.9)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar initials={user?.username?.[0]?.toUpperCase() || 'U'} active={false} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-semibold text-white">{user?.username}</p>
              <span className="size-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="truncate text-[10px] text-slate-400 font-mono">
              Key: {user?.id?.slice(0, 8)}…
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-red-400"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

function Avatar({ initials, active, isOnline }: { initials: string; active: boolean; isOnline?: boolean }) {
  return (
    <div className="relative inline-block shrink-0">
      <div
        className="flex size-9 items-center justify-center rounded-xl text-xs font-bold transition-all"
        style={{
          background: active 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)' 
            : 'rgba(255, 255, 255, 0.05)',
          color: active ? '#10b981' : '#f8fafc',
          border: `1px solid ${active ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
          boxShadow: active ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
        }}
      >
        {initials}
      </div>
      {isOnline && (
        <span 
          className="absolute -bottom-0.5 -right-0.5 block size-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 shadow-[0_0_8px_#10b981]" 
        />
      )}
    </div>
  );
}
