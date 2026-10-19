
import React, { useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Mail, MessageSquare, Clock, CheckCircle2, AlertCircle, ShieldCheck, ChevronRight, Inbox } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Mobile Messages ────────────────────────────────────────────────────────────
const bg = '#0d0d0d'; const surface = '#1a1a1a'; const border = '#2a2a2a'; const text = '#f0f0f0'; const sub = '#888'; const accent = '#6366f1';

const MobileMessagesView: React.FC = () => {
  const { messages, currentUser, markReplyAsRead } = useStore();
  const navigate = useNavigate();
  const my = messages.filter(m => m.userId === currentUser?.id || m.email === currentUser?.email);

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${border}` }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: sub, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 6, padding: 0 }}>
          ← Back
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: text, margin: 0 }}>My Messages</h1>
        <p style={{ fontSize: 12, color: sub, margin: '3px 0 0' }}>{my.length} message{my.length !== 1 ? 's' : ''}</p>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {my.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <MessageSquare size={48} style={{ color: '#333', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 700, fontSize: 17, color: text, marginBottom: 6 }}>No messages yet</p>
            <p style={{ fontSize: 13, color: sub, marginBottom: 16 }}>Send us a message and we'll get back to you.</p>
            <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: accent, color: '#fff', padding: '9px 18px', borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              Contact Us <ChevronRight size={13} />
            </Link>
          </div>
        ) : my.map((msg, idx) => (
          <div key={msg.id}
            style={{ background: surface, border: `1px solid ${msg.reply && !msg.replyReadByUser ? 'rgba(239,68,68,0.4)' : border}`, borderRadius: 14, overflow: 'hidden' }}
            onMouseEnter={() => { if (msg.reply && !msg.replyReadByUser) markReplyAsRead(msg.id); }}
          >
            {/* Header */}
            <div style={{ padding: '13px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: text, margin: '0 0 2px' }}>{msg.subject}</p>
                <p style={{ fontSize: 10, color: sub, margin: 0 }}>{new Date(msg.date).toLocaleDateString()}</p>
              </div>
              {msg.reply ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>
                  <CheckCircle2 size={10} /> Replied
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#f59e0b', flexShrink: 0 }}>
                  <Clock size={10} /> Pending
                </span>
              )}
              {msg.reply && !msg.replyReadByUser && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>New</span>
              )}
            </div>

            {/* Message */}
            <div style={{ padding: '12px 14px', borderBottom: msg.reply ? `1px solid ${border}` : 'none' }}>
              <p style={{ fontSize: 13, color: sub, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{msg.message}"</p>
            </div>

            {/* Reply */}
            {msg.reply && (
              <div style={{ padding: '12px 14px', background: 'rgba(99,102,241,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                  <ShieldCheck size={13} style={{ color: accent }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Official Response</span>
                  <span style={{ fontSize: 10, color: sub }}>{msg.repliedAt ? new Date(msg.repliedAt).toLocaleDateString() : ''}</span>
                </div>
                <p style={{ fontSize: 13, color: text, margin: 0, lineHeight: 1.6 }}>{msg.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const UserMessages: React.FC = () => {
    const isMobile = useIsMobile();
    if (isMobile) return <MobileMessagesView />;

    const { messages, currentUser, markReplyAsRead } = useStore();

    // Filter messages for the current user
    const myMessages = messages.filter(m => m.userId === currentUser?.id || m.email === currentUser?.email);

    // Mark unseen replies as read when viewing this page (optional strategy, or per item)
    // For now, we'll let the user manually expand or just seeing them might be enough.
    // But the prompt said "admin ka reply user ke liye... show hona chahiye".

    return (
        <div className="min-h-screen bg-[#010409] text-white pt-24 pb-32 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-blue-600/[0.03] blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-purple-600/[0.03] blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-5xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="mb-12 animate-slide-up">
                    <div className="inline-flex items-center gap-3 px-5 py-2 glass-dark border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-6">
                        <Inbox size={14} /> Secure Inbox
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                        My <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Transmissions</span>
                    </h1>
                    <p className="text-gray-500 mt-4 font-medium max-w-xl">
                        Track the status of your inquiries and view official responses from the Zaman Sons executive team.
                    </p>
                </div>

                {/* Messages List */}
                <div className="space-y-8">
                    {myMessages.length === 0 ? (
                        <div className="glass-dark p-16 rounded-[3rem] border-white/5 text-center animate-scale-in">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <MessageSquare size={32} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-black uppercase text-white tracking-tight mb-2">No Transmissions Found</h3>
                            <p className="text-gray-500 text-sm mb-8">You haven't sent any inquiries yet.</p>
                            <Link to="/contact" className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all">
                                Initiate Contact <ChevronRight size={14} />
                            </Link>
                        </div>
                    ) : (
                        myMessages.map((msg, idx) => (
                            <div
                                key={msg.id}
                                className="glass-dark p-8 md:p-10 rounded-[3rem] border border-white/5 hover:border-blue-500/20 transition-all animate-slide-up relative overflow-hidden group"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                                onMouseEnter={() => {
                                    if (msg.reply && !msg.replyReadByUser) {
                                        markReplyAsRead(msg.id);
                                    }
                                }}
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <MessageSquare size={120} />
                                </div>

                                {/* Status Badge */}
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{msg.subject}</h3>
                                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                            {new Date(msg.date).toLocaleDateString()} • {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div>
                                        {msg.reply ? (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                                <CheckCircle2 size={12} /> Response Received
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                                <Clock size={12} /> Pending Review
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* User Message */}
                                <div className="bg-black/40 rounded-3xl p-6 md:p-8 border border-white/5 mb-6 relative z-10">
                                    <p className="text-gray-300 italic leading-relaxed text-sm">
                                        "{msg.message}"
                                    </p>
                                </div>

                                {/* Admin Reply */}
                                {msg.reply && (
                                    <div className="ml-0 md:ml-12 relative z-10 animate-fade-in">
                                        <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-6 md:p-8 relative">
                                            {/* Connector Line */}
                                            <div className="absolute -left-6 top-8 w-6 h-6 border-b-2 border-l-2 border-blue-500/20 rounded-bl-2xl md:block hidden"></div>

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                                                    <ShieldCheck size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Official Response</p>
                                                    <p className="text-[9px] font-mono text-gray-600">{msg.repliedAt ? new Date(msg.repliedAt).toLocaleDateString() : 'Just now'}</p>
                                                </div>
                                            </div>
                                            <p className="text-gray-200 font-medium leading-relaxed text-sm pl-2 md:pl-0">
                                                {msg.reply}
                                            </p>

                                            {!msg.replyReadByUser && (
                                                <div className="absolute px-3 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full -top-2 -right-2 animate-bounce">
                                                    New
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
