import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Send, Users, User as UserIcon, CheckCircle2, XCircle,
  Loader2, Search, Megaphone, Zap, Clock, ChevronDown, ChevronUp,
  Smartphone, Globe, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PushUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  push_token: string | null;
}

interface NotifLog {
  id: string;
  title: string;
  body: string;
  target: 'all' | 'specific';
  targetName?: string;
  sentAt: string;
  status: 'success' | 'failed' | 'partial';
  successCount: number;
  failCount: number;
}

// ─── Expo Push API Helper ─────────────────────────────────────────────────────
// Route through proxy to avoid CORS (Vite dev proxy / Netlify function in prod)
const EXPO_PUSH_URL = '/api/expo-push';

async function sendExpoPush(tokens: string[], title: string, body: string, data?: object) {
  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data: data ?? {},
    // Professional branding
    channelId: 'zaman-mall-alerts',
    priority: 'high',
    badge: 1,
  }));

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!res.ok) throw new Error(`Expo API error: ${res.status}`);
  return await res.json();
}

// ─── QUICK TEMPLATES ──────────────────────────────────────────────────────────
const TEMPLATES = [
  { icon: '🛍️', label: 'Sale Alert', title: '🛍️ Mega Sale — Zaman Mall', body: 'Aaj ke offers miss mat karein! Limited time par bhari discounts. Shop now!', url: '/(tabs)/' },
  { icon: '📦', label: 'New Arrivals', title: '✨ New Products Arrived!', body: 'Bilkul naye products available hain. Abhi dekh kar order karein — jaldi khatam honga!', url: '/(tabs)/' },
  { icon: '🚚', label: 'Order Status', title: '🚚 Check Order Status', body: 'Apne orders ki latest updates dekhne ke liye yahan tap karein.', url: '/(profile)/orders' },
  { icon: '⭐', label: 'Review Request', title: '⭐ Apna review dein!', body: 'Aapka order deliver ho gaya. Hamen batayein kaisa laga — 2 minute ka kaam!', url: '/(profile)/orders' },
  { icon: '🎁', label: 'Gift Offer', title: '🎁 Special Gift Waiting for You!', body: 'Aapke liye ek surprise hai! App open karein aur dekhein kya mila.', url: '/(tabs)/' },
];

// ─── Notification Log Storage (localStorage) ──────────────────────────────────
function getLogs(): NotifLog[] {
  try { return JSON.parse(localStorage.getItem('zaman_notif_logs') || '[]'); } catch { return []; }
}
function saveLogs(logs: NotifLog[]) {
  localStorage.setItem('zaman_notif_logs', JSON.stringify(logs.slice(0, 50)));
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Notifications() {
  const { users: allUsers } = useAdmin();
  const users: PushUser[] = allUsers.filter(u => u.push_token).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar || '',
    push_token: u.push_token || null
  }));
  const loadingUsers = false;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [targetMode, setTargetMode] = useState<'all' | 'specific'>('all');
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'partial'; msg: string } | null>(null);

  const [logs, setLogs] = useState<NotifLog[]>(getLogs());
  const [showLogs, setShowLogs] = useState(false);

  // Use users directly from context

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setTitle(t.title);
    setBody(t.body);
    setUrl(t.url || '');
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setResult({ type: 'error', msg: 'Title aur body dono zaroori hain.' });
      return;
    }

    let tokens: string[] = [];
    let targetName: string | undefined;

    if (targetMode === 'all') {
      tokens = users.map(u => u.push_token!).filter(Boolean);
      targetName = undefined;
    } else {
      const targets = users.filter(u => selectedUsers.has(u.id));
      tokens = targets.map(u => u.push_token!).filter(Boolean);
      targetName = targets.map(u => u.name).join(', ');
      if (tokens.length === 0) {
        setResult({ type: 'error', msg: 'Koi user select nahi kiya ya un ke paas push token nahi hai.' });
        return;
      }
    }

    setSending(true);
    setResult(null);

    let successCount = 0;
    let failCount = 0;

    try {
      // 1. Save to Database
      if (targetMode === 'all') {
        await supabase.from('notifications').insert({
          user_id: null,
          title: title.trim(),
          body: body.trim(),
          type: 'promotional',
          data: { url: url.trim() || '/(tabs)/' }
        });
      } else {
        const targets = users.filter(u => selectedUsers.has(u.id));
        const dbInserts = targets.map(u => ({
          user_id: u.id,
          title: title.trim(),
          body: body.trim(),
          type: 'promotional',
          data: { url: url.trim() || '/(tabs)/' }
        }));
        if (dbInserts.length > 0) {
          await supabase.from('notifications').insert(dbInserts);
        }
      }

      // 2. Send push notifications in chunks
      const chunkSize = 100;
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const chunk = tokens.slice(i, i + chunkSize);
        const response = await sendExpoPush(chunk, title.trim(), body.trim(), { url: url.trim() || undefined, source: 'zaman_admin' });

        if (response?.data) {
          for (const r of response.data) {
            if (r.status === 'ok') successCount++;
            else failCount++;
          }
        } else {
          successCount += chunk.length;
        }
      }

      const status: NotifLog['status'] = failCount === 0 ? 'success' : (successCount === 0 ? 'failed' : 'partial');

      const newLog: NotifLog = {
        id: crypto.randomUUID(),
        title: title.trim(),
        body: body.trim(),
        target: targetMode,
        targetName,
        sentAt: new Date().toISOString(),
        status,
        successCount,
        failCount,
      };
      const updated = [newLog, ...logs];
      setLogs(updated);
      saveLogs(updated);

      if (status === 'success') {
        setResult({ type: 'success', msg: `✅ ${successCount} user(s) ko successfully notification bhej di gayi!` });
      } else if (status === 'partial') {
        setResult({ type: 'partial', msg: `⚠️ ${successCount} successful, ${failCount} failed.` });
      } else {
        setResult({ type: 'error', msg: `❌ Notification bhejne mein error aya. ${failCount} failed.` });
      }

      setTitle('');
      setBody('');
      setSelectedUsers(new Set());
    } catch (e: any) {
      setResult({ type: 'error', msg: `Error: ${e?.message || 'Unknown error'}` });
    } finally {
      setSending(false);
    }
  };

  const tokenCount = targetMode === 'all' ? users.length : selectedUsers.size;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}
            >
              <Megaphone size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>Push Notifications</h1>
          </div>
          <p className="text-xs ml-11" style={{ color: 'var(--text-subtle)' }}>
            Apne customers ko directly unke mobile par message bhejein — app band ho tab bhi
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Registered devices chip */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.18)' }}
          >
            <Smartphone size={12} className="animate-pulse" />
            {loadingUsers ? '...' : users.length} Registered Devices
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT: Compose ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Quick Templates */}
          <div className="card">
            <p className="section-title mb-3">⚡ Quick Templates</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.03]"
                  style={{
                    background: 'var(--hover)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compose Form */}
          <div className="card space-y-4">
            <p className="section-title mb-0">✍️ Notification Compose</p>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-subtle)' }}>
                Notification Title *
              </label>
              <input
                className="input-field w-full text-sm font-semibold"
                placeholder="e.g. 🛍️ Mega Sale — Zaman Mall"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-subtle)' }}>{title.length}/100 characters</p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-subtle)' }}>
                Message Body *
              </label>
              <textarea
                className="input-field w-full text-sm resize-none"
                placeholder="Apna notification message yahan likhein..."
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={4}
                maxLength={256}
              />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-subtle)' }}>{body.length}/256 characters</p>
            </div>

            {/* Deep Link URL */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-subtle)' }}>
                🔗 Deep Link URL (Optional)
              </label>
              <input
                className="input-field w-full text-sm"
                placeholder="e.g. /(profile)/orders ya /(tabs)/"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-subtle)' }}>
                Jab user notification par click karega toh is screen par jayega.
              </p>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div
                className="rounded-xl p-4 border"
                style={{ background: 'var(--hover)', borderColor: 'var(--border)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}>
                  📱 Preview (Phone Screen)
                </p>
                <div
                  className="rounded-xl p-3 flex gap-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}
                  >
                    🛍️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{title || 'Title...'}</p>
                    <p className="text-[11px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{body || 'Message...'}</p>
                    <p className="text-[9px] mt-1 font-medium" style={{ color: 'var(--text-subtle)' }}>Zaman Mall • just now</p>
                  </div>
                </div>
              </div>
            )}

            {/* Result Banner */}
            {result && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm font-medium"
                style={{
                  background: result.type === 'success' ? 'rgba(34,197,94,0.08)' : result.type === 'partial' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${result.type === 'success' ? 'rgba(34,197,94,0.2)' : result.type === 'partial' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  color: result.type === 'success' ? '#4ade80' : result.type === 'partial' ? '#f59e0b' : '#f87171',
                }}
              >
                {result.type === 'success' ? <CheckCircle2 size={15} /> : result.type === 'partial' ? <AlertCircle size={15} /> : <XCircle size={15} />}
                {result.msg}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: sending || !title.trim() || !body.trim()
                  ? 'var(--hover)'
                  : 'linear-gradient(135deg,#f59e0b,#ef4444)',
                color: sending || !title.trim() || !body.trim() ? 'var(--text-subtle)' : '#fff',
                boxShadow: sending || !title.trim() || !body.trim() ? 'none' : '0 4px 16px rgba(245,158,11,0.35)',
              }}
            >
              {sending
                ? <><Loader2 size={16} className="animate-spin" /> Sending...</>
                : <><Send size={16} /> Send to {tokenCount > 0 ? `${tokenCount} Device${tokenCount !== 1 ? 's' : ''}` : 'Devices'}</>
              }
            </button>
          </div>
        </div>

        {/* ── RIGHT: Target ── */}
        <div className="space-y-4">

          {/* Target Mode */}
          <div className="card space-y-3">
            <p className="section-title mb-0">🎯 Target Audience</p>

            {/* All Users */}
            <button
              onClick={() => setTargetMode('all')}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${targetMode === 'all' ? 'ring-2' : ''}`}
              style={{
                background: targetMode === 'all' ? 'rgba(245,158,11,0.06)' : 'var(--hover)',
                borderColor: targetMode === 'all' ? 'rgba(245,158,11,0.5)' : 'var(--border)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: targetMode === 'all' ? 'rgba(245,158,11,0.15)' : 'var(--surface)' }}
              >
                <Globe size={16} style={{ color: targetMode === 'all' ? '#f59e0b' : 'var(--text-subtle)' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>All Users</p>
                <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                  {users.length} registered devices
                </p>
              </div>
              {targetMode === 'all' && <CheckCircle2 size={15} style={{ color: '#f59e0b' }} />}
            </button>

            {/* Specific Users */}
            <button
              onClick={() => setTargetMode('specific')}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${targetMode === 'specific' ? 'ring-2' : ''}`}
              style={{
                background: targetMode === 'specific' ? 'rgba(99,102,241,0.06)' : 'var(--hover)',
                borderColor: targetMode === 'specific' ? 'rgba(99,102,241,0.5)' : 'var(--border)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: targetMode === 'specific' ? 'rgba(99,102,241,0.15)' : 'var(--surface)' }}
              >
                <Users size={16} style={{ color: targetMode === 'specific' ? '#6366f1' : 'var(--text-subtle)' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Specific Users</p>
                <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                  {selectedUsers.size > 0 ? `${selectedUsers.size} selected` : 'Select users below'}
                </p>
              </div>
              {targetMode === 'specific' && <CheckCircle2 size={15} style={{ color: '#6366f1' }} />}
            </button>

            {/* User List for specific mode */}
            {targetMode === 'specific' && (
              <div>
                <div className="relative mb-2">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
                  <input
                    className="input-field pl-8 py-2 text-xs w-full"
                    placeholder="Search users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={18} className="animate-spin" style={{ color: 'var(--brand)' }} />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--text-subtle)' }}>No users found</p>
                  ) : filteredUsers.map(u => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                      style={{
                        background: selectedUsers.has(u.id) ? 'rgba(99,102,241,0.08)' : 'var(--hover)',
                        border: `1px solid ${selectedUsers.has(u.id) ? 'rgba(99,102,241,0.35)' : 'var(--border)'}`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="rounded"
                        style={{ accentColor: '#6366f1' }}
                      />
                      <div className="avatar w-7 h-7 shrink-0">
                        {u.avatar ? <img src={u.avatar} alt="" className="object-cover" /> : <UserIcon size={12} style={{ color: 'var(--text-subtle)' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{u.name}</p>
                        <p className="text-[9px] truncate" style={{ color: 'var(--text-subtle)' }}>{u.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Notification History ── */}
      <div className="card">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setShowLogs(l => !l)}
        >
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: 'var(--text-subtle)' }} />
            <p className="section-title mb-0">Notification History ({logs.length})</p>
          </div>
          {showLogs ? <ChevronUp size={14} style={{ color: 'var(--text-subtle)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-subtle)' }} />}
        </button>

        {showLogs && (
          <div className="mt-4 space-y-2">
            {logs.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--text-subtle)' }}>
                Abhi tak koi notification nahi bheji. Pehli notification bhejne ke baad yahan history dikh jayegi.
              </p>
            ) : logs.map(log => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: log.status === 'success' ? 'rgba(34,197,94,0.1)' : log.status === 'partial' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                  }}
                >
                  {log.status === 'success'
                    ? <CheckCircle2 size={14} style={{ color: '#4ade80' }} />
                    : log.status === 'partial'
                      ? <AlertCircle size={14} style={{ color: '#f59e0b' }} />
                      : <XCircle size={14} style={{ color: '#f87171' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{log.title}</p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{log.body}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[9px] font-mono-num" style={{ color: 'var(--text-subtle)' }}>
                      {new Date(log.sentAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[9px] font-semibold" style={{ color: log.target === 'all' ? '#f59e0b' : '#6366f1' }}>
                      {log.target === 'all' ? '🌐 All Users' : `👤 ${log.targetName}`}
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--text-subtle)' }}>
                      ✓{log.successCount} {log.failCount > 0 && `✗${log.failCount}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
