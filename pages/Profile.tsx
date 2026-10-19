
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { uploadToCloudinary } from '../services/cloudinary';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  User as UserIcon, Mail, Camera, Save, MapPin,
  Zap, Crown, ShieldCheck, Gem,
  XCircle, Loader2, LayoutDashboard, Heart, ShoppingBag,
  TrendingUp, Clock, ChevronRight, Fingerprint, MessageSquare,
  Globe, Sparkles, Activity, BarChart3, Shield, Cpu, Info, Send, BadgeCheck, X,
  AlertCircle, CheckCircle2, CreditCard
} from 'lucide-react';

// ── tokens ─────────────────────────────────────────────────────────────────────
const bg = '#0d0d0d'; const surface = '#1a1a1a'; const border = '#2a2a2a'; const text = '#f0f0f0'; const sub = '#888'; const accent = '#6366f1';

// ── Mobile Profile View ────────────────────────────────────────────────────────
const MobileProfileView: React.FC = () => {
  const { currentUser, updateProfile, orders, favorites, messages, logout, markReplyAsRead } = useStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || '',
    location: currentUser?.location || '',
    avatar: currentUser?.avatar || '',
  });

  useEffect(() => {
    if (currentUser) {
      setForm({ name: currentUser.name, email: currentUser.email, bio: currentUser.bio || '', location: currentUser.location || '', avatar: currentUser.avatar || '' });
    }
  }, [currentUser]);

  const stats = useMemo(() => {
    const myOrders = (orders || []).filter(o => o.userId === currentUser?.id);
    return { orders: myOrders.length, spent: myOrders.reduce((a, o) => a + (o.status !== 'cancelled' ? o.total : 0), 0) };
  }, [orders, currentUser]);

  const unread = useMemo(() => (messages || []).filter(m => (m.userId === currentUser?.id || m.email === currentUser?.email) && m.reply && !m.replyReadByUser).length, [messages, currentUser]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file);
      setForm(p => ({ ...p, avatar: url }));
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => setForm(p => ({ ...p, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfile(form);
    setIsSaving(false);
    setIsEditing(false);
  };

  if (!currentUser) return null;

  const menuItems = [
    { label: 'My Orders',    path: '/orders',    icon: <Clock size={16} style={{ color: sub }} />,         badge: 0 },
    { label: 'My Wishlist',  path: '/favorites', icon: <Heart size={16} style={{ color: sub }} />,         badge: favorites.length },
    { label: 'Messages',     path: '/messages',  icon: <MessageSquare size={16} style={{ color: sub }} />, badge: unread },
    { label: 'Addresses',    path: '/addresses', icon: <MapPin size={16} style={{ color: sub }} />,        badge: 0 },
    ...(currentUser.role === 'admin' ? [{ label: 'Admin Panel', path: '/admin', icon: <LayoutDashboard size={16} style={{ color: sub }} />, badge: 0 }] : []),
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: bg,
    border: `1px solid ${border}`, borderRadius: 9, fontSize: 14,
    color: text, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 80 }}>
      <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/*" style={{ display: 'none' }} />

      {/* Profile header card */}
      <div style={{ padding: '20px 16px', background: surface, borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={form.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
              alt={currentUser.name}
              style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${border}` }}
            />
            {isEditing && (
              <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: accent, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Camera size={12} style={{ color: '#fff' }} />
              </button>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 17, color: text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p>
            <p style={{ fontSize: 12, color: sub, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</p>
            {unread > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '2px 8px' }}>
                {unread} new {unread === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
          <button onClick={() => setIsEditing(o => !o)} style={{ padding: '7px 13px', background: isEditing ? 'rgba(239,68,68,0.1)' : `${accent}18`, border: `1px solid ${isEditing ? 'rgba(239,68,68,0.3)' : accent + '40'}`, borderRadius: 9, color: isEditing ? '#ef4444' : accent, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {[
            { label: 'Orders', val: stats.orders, path: '/orders' },
            { label: 'Wishlist', val: favorites.length, path: '/favorites' },
          ].map(s => (
            <Link key={s.label} to={s.path} style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 11, padding: '11px 12px', textAlign: 'center', textDecoration: 'none' }}>
              <p style={{ fontWeight: 800, fontSize: 20, color: accent, margin: '0 0 2px' }}>{s.val}</p>
              <p style={{ fontSize: 11, color: sub, margin: 0, fontWeight: 600 }}>{s.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Edit form */}
      {isEditing && (
        <form onSubmit={handleSave} style={{ padding: '14px 16px', borderBottom: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>Edit Profile</p>
          {[
            { label: 'Name', key: 'name', type: 'text', ph: 'Your name' },
            { label: 'Location', key: 'location', type: 'text', ph: 'City' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: sub, marginBottom: 5 }}>{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: sub, marginBottom: 5 }}>Bio</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Write a short bio..."
              style={{ ...inputStyle, resize: 'none' } as React.CSSProperties} />
          </div>
          <button type="submit" disabled={isSaving} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Bio display */}
      {!isEditing && currentUser.bio && (
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}` }}>
          <p style={{ fontSize: 13, color: sub, margin: 0, fontStyle: 'italic', lineHeight: 1.6 }}>"{currentUser.bio}"</p>
        </div>
      )}

      {/* Nav menu */}
      <div style={{ padding: '8px 0' }}>
        {menuItems.map(item => (
          <Link key={item.path} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textDecoration: 'none', borderBottom: `1px solid ${border}` }}>
            {item.icon}
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: text }}>{item.label}</span>
            {item.badge > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{item.badge}</span>
            )}
            <ChevronRight size={15} style={{ color: sub }} />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div style={{ padding: '16px' }}>
        <button onClick={() => { logout(); navigate('/'); }} style={{ width: '100%', padding: '13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 11, color: '#ef4444', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <XCircle size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

export const Profile: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileProfileView />;

  const { currentUser, updateProfile, orders, favorites, messages, markReplyAsRead } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [showMessagesPopup, setShowMessagesPopup] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || '',
    location: currentUser?.location || '',
    avatar: currentUser?.avatar || ''
  });

  useEffect(() => {
    let animationFrameId: number;
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const animate = () => {
      setSmoothMouse(prev => ({
        x: lerp(prev.x, mousePos.x, 0.08),
        y: lerp(prev.y, mousePos.y, 0.08)
      }));
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [mousePos]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        avatar: currentUser.avatar || ''
      });
    }
  }, [currentUser]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 2 - 1; // -1 to 1
    const y = ((e.clientY - top) / height) * 2 - 1; // -1 to 1
    setMousePos({ x, y });
  };

  const stats = useMemo(() => {
    const totalSpent = (orders || []).reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.total : 0), 0);
    const myOrdersCount = (orders || []).filter(o => o.userId === currentUser?.id).length;
    return { totalSpent, myOrdersCount };
  }, [orders, currentUser]);

  // Online payment orders for this user
  const myOnlinePaymentOrders = useMemo(() => {
    if (!currentUser) return [];
    return (orders || []).filter(o =>
      o.userId === currentUser.id &&
      (o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash')
    );
  }, [orders, currentUser]);

  const pendingPaymentOrders = myOnlinePaymentOrders.filter(
    o => !o.paymentStatus || o.paymentStatus === 'pending'
  );
  const awaitingApprovalOrders = myOnlinePaymentOrders.filter(
    o => o.paymentStatus === 'awaiting_approval'
  );
  const rejectedPaymentOrders = myOnlinePaymentOrders.filter(
    o => o.paymentStatus === 'rejected'
  );

  const myMessages = useMemo(() => {
    if (!currentUser) return [];
    return (messages || []).filter(m => {
      const matchId = m.userId && String(m.userId) === String(currentUser.id);
      const matchEmail = m.email && m.email.toLowerCase() === currentUser.email.toLowerCase();
      return matchId || matchEmail;
    });
  }, [messages, currentUser]);

  useEffect(() => {
    if (myMessages.length > 0) {
      myMessages.forEach(msg => {
        if (msg.reply && msg.replyReadByUser === false) {
          markReplyAsRead(msg.id);
        }
      });
    }
  }, [myMessages, markReplyAsRead]);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfile(formData);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(file);
        setFormData(prev => ({ ...prev, avatar: cloudinaryUrl }));
      } catch (error) {
        console.error('Failed to upload avatar to Cloudinary:', error);
        // Fallback to base64 if Cloudinary fails
        const reader = new FileReader();
        reader.onloadend = () => setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen relative overflow-hidden bg-[#010409] text-white pt-24 pb-32 selection:bg-amber-500 selection:text-black"
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Advanced Multi-Layer Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Layer 1: The Grid (Parallax Speed 0.05) */}
        <div
          className="absolute inset-0 opacity-[0.07] transition-transform duration-[1.5s] ease-out"
          style={{ transform: `translate(${smoothMouse.x * 15}px, ${smoothMouse.y * 15}px) scale(1.1)` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        </div>

        {/* Layer 2: Aether Nodes (Parallax Speed 0.1) */}
        <div
          className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-amber-500/[0.05] blur-[150px] rounded-full transition-transform duration-[2s] ease-out"
          style={{ transform: `translate(${smoothMouse.x * -40}px, ${smoothMouse.y * -40}px)` }}
        ></div>
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/[0.04] blur-[180px] rounded-full transition-transform duration-[2s] ease-out"
          style={{ transform: `translate(${smoothMouse.x * 50}px, ${smoothMouse.y * 50}px)` }}
        ></div>

        {/* Layer 3: Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-16">
        {/* Header Section: Orchestrated Slide-up */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 animate-slide-up">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-5 py-2 glass-dark border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-[0.5em] rounded-full flex items-center gap-3 shadow-2xl backdrop-blur-xl animate-float">
                <ShieldCheck size={12} className="animate-pulse" /> Imperial Node Connectivity: Active
              </div>
            </div>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white">
              Sovereign <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-400 to-amber-600 italic font-display tracking-normal">Presence</span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-4 animate-fade-in stagger-1">
            {currentUser.role === 'admin' && (
              <Link to="/admin" className="group px-8 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3.5 shadow-2xl hover:bg-amber-500 transition-all active:scale-95 overflow-hidden relative">
                <LayoutDashboard size={18} className="group-hover:rotate-12 transition-transform" /> <span className="relative z-10">Command Terminal</span>
                <div className="absolute inset-0 bg-black/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </Link>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-8 py-5 glass-dark border rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3.5 transition-all hover:scale-105 active:scale-95 shadow-2xl ${isEditing ? 'border-red-500/40 text-red-500 bg-red-500/5' : 'border-white/10 hover:border-amber-500/40 hover:text-amber-500'
                }`}
            >
              {isEditing ? <XCircle size={18} className="animate-scale-in" /> : <Cpu size={18} className="animate-spin-slow" />}
              {isEditing ? 'Abort Calibration' : 'Initialize Matrix'}
            </button>
          </div>
        </div>

        {/* ── Payment Status Notifications ─────────────────────────── */}
        {(pendingPaymentOrders.length > 0 || awaitingApprovalOrders.length > 0 || rejectedPaymentOrders.length > 0) && (
          <div className="space-y-3 animate-fade-in">
            {/* Rejected payments — most urgent */}
            {rejectedPaymentOrders.map(o => (
              <div key={o.id} className="flex items-start gap-4 p-5 rounded-[2rem] bg-red-500/10 border border-red-500/20 shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <XCircle size={20} className="text-red-400" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-black text-red-400 uppercase tracking-tight">
                    Payment Rejected — Order #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-red-400/70 mt-1 leading-relaxed">
                    Your {o.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} payment of <span className="font-black text-white">Rs. {o.total.toLocaleString()}</span> was rejected.
                    Please contact support for assistance.
                  </p>
                </div>
                <Link
                  to="/orders"
                  className="shrink-0 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all"
                >
                  View Order
                </Link>
              </div>
            ))}

            {/* Awaiting approval — receipt submitted */}
            {awaitingApprovalOrders.map(o => (
              <div key={o.id} className="flex items-start gap-4 p-5 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-amber-400 animate-pulse" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-black text-amber-400 uppercase tracking-tight">
                    Payment Awaiting Approval — Order #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-amber-400/70 mt-1 leading-relaxed">
                    Your {o.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} receipt of <span className="font-black text-white">Rs. {o.total.toLocaleString()}</span> has been submitted.
                    Admin will verify it within 1–2 hours.
                  </p>
                </div>
                <Link
                  to="/orders"
                  className="shrink-0 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest hover:bg-amber-500/30 transition-all"
                >
                  View Order
                </Link>
              </div>
            ))}

            {/* Pending — no receipt yet */}
            {pendingPaymentOrders.map(o => (
              <div key={o.id} className="flex items-start gap-4 p-5 rounded-[2rem] bg-orange-500/10 border border-orange-500/20 shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-orange-400" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-black text-orange-400 uppercase tracking-tight">
                    Upload Receipt — Order #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-orange-400/70 mt-1 leading-relaxed">
                    You selected {o.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} but haven't uploaded a receipt yet.
                    Your order of <span className="font-black text-white">Rs. {o.total.toLocaleString()}</span> is pending payment confirmation.
                  </p>
                </div>
                <Link
                  to="/orders"
                  className="shrink-0 px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/30 transition-all"
                >
                  View Order
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Identity Card & Stats: Orchestrated Scale-in */}
          <div className="lg:col-span-5 space-y-12 animate-scale-in stagger-1">
            <div
              className="relative group perspective-2000"
              style={{
                transform: `rotateY(${smoothMouse.x * 15}deg) rotateX(${smoothMouse.y * -15}deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Animated Card Border Shine */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/50 via-blue-500/50 to-amber-600/50 rounded-[2.8rem] blur-sm opacity-20 group-hover:opacity-60 transition-opacity duration-1000 animate-spin-slow" style={{ animationDuration: '10s' }}></div>

              <div className="relative aspect-[1.62/1] w-full rounded-[2.5rem] overflow-hidden border border-amber-500/30 shadow-[0_40px_100px_rgba(0,0,0,0.6)] bg-gradient-to-br from-[#0d1117] via-[#010409] to-[#0d1117] p-8 md:p-10 flex flex-col justify-between group cursor-default backdrop-blur-md">
                {/* Dynamic Shine Layer */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at ${(smoothMouse.x + 1) * 50}% ${(smoothMouse.y + 1) * 50}%, rgba(255, 255, 255, 0.4), transparent 50%)`
                  }}
                ></div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.8em] text-amber-500/50">Sovereign Identity Card</p>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                      <span className="text-amber-500 font-display italic tracking-normal drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">Sovereign</span>
                    </h3>
                  </div>
                  <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center border-amber-500/30 text-amber-500 shadow-2xl backdrop-blur-3xl group-hover:scale-110 transition-transform duration-700">
                    <Gem size={32} className="animate-float relative z-10 fill-amber-500/20" />
                  </div>
                </div>

                <div className="space-y-4 relative z-10" style={{ transform: 'translateZ(50px)' }}>
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl border-2 border-amber-500/40 overflow-hidden p-0.5 bg-black shrink-0 shadow-2xl group-hover:border-amber-400 transition-colors relative">
                      <img
                        src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                        className="w-full h-full object-cover rounded-xl transition-all duration-1000 group-hover:scale-110 group-hover:rotate-3"
                        alt=""
                      />
                      {myMessages.some(m => m.reply && m.replyReadByUser === false) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black animate-ping" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0 max-w-full">
                      <p className="text-xl font-black text-white uppercase tracking-tight truncate leading-none">{currentUser.name}</p>
                      <div className="flex items-center gap-2 max-w-full overflow-hidden">
                        <BadgeCheck size={10} className="text-blue-400 shrink-0" />
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.5em] font-mono truncate opacity-60 flex-1 min-w-0">AUTH_ID: {currentUser.id.slice(0, 16).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end relative z-10">
                  <div className="flex gap-3">
                    <div className="h-10 w-16 bg-gradient-to-br from-amber-500/30 to-amber-700/10 border border-amber-500/40 rounded-xl flex items-center justify-center shadow-inner group-hover:border-amber-400 transition-all">
                      <div className="w-8 h-1 bg-amber-500/40 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.5em] mb-1">PROVISIONED</p>
                    <p className="text-sm font-black text-amber-500/90 uppercase tracking-[0.3em]">{new Date(currentUser.joinedDate).getFullYear()} // NODE_01</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <Link to="/orders" className="glass-dark p-8 rounded-[2.5rem] border-white/5 space-y-6 hover:border-amber-500/40 transition-all group relative overflow-hidden shadow-2xl hover:-translate-y-2 animate-slide-up stagger-2">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <p className="text-4xl font-black text-white tracking-tighter leading-none mb-1 group-hover:text-amber-400 transition-colors">{stats.myOrdersCount}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">Total Acquisitions</p>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-amber-500 group-hover:w-full transition-all duration-700"></div>
              </Link>
              <Link to="/favorites" className="glass-dark p-8 rounded-[2.5rem] border-white/5 space-y-6 hover:border-blue-500/50 transition-all group relative overflow-hidden shadow-2xl hover:-translate-y-2 animate-slide-up stagger-3">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 shadow-xl">
                  <Heart size={24} className="group-hover:fill-current" />
                </div>
                <div>
                  <p className="text-4xl font-black text-white tracking-tighter leading-none mb-1 group-hover:text-blue-400 transition-colors">{favorites.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">Vaulted Assets</p>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-blue-500 group-hover:w-full transition-all duration-700"></div>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-12 animate-fade-in stagger-2">
            <div className="glass-dark p-10 md:p-14 rounded-[3.5rem] border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-3xl group/card">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-12 animate-scale-in">
                  <div className="flex flex-col md:flex-row items-center gap-8 mb-4">
                    <div className="relative group shrink-0">
                      <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-3xl bg-black relative z-10">
                        <img
                          src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 rounded-[2rem] text-white z-20"
                      >
                        <Camera size={32} className="animate-float" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase tracking-tight text-white">Neural Reprogramming</h3>
                      <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.4em]">Calibrating identity parameters...</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em] ml-5">Identity Label</label>
                      <div className="relative group/input overflow-hidden rounded-2xl">
                        <input
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-[#050914] border border-white/5 rounded-2xl py-5 px-8 text-sm font-bold text-white focus:ring-0 focus:border-amber-500/60 outline-none transition-all"
                          placeholder="Alias"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-amber-500 group-focus-within/input:w-full transition-all duration-700"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em] ml-5">Regional Endpoint</label>
                      <div className="relative group/input overflow-hidden rounded-2xl">
                        <input
                          value={formData.location}
                          onChange={e => setFormData({ ...formData, location: e.target.value })}
                          className="w-full bg-[#050914] border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold text-white focus:ring-0 focus:border-blue-500/60 outline-none transition-all"
                          placeholder="City Node"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-500 group-focus-within/input:w-full transition-all duration-700"></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em] ml-5">Protocol Narrative</label>
                    <div className="relative group/input overflow-hidden rounded-2xl">
                      <textarea
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full bg-[#050914] border border-white/10 rounded-2xl py-6 px-8 text-sm font-medium text-white focus:ring-0 focus:border-amber-500/40 outline-none transition-all min-h-[120px] resize-none"
                        placeholder="Provision your identity bio here..."
                      />
                      <div className="absolute bottom-0 left-0 h-[2px] w-4 bg-amber-500 group-focus-within/input:w-full transition-all duration-1000"></div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="group relative w-full py-7 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-black uppercase tracking-[0.5em] text-[11px] shadow-3xl hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-4">
                      {isSaving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} className="group-hover:scale-125 transition-transform" /> Authorize Sync</>}
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                </form>
              ) : (
                <div className="space-y-14 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-10">
                      <div className="group/item cursor-default animate-slide-up stagger-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 group-hover/item:rotate-6 transition-transform"><Fingerprint size={22} /></div>
                          <p className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em]">Identity Designation</p>
                        </div>
                        <p className="text-2xl font-black text-white tracking-tight ml-5 group-hover/item:translate-x-1 transition-transform">{currentUser.name}</p>
                      </div>
                      <div className="group/item cursor-default animate-slide-up stagger-2">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20 group-hover/item:rotate-6 transition-transform"><Mail size={22} /></div>
                          <p className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em]">Network Neural Link</p>
                        </div>
                        <p className="text-base font-bold text-white tracking-tight ml-5 opacity-80 group-hover/item:translate-x-1 transition-transform truncate max-w-full">{currentUser.email}</p>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="group/item cursor-default animate-slide-up stagger-3">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 group-hover/item:rotate-6 transition-transform"><ShieldCheck size={22} /></div>
                          <p className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em]">Terminal Access</p>
                        </div>
                        <p className="text-2xl font-black text-amber-500 tracking-tight ml-5 italic font-display capitalize group-hover/item:translate-x-1 transition-transform">Sovereign Protocol</p>
                      </div>
                      <div className="group/item cursor-default animate-slide-up stagger-4">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-4 bg-green-500/10 rounded-2xl text-green-400 border border-green-500/20 group-hover/item:rotate-6 transition-transform"><Sparkles size={22} /></div>
                          <p className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em]">Matrix Integrity</p>
                        </div>
                        <p className="text-2xl font-black text-green-400 tracking-tight ml-5 uppercase group-hover/item:translate-x-1 transition-transform">Optimized // 99%</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 glass-dark rounded-[2.5rem] border-white/5 relative group/bio shadow-2xl overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent animate-slide-up stagger-5">
                    <p className="text-[9px] font-black uppercase text-gray-600 tracking-[0.8em] mb-8 flex items-center gap-4">
                      <Activity size={12} className="text-amber-500/50 animate-pulse" /> Protocol Narrative Archive
                    </p>
                    <p className="text-base font-medium text-gray-400 leading-relaxed italic relative z-10 px-4 group-hover/bio:text-gray-200 transition-colors">
                      "{currentUser.bio || 'Detailed identity bio not yet provisioned in the current cycle.'}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 animate-fade-in stagger-5">
                    <Link to="/orders" className="flex items-center justify-between p-10 glass-dark rounded-[2rem] border-white/5 hover:border-amber-500/40 transition-all group/link shadow-xl">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover/link:text-amber-500 transition-all group-hover/link:scale-110"><Clock size={24} /></div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Archives</span>
                          <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">Transaction Log</p>
                        </div>
                      </div>
                      <ChevronRight size={22} className="text-gray-700 group-hover/link:translate-x-3 transition-transform" />
                    </Link>
                    <Link to="/addresses" className="flex items-center justify-between p-10 glass-dark rounded-[2rem] border-white/5 hover:border-blue-500/40 transition-all group/link shadow-xl">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover/link:text-blue-400 transition-all group-hover/link:scale-110"><MapPin size={24} /></div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Logistics</span>
                          <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">Reception Nodes</p>
                        </div>
                      </div>
                      <ChevronRight size={22} className="text-gray-700 group-hover/link:translate-x-3 transition-transform" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* COMMUNICATIONS SECTION: Staggered Loading of Messages */}
            <div className="space-y-8 mt-12 animate-slide-up stagger-3">
              <div className="flex items-center gap-4 px-4">
                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-xl group-hover:rotate-12 transition-transform">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Communications Node</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600">Archived neural signals and system responses</p>
                </div>
              </div>

              {myMessages.length > 0 ? (
                <div className="space-y-6">
                  {(showAllMessages ? myMessages : myMessages.slice(0, 2)).map((msg, idx) => (
                    <div
                      key={msg.id}
                      className={`glass-dark p-8 md:p-10 rounded-[3rem] border transition-all group relative overflow-hidden shadow-2xl animate-slide-up ${msg.reply && msg.replyReadByUser === false ? 'border-red-500/30' : 'border-white/5 hover:border-blue-500/20'
                        }`}
                      style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{msg.subject}</h4>
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest font-mono">Dispatched: {new Date(msg.date).toLocaleString()}</p>
                        </div>
                        {msg.reply && (
                          <div className={`px-4 py-1.5 border text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg ${msg.replyReadByUser === false ? 'bg-red-500/20 border-red-500/40 text-red-500 animate-bounce' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            }`}>
                            {msg.replyReadByUser === false ? 'New Response' : 'Response Available'}
                          </div>
                        )}
                      </div>

                      <div className="relative mb-8">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/20 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                        <p className="text-sm text-gray-400 italic font-medium leading-relaxed bg-black/40 p-6 ml-4 rounded-2xl border border-white/5 group-hover:text-gray-300 transition-colors shadow-inner">
                          "{msg.message}"
                        </p>
                      </div>

                      {msg.reply ? (
                        <div className="ml-10 p-8 glass-dark border border-amber-500/30 rounded-[2.5rem] bg-amber-500/[0.02] relative group/reply shadow-3xl animate-scale-in">
                          <div className="absolute top-6 -left-4 w-4 h-4 bg-amber-500/20 border-l border-t border-amber-500/30 rotate-[-45deg]"></div>
                          <p className="text-[9px] font-black uppercase text-amber-500 tracking-[0.5em] mb-4 flex items-center gap-3">
                            <ShieldCheck size={14} className="animate-pulse" /> Authorized Staff Transmission
                          </p>
                          <p className="text-base text-white font-medium leading-relaxed">
                            {msg.reply}
                          </p>
                          <div className="flex justify-between items-center mt-6 pt-6 border-t border-amber-500/10">
                            <p className="text-[8px] text-gray-600 font-mono uppercase tracking-[0.2em]">Node ID: {String(msg.id).slice(0, 8).toUpperCase()}</p>
                            <p className="text-[8px] text-gray-600 font-mono uppercase tracking-[0.2em]">{msg.repliedAt ? new Date(msg.repliedAt).toLocaleString() : ''}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="ml-14 flex items-center gap-4 text-gray-700 font-black uppercase tracking-[0.5em] text-[9px]">
                          <Activity size={12} className="animate-pulse" /> Signal under evaluation by curators...
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {myMessages.length > 2 && (
                     <button 
                       onClick={() => setShowMessagesPopup(true)}
                       className="w-full py-4 glass-dark border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                     >
                       View All {myMessages.length} Messages
                     </button>
                   )}
                </div>
              ) : (
                <div className="text-center py-20 glass-dark rounded-[3.5rem] border-dashed border-white/10 opacity-40 animate-scale-in">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">No signal history found for this identity.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Popup Modal */}
        {showMessagesPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] glass-dark rounded-[3rem] border border-white/10 overflow-hidden animate-slide-up">
              {/* Popup Header */}
              <div className="p-8 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                    All Messages
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {myMessages.length} Messages from Communications Node
                  </p>
                </div>
                <button
                  onClick={() => setShowMessagesPopup(false)}
                  className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>

              {/* Messages List */}
              <div className="p-8 overflow-y-auto max-h-[60vh] space-y-6">
                {myMessages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`glass-dark p-8 rounded-[2rem] border transition-all group relative overflow-hidden shadow-xl animate-slide-up ${msg.reply && msg.replyReadByUser === false ? 'border-red-500/30' : 'border-white/10 hover:border-blue-500/20'
                      }`}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-all"></div>
                    
                    {/* Message Header with Profile */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        {/* Profile Picture */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                          {msg.name ? msg.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-xl font-black text-white">{msg.name || 'Anonymous User'}</h4>
                            <BadgeCheck size={20} className="text-blue-500" />
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{msg.email || 'No Email'}</span>
                            <span>•</span>
                            <span>{msg.date ? new Date(msg.date).toLocaleDateString() : 'Unknown Date'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="space-y-4">
                      <p className="text-gray-300 leading-relaxed text-lg">
                        {msg.message || 'No message content.'}
                      </p>
                      
                      {/* Reply Section */}
                      {msg.reply && (
                        <div className="mt-6 p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                          <div className="flex items-center gap-3 mb-3">
                            <Send size={16} className="text-blue-500" />
                            <span className="text-sm font-black text-blue-500 uppercase tracking-[0.4em]">Admin Response</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed">
                            {msg.reply}
                          </p>
                          <p className="text-xs text-gray-500 mt-3">
                            {msg.repliedAt ? `Replied on ${new Date(msg.repliedAt).toLocaleDateString()}` : 'Reply date unknown'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Popup Footer */}
              <div className="p-8 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    Showing all {myMessages.length} messages
                  </p>
                  <button
                    onClick={() => setShowMessagesPopup(false)}
                    className="px-8 py-3 bg-blue-500 text-white font-black text-sm uppercase tracking-[0.4em] rounded-xl hover:bg-blue-400 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
