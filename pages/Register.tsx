
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ArrowRight, Zap, AlertCircle, Loader2, CheckCircle2, Fingerprint, Sparkles, Cpu, Shield, Monitor, Activity, ShieldAlert, CpuIcon, Network } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import AnimatedOAuthButtons from '../components/AnimatedOAuthButtons';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Mobile Register ────────────────────────────────────────────────────────────
const MobileRegisterView: React.FC = () => {
  const { register } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength
  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ef4444', '#f59e0b', '#3b82f6', '#16a34a'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true); setError(null);
    try {
      const result = await register(name, email, password);
      if (result.success) { setSuccess(true); }
      else { setError(result.message || 'Registration failed. Please try again.'); }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 14px 13px 44px',
    background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 12, fontSize: 15, color: '#f0f0f0',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '0 0 40px' }}>

      {/* Header */}
      <div style={{ padding: '40px 24px 28px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: 3, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '50%', marginBottom: 20 }}>
          <img src="/images/zaman-logo.png" alt="Zaman Mall" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontWeight: 900, fontSize: 26, color: '#f0f0f0', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Create Account</h1>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Join Zaman Mall — it's free!</p>
      </div>

      {/* Form card */}
      <div style={{ margin: '0 16px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={52} style={{ color: '#16a34a', margin: '0 auto 14px', display: 'block' }} />
            <p style={{ fontWeight: 800, fontSize: 18, color: '#f0f0f0', marginBottom: 6 }}>Account Created!</p>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Your account is ready. Sign in to continue.</p>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Sign In <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10 }}>
                <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* OAuth */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, textAlign: 'center' }}>Quick Sign Up</p>
              <AnimatedOAuthButtons onOAuthLogin={(p: string) => console.log(`OAuth: ${p}`)} className="" />
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
              <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} />
                </div>
              </div>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inp} />
                </div>
              </div>
              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" style={inp} />
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: strength > i ? strengthColors[Math.min(strength - 1, 3)] : '#2a2a2a', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: strengthColors[Math.min(strength - 1, 3)] || '#555', fontWeight: 600 }}>
                      {strength > 0 ? strengthLabels[Math.min(strength - 1, 3)] : 'Too short'}
                    </p>
                  </div>
                )}
              </div>

              <button type="submit" disabled={isLoading} style={{
                background: isLoading ? '#2a2a2a' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
                fontWeight: 800, fontSize: 16, cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 2,
              }}>
                {isLoading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</> : <>Create Account <ArrowRight size={18} /></>}
              </button>
            </form>

            {/* Login link */}
            <p style={{ textAlign: 'center', fontSize: 14, color: '#888', margin: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export const Register: React.FC = () => {
    const isMobile = useIsMobile();
    if (isMobile) return <MobileRegisterView />;

    const { register } = useStore();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Mouse Tracking State
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let frameId: number;
        const animate = () => {
            setSmoothMouse(prev => ({
                x: prev.x + (mousePos.x - prev.x) * 0.08,
                y: prev.y + (mousePos.y - prev.y) * 0.08
            }));
            frameId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frameId);
    }, [mousePos]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        setMousePos({
            x: ((e.clientX - left) / width) * 2 - 1,
            y: ((e.clientY - top) / height) * 2 - 1
        });
    };

    const strength = (pwd: string) => {
        let s = 0;
        if (pwd.length >= 8) s++;
        if (/[A-Z]/.test(pwd)) s++;
        if (/[0-9]/.test(pwd)) s++;
        return s;
    };

    const pwdStrength = strength(password);
    const strengthLabels = ["COMPROMISED", "ALPHA-STABLE", "ENCRYPTED-MAX", "IMPERIAL-AEGIS"];
    const strengthColors = ["bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const result = await register(name, email, password);
            if (result.success) {
                setSuccessMsg("PROVISIONING COMPLETE. NODE INITIALIZED.");
                setIsLoading(false);
            } else {
                setError(result.message || "UPLINK REJECTED.");
                setIsLoading(false);
            }
        } catch (err) {
            setError("FATAL UPLINK ERROR.");
            setIsLoading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#02040a] selection:bg-purple-500/30 perspective-[1500px]"
        >
            {/* 
          DYNAMIC BACKGROUND ARCHITECTURE 
          - Mouse tracking interactive lights
      */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Imperial Mouse Aura */}
                <div
                    className="absolute inset-0 transition-opacity duration-1000"
                    style={{
                        background: `radial-gradient(1200px circle at ${50 + smoothMouse.x * 25}% ${50 + smoothMouse.y * 25}%, rgba(76, 29, 149, 0.3) 0%, transparent 70%)`
                    }}
                ></div>

                {/* Parallax Grid */}
                <div
                    className="absolute inset-[-10%] opacity-[0.15] bg-[linear-gradient(to_right,#a855f7_1px,transparent_1px),linear-gradient(to_bottom,#a855f7_1px,transparent_1px)] bg-[size:3rem_3rem] transition-transform duration-500 ease-out"
                    style={{
                        transform: `translate(${smoothMouse.x * -20}px, ${smoothMouse.y * -20}px)`
                    }}
                ></div>

                {/* 3D Depth Rings tracking mouse slightly */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] opacity-[0.02] transition-transform duration-1000"
                    style={{
                        transform: `translate(${-50 + smoothMouse.x * 50}%, ${-50 + smoothMouse.y * 50}%)`
                    }}
                >
                    <div className="absolute inset-0 border-[3px] border-purple-500 rounded-full animate-float-slow" style={{ transform: 'rotateX(75deg) rotateY(15deg)' }}></div>
                    <div className="absolute inset-[200px] border-[2px] border-dashed border-purple-400 rounded-full animate-float-slow" style={{ transform: 'rotateX(-75deg) rotateY(-15deg)', animationDelay: '3s' }}></div>
                </div>
            </div>

            <div className="w-full max-w-[640px] relative z-10 flex flex-col gap-10 animate-3d-entrance">
                {/* HUD HEADER */}
                <div className="text-center space-y-4">
                    <div className="relative inline-block group">
                        {/* Interactive Header Glow */}
                        <div
                            className="absolute inset-[-20px] bg-purple-500 blur-[50px] opacity-20 transition-all duration-700 group-hover:opacity-60 pointer-events-none"
                            style={{ transform: `translate(${smoothMouse.x * 10}px, ${smoothMouse.y * 10}px)` }}
                        ></div>
                        <div className="relative p-5 bg-[#171717]/95 rounded-[2.5rem] border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-float">
                            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 shadow-xl shadow-purple-600/30 group-hover:shadow-2xl group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-105">
                              {/* Dynamic gradient animation */}
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-purple-500 via-pink-500 to-blue-500 opacity-0 group-hover:opacity-40 transition-opacity duration-700 animate-gradient-flow"></div>
                              {/* Rotating border */}
                              <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-yellow-400 group-hover:via-purple-400 group-hover:to-pink-400 group-hover:animate-spin-slow"></div>
                              {/* Inner glow ring */}
                              <div className="absolute inset-1 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                              {/* Logo */}
                              <img src="/images/zaman-logo.png" alt="Zaman Sons Mall" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              {/* Floating particles */}
                              <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 animate-bounce shadow-[0_0_6px_rgba(250,204,21,0.8)]"></div>
                              <div className="absolute bottom-0 right-0 w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 animate-bounce shadow-[0_0_6px_rgba(168,85,247,0.8)]" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                            <div className="absolute top-2 right-2">
                              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_12px_#a855f7]"></div>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter relative animate-float-text cursor-pointer group/brand" style={{ fontFamily: 'system-ui, sans-serif', transition: 'font-family 700ms ease' }}>
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient-flow transition-all duration-700" style={{ filter: 'drop-shadow(0 0 20px rgba(192, 38, 211, 0.6))' }}>
                            ZAMAN
                        </span>
                        <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient-flow-reverse transition-all duration-700 ml-4" style={{ filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.5))' }}>
                            SONS
                        </span>
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[1em] text-purple-400/50">
                        <span className="animate-pulse">◆</span> NODE REGISTRATION <span className="animate-pulse">◆</span>
                    </div>
                    <style>{`
                        @import url('https://fonts.cdnfonts.com/css/azonix');
                        .group\/brand:hover {
                            font-family: 'Azonix', sans-serif !important;
                        }
                    `}</style>
                </div>

                {/* PROVISIONING PANEL WITH INTENSE GLOW */}
                <div className="relative group/card transform-gpu">
                    {/* EXTERNAL MOUSE-REACTIVE GLOW */}
                    <div
                        className="absolute -inset-16 rounded-[6rem] bg-purple-500/10 blur-[100px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000 pointer-events-none"
                        style={{
                            transform: `translate(${smoothMouse.x * 30}px, ${smoothMouse.y * 30}px)`
                        }}
                    ></div>

                    {/* DYNAMIC BORDER CORE GLOW */}
                    <div className="absolute -inset-[2px] rounded-[4.5rem] bg-gradient-to-br from-purple-500 via-transparent to-blue-600 opacity-30 group-hover/card:opacity-100 transition-opacity duration-700 animate-border-flow pointer-events-none"></div>

                    <div className="relative bg-[#02040a]/95 backdrop-blur-[200px] rounded-[4.5rem] p-8 sm:p-10 md:p-14 border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden">

                        {/* Holographic 3D Sweep */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent w-[300%] h-full animate-sweep pointer-events-none z-0"></div>

                        {error && (
                            <div className="mb-12 p-8 bg-red-500/5 border border-red-500/30 rounded-[2.5rem] flex items-center gap-8 text-red-100 text-[11px] font-black uppercase tracking-widest animate-glitch relative z-10">
                                <ShieldAlert size={32} className="shrink-0 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMsg ? (
                            <div className="py-20 text-center space-y-12 animate-scale-in relative z-10">
                                <div className="relative w-40 h-40 bg-emerald-500/10 border border-emerald-400/30 rounded-[4rem] flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(16,185,129,0.2)] animate-float">
                                    <CheckCircle2 size={80} className="text-emerald-400 animate-bounce drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                                </div>
                                <h3 className="text-4xl font-black uppercase text-white tracking-tighter">NODE PROVISIONED</h3>
                                <Link to="/login" className="inline-flex items-center gap-8 px-16 py-8 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.8em] shadow-3xl hover:bg-purple-600 hover:text-white transition-all transform hover:-translate-y-2">
                                    UPLINK TERMINAL <ArrowRight size={26} />
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* OAuth Buttons Section */}
                                <div className="mb-8 relative z-10">
                                    <div className="flex justify-between items-center mb-6 px-6">
                                        <label className="text-[10px] font-black text-blue-400/70 uppercase tracking-[0.5em] transition-all duration-300">QUICK ACCESS</label>
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full animate-pulse-slow"></div>
                                            <Zap size={14} className="relative text-blue-400/60 transition-all duration-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    
                                    <AnimatedOAuthButtons 
                                        onOAuthLogin={(provider: string) => {
                                            console.log(`OAuth login with ${provider}`);
                                        }}
                                        className="relative"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="relative z-10 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
                                        <span className="text-[10px] font-black text-blue-400/50 uppercase tracking-[0.3em]">OR</span>
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4 group/input">
                                        <div className="flex justify-between px-6">
                                            <label className="text-[10px] font-black text-purple-500/60 uppercase tracking-[0.6em] transition-all duration-500">Subject Hash</label>
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-full animate-pulse-slow"></div>
                                                <UserIcon size={14} className="relative text-purple-400/60 group-focus-within/input:text-purple-500 group-focus-within/input:scale-105 transition-all duration-500 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="relative overflow-hidden">
                                            {/* Animated shimmer border */}
                                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-purple-400/20 to-transparent opacity-0 group-focus-within/input:opacity-100 group-focus-within/input:animate-shimmer-slow pointer-events-none"></div>

                                            <input
                                                required
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="NAME_ID"
                                                className="w-full bg-[#0a0f1d]/90 border border-white/10 rounded-3xl py-7 px-10 text-xs font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] outline-none transition-all duration-500 text-white placeholder:text-gray-800 tracking-widest uppercase shadow-2xl relative z-20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 group/input">
                                        <div className="flex justify-between px-6">
                                            <label className="text-[10px] font-black text-purple-500/60 uppercase tracking-[0.6em] transition-all duration-500">Uplink Coord</label>
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-full animate-pulse-slow"></div>
                                                <Mail size={14} className="relative text-purple-400/60 group-focus-within/input:text-purple-500 group-focus-within/input:scale-105 transition-all duration-500 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="relative overflow-hidden">
                                            {/* Animated shimmer border */}
                                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-purple-400/20 to-transparent opacity-0 group-focus-within/input:opacity-100 group-focus-within/input:animate-shimmer-slow pointer-events-none"></div>

                                            <input
                                                required
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="UPLINKURL"
                                                className="w-full bg-[#0a0f1d]/90 border border-white/10 rounded-3xl py-7 px-10 text-xs font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] outline-none transition-all duration-500 text-white placeholder:text-gray-800 tracking-widest uppercase shadow-2xl relative z-20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 group/input">
                                    <div className="flex justify-between px-6">
                                        <label className="text-[10px] font-black text-purple-500/60 uppercase tracking-[0.6em] transition-all duration-500">Cipher Master</label>
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-full animate-pulse-slow"></div>
                                            <Lock size={14} className="relative text-purple-400/60 group-focus-within/input:text-purple-500 group-focus-within/input:scale-105 transition-all duration-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="relative overflow-hidden">
                                        {/* Animated shimmer border */}
                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-purple-400/20 to-transparent opacity-0 group-focus-within/input:opacity-100 group-focus-within/input:animate-shimmer-slow pointer-events-none"></div>

                                        <input
                                            required
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••••••"
                                            className="w-full bg-[#0a0f1d]/90 border border-white/10 rounded-3xl py-7 px-10 text-xs font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] outline-none transition-all duration-500 text-white placeholder:text-gray-800 shadow-2xl relative z-20"
                                        />
                                    </div>

                                    {password && (
                                        <div className="p-8 bg-purple-900/10 border border-purple-500/20 rounded-[3rem] space-y-6 animate-float shadow-inner">
                                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
                                                <span className="flex items-center gap-2"><Activity size={14} /> INTEGRITY</span>
                                                <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">{strengthLabels[Math.min(pwdStrength, 3)]}</span>
                                            </div>
                                            <div className="flex gap-4 h-2 px-1">
                                                {[0, 1, 2, 3].map((step) => (
                                                    <div
                                                        key={step}
                                                        className={`h-full flex-1 rounded-full transition-all duration-1000 ${pwdStrength > step ? `${strengthColors[Math.min(pwdStrength - 1, 3)]} shadow-[0_0_20px_currentColor]` : "bg-white/5"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    disabled={isLoading}
                                    type="submit"
                                    className="group relative w-full py-7 sm:py-10 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-[0.8em] sm:tracking-[1em] text-[12px] sm:text-[14px] transition-all shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] hover:-translate-y-2 active:scale-95 overflow-hidden border border-white/20"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <span className="relative z-10 flex items-center justify-center gap-8 group-hover:text-white transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">
                                        {isLoading ? <Loader2 className="animate-spin" size={36} /> : <>INITIATE NODE <ArrowRight size={32} /></>}
                                    </span>
                                    {/* Sweep Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[200%] h-full animate-sweep opacity-0 group-hover:opacity-100"></div>
                                </button>
                                </form>
                            </> 
                        )}

                        <div className="mt-16 pt-10 border-t border-white/5 text-center">
                            <p className="text-gray-600 text-[11px] font-black uppercase tracking-[0.6em]">
                                HAVE IDENTITY?{' '}
                                <Link to="/login" className="text-purple-400 hover:text-white transition-all ml-4 bg-purple-500/10 px-6 py-2 rounded-full border border-purple-500/30 hover:bg-purple-600 inline-block shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                                    SIGN IN
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* HUD FOOTER WITH INTERACTIVE DEPTH */}
                <div className="grid grid-cols-3 gap-8">
                    {[{ icon: CpuIcon, label: 'CLUSTER' }, { icon: Shield, label: 'SHIELD' }, { icon: Network, label: 'UPLINK' }].map((item, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-center gap-2 p-5 border border-purple-500/10 rounded-[2rem] bg-purple-900/5 shadow-2xl animate-float transition-all duration-700 hover:border-purple-500/40 hover:bg-purple-900/10"
                            style={{
                                animationDelay: `${idx * 0.3}s`,
                                transform: `translate(${smoothMouse.x * (5 + idx * 2)}px, ${smoothMouse.y * (5 + idx * 2)}px)`
                            }}
                        >
                            <item.icon size={20} className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-500/60">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes entrance3d {
          0% { transform: translateY(80px) scale(0.9) rotateX(15deg); opacity: 0; }
          100% { transform: translateY(0) scale(1) rotateX(0deg); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: rotateX(75deg) rotateY(15deg) translate(0, 0); }
          50% { transform: rotateX(75deg) rotateY(15deg) translate(20px, -40px); }
        }
        @keyframes sweep {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }
        @keyframes border-flow {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gradient-flow-reverse {
          0% { background-position: 100% 50%; }
          50% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        @keyframes float-text {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shimmer-slow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-gradient-flow { background-size: 200% 200%; animation: gradient-flow 4s ease infinite; }
        .animate-gradient-flow-reverse { background-size: 200% 200%; animation: gradient-flow-reverse 4s ease infinite; }
        .animate-float-text { animation: float-text 3s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        .animate-shimmer-slow { animation: shimmer-slow 3s ease-in-out infinite; }
        .animate-3d-entrance { animation: entrance3d 1.5s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
        .animate-sweep { animation: sweep 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .animate-border-flow { background-size: 200% 200%; animation: border-flow 6s linear infinite; }
      `}</style>
        </div>
    );
};
