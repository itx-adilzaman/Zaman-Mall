
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Zap, AlertCircle, Loader2, ShieldCheck, Cpu, Terminal, Network, Sparkles, Database, Fingerprint, Box, Shield } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import AnimatedOAuthButtons from '../components/AnimatedOAuthButtons';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Mobile Login ───────────────────────────────────────────────────────────────
const MobileLoginView: React.FC = () => {
  const { login, currentUser, isAuthLoading } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (currentUser && !isAuthLoading) navigate(from, { replace: true });
  }, [currentUser, isAuthLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await login(email, password);
      if (!result.success) { setError(result.message || 'Login failed. Please try again.'); }
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
        <h1 style={{ fontWeight: 900, fontSize: 26, color: '#f0f0f0', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Welcome Back</h1>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Sign in to your Zaman Mall account</p>
      </div>

      {/* Form card */}
      <div style={{ margin: '0 16px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10 }}>
            <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* OAuth */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, textAlign: 'center' }}>Quick Sign In</p>
          <AnimatedOAuthButtons onOAuthLogin={(p: string) => console.log(`OAuth: ${p}`)} className="" />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
          <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
        </div>

        {/* Email & Password */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inp} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
            </div>
          </div>

          <button type="submit" disabled={isLoading} style={{
            background: isLoading ? '#2a2a2a' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
            color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
            fontWeight: 800, fontSize: 16, cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 2,
          }}>
            {isLoading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* Register link */}
        <p style={{ textAlign: 'center', fontSize: 14, color: '#888', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>Register</Link>
        </p>
      </div>

      {/* Trust badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 28, padding: '0 24px' }}>
        {[{ icon: <ShieldCheck size={14} />, label: 'Secure' }, { icon: <Zap size={14} />, label: 'Fast' }, { icon: <Shield size={14} />, label: 'Protected' }].map(b => (
          <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>{b.icon}</div>
            <span style={{ fontSize: 10, color: '#555', fontWeight: 600 }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Import Azonix font
const AzonixFontLink = () => (
    <link href="https://fonts.cdnfonts.com/css/azonix" rel="stylesheet" />
);

export const Login: React.FC = () => {
    const isMobile = useIsMobile();
    if (isMobile) return <MobileLoginView />;

    const { login, currentUser, isAuthLoading } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Mouse Tracking State
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const from = (location.state as any)?.from?.pathname || "/";

    useEffect(() => {
        if (currentUser && !isAuthLoading) {
            navigate(from, { replace: true });
        }
    }, [currentUser, isAuthLoading, navigate, from]);

    // Smooth mouse interpolation
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await login(email, password);
            if (!result.success) {
                setError(result.message || "IDENT-AUTH ERROR: REFUSED.");
                setIsLoading(false);
            }
        } catch (err) {
            setError("UPLINK FATAL: TERMINAL DESYNC.");
            setIsLoading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#02040a] selection:bg-blue-500/30 perspective-[1500px]"
        >
            {/* 
          DYNAMIC BACKGROUND - Mouse Tracking Aura 
          Note: pointer-events-none is absolutely essential for clickability
      */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Mouse Tracking Core Glow */}
                <div
                    className="absolute inset-0 transition-opacity duration-1000"
                    style={{
                        background: `radial-gradient(1000px circle at ${50 + smoothMouse.x * 25}% ${50 + smoothMouse.y * 25}%, rgba(30, 58, 138, 0.4) 0%, transparent 70%)`
                    }}
                ></div>

                {/* Dynamic Interactive Grid */}
                <div
                    className="absolute inset-[-10%] opacity-[0.15] bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:4rem_4rem] transition-transform duration-500 ease-out"
                    style={{
                        transform: `translate(${smoothMouse.x * -30}px, ${smoothMouse.y * -30}px)`
                    }}
                ></div>

                {/* Floating Particles that track the mouse slightly */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400/40 rounded-full animate-float-slow"
                        style={{
                            left: `${(i * 7) % 100}%`,
                            top: `${(i * 13) % 100}%`,
                            transform: `translate(${smoothMouse.x * (10 + i)}px, ${smoothMouse.y * (10 + i)}px)`,
                            animationDelay: `${i * 0.2}s`
                        }}
                    ></div>
                ))}
            </div>

            <div className="w-full max-w-[480px] relative z-10 flex flex-col gap-10 animate-3d-entrance">
                {/* HUD HEADER */}
                <div className="text-center space-y-4">
                    <div className="relative inline-block group">
                        {/* Interactive Outer Glow */}
                        <div
                            className="absolute inset-[-20px] bg-blue-500 blur-[50px] opacity-20 transition-all duration-700 group-hover:opacity-60 pointer-events-none"
                            style={{ transform: `translate(${smoothMouse.x * 10}px, ${smoothMouse.y * 10}px)` }}
                        ></div>

                        {/* Premium Logo Section */}
                        <div className="relative p-5 bg-[#0f172a]/95 rounded-[2.5rem] border border-blue-400/30 shadow-[0_0_50px_rgba(37,99,235,0.2)] animate-float">
                          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 shadow-xl shadow-blue-600/30 group-hover:shadow-2xl group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                            {/* Dynamic gradient animation */}
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-40 transition-opacity duration-700 animate-gradient-flow"></div>
                            {/* Rotating border */}
                            <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-yellow-400 group-hover:via-blue-400 group-hover:to-purple-400 group-hover:animate-spin-slow"></div>
                            {/* Inner glow ring */}
                            <div className="absolute inset-1 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                            {/* Logo */}
                            <img src="/images/zaman-logo.png" alt="Zaman Sons Mall" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            {/* Floating particles */}
                            <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 animate-bounce shadow-[0_0_6px_rgba(250,204,21,0.8)]"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-bounce shadow-[0_0_6px_rgba(96,165,250,0.8)]" style={{ animationDelay: '0.3s' }}></div>
                          </div>
                          <div className="absolute top-2 right-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_#10b981]"></div>
                          </div>
                        </div>
                    </div>

                    <div className="space-y-1 relative">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter relative animate-float-text cursor-pointer group/brand" style={{ fontFamily: 'system-ui, sans-serif', transition: 'font-family 700ms ease' }}>
                            {/* Vibrant gradient text */}
                            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-flow transition-all duration-700" style={{ filter: 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.6))' }}>
                                ZAMAN
                            </span>
                            <span className="bg-gradient-to-r from-pink-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-flow-reverse transition-all duration-700 ml-4" style={{ filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))' }}>
                                SONS
                            </span>
                        </h1>
                        <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[1em] text-blue-400/50">
                            <span className="animate-pulse">◆</span> SECURE ACCESS TERMINAL <span className="animate-pulse">◆</span>
                        </div>
                        <style>{`
                            @import url('https://fonts.cdnfonts.com/css/azonix');
                            .group\/brand:hover {
                                font-family: 'Azonix', sans-serif !important;
                            }
                        `}</style>
                    </div>
                </div>

                {/* CARD WITH INTENSE DYNAMIC GLOWING EFFECT */}
                <div className="relative group/card">
                    {/* EXTERNAL MOUSE-REACTIVE GLOW */}
                    <div
                        className="absolute -inset-10 rounded-[5rem] bg-blue-500/10 blur-[80px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000 pointer-events-none"
                        style={{
                            transform: `translate(${smoothMouse.x * 20}px, ${smoothMouse.y * 20}px)`
                        }}
                    ></div>

                    {/* DYNAMIC BORDER GLOW */}
                    <div className="absolute -inset-[2px] rounded-[3.5rem] bg-gradient-to-br from-blue-500 via-transparent to-indigo-600 opacity-30 group-hover/card:opacity-100 transition-opacity duration-700 animate-border-flow pointer-events-none"></div>

                    <div className="relative bg-[#02040a]/95 backdrop-blur-[150px] rounded-[3.5rem] p-8 sm:p-10 md:p-14 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">

                        {/* Holographic Glowing Sweep */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent w-[300%] h-full animate-sweep pointer-events-none z-0"></div>

                        {error && (
                            <div className="mb-10 p-6 bg-red-500/5 border border-red-500/30 rounded-3xl flex items-center gap-6 text-red-200 text-[11px] font-black uppercase tracking-widest animate-glitch relative z-10">
                                <AlertCircle size={24} className="shrink-0 text-red-500" />
                                <span>{error}</span>
                            </div>
                        )}

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

                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <div className="flex justify-between px-6">
                                    <label className="text-[10px] font-black text-blue-400/70 uppercase tracking-[0.5em] transition-all duration-300">Terminal Path</label>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full animate-pulse-slow"></div>
                                        <Mail size={14} className="relative text-blue-400/60 group-focus-within/input:text-blue-400 group-focus-within/input:scale-105 transition-all duration-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="relative group/input">
                                    {/* Animated shimmer border */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 group-focus-within/input:opacity-100 group-focus-within/input:animate-shimmer pointer-events-none"></div>

                                    {/* Focus glow */}
                                    <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                    {/* Animated icon */}
                                    <Mail className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0a0f1d] group-focus-within/input:text-blue-400 group-focus-within/input:scale-110 transition-all duration-300 z-10 pointer-events-none" size={20} />

                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ACCOUNT@NODE"
                                        className="w-full bg-[#0a0f1d]/90 border border-white/10 rounded-2xl py-6 pl-20 pr-10 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 focus:shadow-[0_0_30px_rgba(59,130,246,0.2)] focus:-translate-y-0.5 outline-none transition-all duration-300 text-white placeholder:text-gray-800 tracking-widest uppercase shadow-2xl relative z-20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between px-6">
                                    <label className="text-[10px] font-black text-blue-400/70 uppercase tracking-[0.5em] transition-all duration-300">Auth Secret</label>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full animate-pulse-slow"></div>
                                        <Lock size={14} className="relative text-blue-400/60 group-focus-within/input:text-blue-400 group-focus-within/input:scale-105 transition-all duration-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="relative group/input">
                                    {/* Animated shimmer border */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 group-focus-within/input:opacity-100 group-focus-within/input:animate-shimmer pointer-events-none"></div>

                                    {/* Focus glow */}
                                    <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                    {/* Animated icon */}
                                    <Lock className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0a0f1d] group-focus-within/input:text-blue-400 group-focus-within/input:scale-110 group-focus-within/input:rotate-12 transition-all duration-300 z-10 pointer-events-none" size={20} />

                                    <input
                                        required
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full bg-[#0a0f1d]/90 border border-white/10 rounded-2xl py-6 pl-20 pr-10 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 focus:shadow-[0_0_30px_rgba(59,130,246,0.2)] focus:-translate-y-0.5 outline-none transition-all duration-300 text-white placeholder:text-gray-800 tracking-[0.6em] shadow-2xl relative z-20"
                                    />
                                </div>
                            </div>

                            <button
                                disabled={isLoading}
                                type="submit"
                                className="group relative w-full py-6 sm:py-8 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[2rem] font-black uppercase tracking-[0.8em] sm:tracking-[1em] text-[11px] sm:text-[13px] text-white transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)] hover:-translate-y-2 active:scale-95 border border-white/20 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
                                <span className="relative z-10 flex items-center justify-center gap-6">
                                    {isLoading ? <Loader2 className="animate-spin" size={30} /> : <>IDENT_INIT <ArrowRight size={26} /></>}
                                </span>
                                {/* Button Glow Aura */}
                                <div className="absolute inset-0 bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        </form>

                        <div className="mt-14 pt-8 border-t border-white/5 text-center">
                            <p className="text-gray-600 text-[11px] font-black uppercase tracking-[0.4em]">
                                NEW NODE?{' '}
                                <Link to="/register" className="text-blue-400 hover:text-white transition-all ml-4 bg-blue-500/10 px-6 py-2 rounded-full border border-blue-400/30 hover:bg-blue-600 inline-block shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                    REGISTER
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* HUD FOOTER WITH GLOWING BOXES */}
                <div className="grid grid-cols-3 gap-6">
                    {[{ icon: Cpu, label: 'CPU' }, { icon: Shield, label: 'SSL' }, { icon: Network, label: 'LINK' }].map((item, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-center gap-2 p-4 border border-blue-500/10 rounded-[1.5rem] bg-blue-900/5 shadow-2xl animate-float transition-all duration-700 hover:border-blue-500/40 hover:bg-blue-900/10"
                            style={{
                                animationDelay: `${idx * 0.2}s`,
                                transform: `translate(${smoothMouse.x * (5 + idx)}px, ${smoothMouse.y * (5 + idx)}px)`
                            }}
                        >
                            <item.icon size={16} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-blue-500/60">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes entrance3d {
          0% { transform: translateY(80px) scale(0.9) rotateX(20deg); opacity: 0; }
          100% { transform: translateY(0) scale(1) rotateX(0deg); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-10px, -20px); }
        }
        @keyframes sweep {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }
        @keyframes border-flow {
          0%, 100% { background-position: 0% 0%; border-color: rgba(59, 130, 246, 0.3); }
          50% { background-position: 100% 100%; border-color: rgba(99, 102, 241, 0.8); }
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
        .animate-gradient-flow { background-size: 200% 200%; animation: gradient-flow 4s ease infinite; }
        .animate-gradient-flow-reverse { background-size: 200% 200%; animation: gradient-flow-reverse 4s ease infinite; }
        .animate-float-text { animation: float-text 3s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        .animate-3d-entrance { animation: entrance3d 1.2s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-sweep { animation: sweep 5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .animate-border-flow { background-size: 200% 200%; animation: border-flow 4s linear infinite; }
      `}</style>
        </div>
    );
};
