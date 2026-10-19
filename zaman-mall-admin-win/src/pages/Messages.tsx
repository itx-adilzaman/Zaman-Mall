import React, { useState } from 'react';
import { Mail, CheckCircle2, Trash2, Send, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAlert } from '../context/AlertContext';

export default function Messages() {
  const { messages, replyToMessage, markMessageAsRead, removeMessage } = useAdmin();
  const { showAlert } = useAlert();
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sending, setSending]     = useState<string | null>(null);

  const handleReply = async (id: string) => {
    const text = replyText[id]?.trim();
    if (!text) return;
    setSending(id);
    try {
      await replyToMessage(id, text);
      setReplyText(p => ({ ...p, [id]: '' }));
      showAlert('success', 'Reply Sent');
    } catch { showAlert('error', 'Failed'); }
    setSending(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try { await removeMessage(id); showAlert('info', 'Deleted'); }
    catch { showAlert('error', 'Failed'); }
  };

  if (!messages.length) return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <MessageSquare size={20} style={{ color: '#60a5fa' }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No messages yet</p>
    </div>
  );

  const unread = messages.filter(m => !m.read).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header — count */}
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {unread} unread of {messages.length} total
      </p>

      {messages.map(msg => (
        <div key={msg.id} className="card transition-all"
          style={{ borderColor: !msg.read ? 'rgba(59,130,246,0.2)' : 'var(--border)' }}>

          {/* ── Top: sender info + controls ── */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Left: avatar + name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: !msg.read ? 'rgba(59,130,246,0.1)' : 'var(--hover)',
                  border: '1px solid var(--border)',
                }}>
                {!msg.read
                  ? <Mail size={15} style={{ color: '#60a5fa' }} />
                  : <CheckCircle2 size={15} style={{ color: 'var(--text-subtle)' }} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {!msg.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />}
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{msg.name}</p>
                </div>
                <p className="text-[10px] font-mono-num truncate" style={{ color: 'var(--text-subtle)' }}>
                  {msg.email}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: '#60a5fa' }}>
                  {msg.subject}
                </p>
              </div>
            </div>

            {/* Right: time + actions — stack tightly on mobile */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                <Clock size={10} />
                <span className="hidden xs:inline">
                  {new Date(msg.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <span className="xs:hidden">
                  {new Date(msg.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {!msg.read && (
                  <button onClick={() => markMessageAsRead(msg.id)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all whitespace-nowrap"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                    Read
                  </button>
                )}
                <button onClick={() => handleDelete(msg.id)}
                  className="btn-icon w-7 h-7 hover:!text-red-400 !rounded-lg">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Message body ── */}
          <div className="p-4 rounded-xl mb-4 text-sm leading-relaxed"
            style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            {msg.message}
          </div>

          {/* ── Reply area ── */}
          {msg.reply ? (
            <div className="ml-0 sm:ml-4 p-4 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={12} style={{ color: 'var(--brand)' }} />
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--brand)' }}>
                  Admin Reply
                </p>
                {msg.repliedAt && (
                  <p className="text-[9px] font-mono-num ml-auto" style={{ color: 'var(--text-subtle)' }}>
                    {new Date(msg.repliedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                )}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{msg.reply}</p>
            </div>
          ) : (
            <div className="ml-0 sm:ml-4 relative">
              <textarea
                value={replyText[msg.id] || ''}
                onChange={e => setReplyText(p => ({ ...p, [msg.id]: e.target.value }))}
                placeholder="Type a reply…"
                rows={3}
                className="input-field resize-none pr-14"
              />
              <button
                onClick={() => handleReply(msg.id)}
                disabled={!replyText[msg.id]?.trim() || sending === msg.id}
                className="absolute bottom-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}
                aria-label="Send reply"
              >
                <Send size={13} className="text-white" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
