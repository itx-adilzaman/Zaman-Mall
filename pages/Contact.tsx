
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, ArrowRight, Zap, ShieldCheck, MailWarning, Activity, Globe, Sparkles, Cpu, Loader2 } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Mobile Contact ─────────────────────────────────────────────────────────────
const bg = '#0d0d0d'; const surface = '#1a1a1a'; const border = '#2a2a2a'; const text = '#f0f0f0'; const sub = '#888'; const accent = '#6366f1';

const MobileContactView: React.FC = () => {
  const { addMessage } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      await addMessage(formData);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${border}` }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: sub, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 6, padding: 0 }}>
          ← Back
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: text, margin: 0 }}>Contact Us</h1>
        <p style={{ fontSize: 12, color: sub, margin: '3px 0 0' }}>Get in touch with us</p>
      </div>

      <div style={{ padding: '16px' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: surface, borderRadius: 14, border: `1px solid ${border}` }}>
            <CheckCircle size={48} style={{ color: '#16a34a', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 700, fontSize: 18, color: text, marginBottom: 6 }}>Message Sent!</p>
            <p style={{ fontSize: 13, color: sub, marginBottom: 18 }}>We'll get back to you soon.</p>
            <button onClick={() => setSent(false)} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Send Another</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9, padding: '10px 13px', color: '#ef4444', fontSize: 13 }}>{error}</div>}
            {[
              { label: 'Your Name', key: 'name', type: 'text', placeholder: 'Enter your name' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'your@email.com' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: sub, marginBottom: 5 }}>{f.label}</label>
                <input required type={f.type} value={(formData as any)[f.key]} onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 13px', background: surface, border: `1px solid ${border}`, borderRadius: 9, fontSize: 14, color: text, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: sub, marginBottom: 5 }}>Subject</label>
              <select value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                style={{ width: '100%', padding: '10px 13px', background: surface, border: `1px solid ${border}`, borderRadius: 9, fontSize: 14, color: text, outline: 'none', boxSizing: 'border-box' }}>
                <option>General Inquiry</option>
                <option>Order Support</option>
                <option>Wholesale/Business</option>
                <option>Tech Issue</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: sub, marginBottom: 5 }}>Message</label>
              <textarea required value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} rows={4} placeholder="Write your message here..."
                style={{ width: '100%', padding: '10px 13px', background: surface, border: `1px solid ${border}`, borderRadius: 9, fontSize: 14, color: text, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={isLoading} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? <Loader2 size={18} /> : <><Send size={16} /> Send Message</>}
            </button>
          </form>
        )}

        {/* Contact info */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: <Mail size={16} style={{ color: accent }} />, label: 'Email', value: 'malikmuhammadadilzaman@gmail.com' },
            { icon: <Phone size={16} style={{ color: '#8b5cf6' }} />, label: 'Phone', value: '+92 334-5866715' },
            { icon: <MapPin size={16} style={{ color: '#ec4899' }} />, label: 'Location', value: 'KallarKahar, Chakwal' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: surface, border: `1px solid ${border}`, borderRadius: 11 }}>
              {item.icon}
              <div>
                <p style={{ fontSize: 10, color: sub, fontWeight: 600, margin: '0 0 2px', textTransform: 'uppercase' }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: 0 }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Contact: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileContactView />;

  const { addMessage } = useStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mouse tracking states
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const targetEmail = "malikmuhammadadilzaman@gmail.com";

  // Smooth lerp for mouse movement
  useEffect(() => {
    let frameId: number;
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const animate = () => {
      setSmoothMouse(prev => ({
        x: lerp(prev.x, mousePos.x, 0.08),
        y: lerp(prev.y, mousePos.y, 0.08)
      }));
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, [mousePos]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 2 - 1; // -1 to 1
    const y = ((e.clientY - top) / height) * 2 - 1; // -1 to 1
    setMousePos({ x, y });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Execute transmission
      await addMessage(formData);

      setIsLoading(false);
      setIsSubmitted(true);
      
      // Show message
      setShowMessage(true);
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setShowMessage(false);
      }, 3000);
    } catch (err: any) {
      console.error("Signal Broadcast Error:", err);
      setError(err?.message || "Network protocol failure. Transmission saved to internal node only.");
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen relative overflow-hidden bg-[#010409] text-white pt-24 pb-32 selection:bg-blue-500 selection:text-white"
    >
      {/* Advanced Multi-Layer Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Parallax Grid Layer */}
        <div
          className="absolute inset-0 opacity-[0.05] transition-transform duration-[1.5s] ease-out"
          style={{ transform: `translate(${smoothMouse.x * 15}px, ${smoothMouse.y * 15}px) scale(1.1)` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:80px_80px]"></div>
        </div>

        {/* Dynamic Aether Nodes */}
        <div
          className="absolute top-1/4 right-[-10%] w-[60vw] h-[60vw] bg-blue-600/[0.04] blur-[160px] rounded-full transition-transform duration-[2.5s] ease-out"
          style={{ transform: `translate(${smoothMouse.x * -60}px, ${smoothMouse.y * -60}px)` }}
        ></div>
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/[0.03] blur-[140px] rounded-full transition-transform duration-[2.5s] ease-out"
          style={{ transform: `translate(${smoothMouse.x * 40}px, ${smoothMouse.y * 40}px)` }}
        ></div>

        {/* Grain Noise */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-24">
        {/* Hero Section: Orchestrated Initialization */}
        <section className="text-center space-y-8 animate-slide-up">
          <div
            className="inline-flex items-center gap-3 px-6 py-2 glass-dark border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.5em] rounded-full mb-2 shadow-2xl animate-float"
            style={{ transform: `translate(${smoothMouse.x * 10}px, ${smoothMouse.y * 10}px)` }}
          >
            <MessageSquare size={14} className="animate-pulse" /> Support Terminal Connectivity: Online
          </div>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-[0.85] text-white">
            Establish <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 via-blue-400 to-blue-600 italic font-display tracking-normal capitalize">Connection</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-xl leading-relaxed font-medium tracking-wide">
            Broadcasting high-priority signals directly to the <span className="text-white">Zaman Sons Executive Node</span> for curated evaluation.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
          {/* Contact Information & Channels */}
          <div className="lg:col-span-5 space-y-10 animate-fade-in stagger-1">
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-4">
                <Globe className="text-blue-500 animate-spin-slow" size={28} /> Communication Hubs
              </h2>
              <p className="text-gray-500 leading-relaxed font-medium uppercase text-[10px] tracking-[0.3em]">System Receptor Status: Listening</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {[
                { icon: <Mail className="text-blue-400" />, title: "Primary Receptor", value: targetEmail, sub: "Direct Executive Terminal Link" },
                { icon: <Phone className="text-purple-400" />, title: "Voice Transmission", value: "+92 334-5866715", sub: "Operational: 0900 - 1800 PKT" },
                { icon: <MapPin className="text-pink-400" />, title: "Node Headquarters", value: "KallarKahar , Chakwal", sub: "Regional Sovereign Hub" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`glass-dark p-10 rounded-[3rem] border border-white/5 flex items-center gap-8 hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-2xl animate-slide-up stagger-${idx + 1}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-white/5 shadow-inner">
                    {/* Fixed React.cloneElement type error by adding <any> generic to React.ReactElement cast */}
                    {React.cloneElement(item.icon as React.ReactElement<any>, { size: 32 })}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-2">{item.title}</h3>
                    <p className="text-xl font-black text-white group-hover:text-blue-400 transition-colors truncate tracking-tight">{item.value}</p>
                    <p className="text-[8px] text-gray-700 font-bold mt-2 uppercase tracking-widest">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="glass-dark p-10 rounded-[3.5rem] border border-blue-600/20 bg-blue-600/5 relative overflow-hidden group shadow-2xl animate-scale-in stagger-4"
              style={{ transform: `rotateY(${smoothMouse.x * 5}deg) rotateX(${smoothMouse.y * -5}deg)` }}
            >
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <ShieldCheck className="absolute -right-8 -bottom-8 w-40 h-40 text-blue-600/10 rotate-12 group-hover:rotate-0 transition-transform duration-[2s]" />
              <h3 className="text-xl font-black mb-4 flex items-center gap-4 text-white uppercase tracking-tight">
                <ShieldCheck size={24} className="text-blue-500 animate-pulse" /> Encryption Verified
              </h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium italic">Your transmission will be end-to-end encrypted and dispatched via the Zaman Sons Sovereign API.</p>
              <a
                href={`mailto:${targetEmail}?subject=Support Inquiry`}
                className="group/link inline-flex items-center gap-4 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-blue-400 font-black text-[10px] uppercase tracking-[0.4em] hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all shadow-xl active:scale-95"
              >
                Initialize Mail Protocol <ArrowRight size={16} className="group-hover/link:translate-x-2 transition-transform" />
              </a>
            </div>
          </div>

          {/* Contact Form Terminal */}
          <div className="lg:col-span-7 animate-scale-in stagger-2">
            {isSubmitted ? (
              <div className="glass-dark p-16 md:p-24 rounded-[4rem] border border-green-500/30 text-center space-y-10 h-full flex flex-col justify-center animate-scale-in shadow-[0_50px_120px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <div className="absolute inset-0 bg-green-500/[0.02] animate-pulse"></div>
                <div className="w-24 h-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-[0_20px_50px_rgba(34,197,94,0.2)]">
                  <CheckCircle size={48} className="text-green-400 animate-bounce" />
                </div>
                <div className="space-y-4 relative z-10">
                  <h3 className="text-4xl font-black uppercase tracking-tighter text-white">Signal Received</h3>
                  <p className="text-gray-400 text-lg leading-relaxed font-medium max-w-md mx-auto italic">
                    "The neural link is active. Your inquiry has been cached in our primary terminal and routed to our executive curators."
                  </p>
                </div>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="group inline-flex items-center gap-4 px-12 py-5 bg-white text-black rounded-full font-black uppercase tracking-[0.4em] text-[10px] hover:bg-blue-500 hover:text-white transition-all shadow-2xl relative z-10 overflow-hidden"
                >
                  <span className="relative z-10">Reset Terminal</span>
                  <div className="absolute inset-0 bg-black/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
              </div>
            ) : (
              <div className="glass-dark rounded-[4rem] p-12 md:p-16 border border-white/10 shadow-[0_60px_150px_rgba(0,0,0,0.9)] relative overflow-hidden backdrop-blur-3xl group/card">
                {/* Dynamic Card Interaction Layer */}
                <div
                  className="absolute -inset-px opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000 pointer-events-none"
                  style={{
                    background: `radial-gradient(800px circle at ${(smoothMouse.x + 1) * 50}% ${(smoothMouse.y + 1) * 50}%, rgba(59, 130, 246, 0.1), transparent 40%)`
                  }}
                ></div>

                <div className="flex items-center justify-between mb-12 relative z-10">
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Inquiry Terminal</h3>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] mt-2">Protocol Node: SUP-0X72</p>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-2 glass border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-[0.4em] rounded-full shadow-lg">
                    <Activity size={14} className="animate-pulse" /> Verified Node
                  </div>
                </div>

                {error && (
                  <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400 text-xs font-black uppercase tracking-widest animate-scale-in">
                    <MailWarning size={20} />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4 animate-slide-up stagger-1">
                      <label className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] ml-6">Identity Alias</label>
                      <div className="relative group/input overflow-hidden rounded-2xl">
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your Name"
                          className="w-full bg-[#050914] border border-white/5 rounded-2xl py-5 px-8 text-sm font-bold text-white focus:ring-0 focus:border-blue-500/60 outline-none transition-all shadow-inner"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-500 group-focus-within/input:w-full transition-all duration-700"></div>
                      </div>
                    </div>
                    <div className="space-y-4 animate-slide-up stagger-2">
                      <label className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] ml-6">Neural Link Link (Email)</label>
                      <div className="relative group/input overflow-hidden rounded-2xl">
                        <input
                          required
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                          className="w-full bg-[#050914] border border-white/5 rounded-2xl py-5 px-8 text-sm font-bold text-white focus:ring-0 focus:border-blue-500/60 outline-none transition-all shadow-inner"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-500 group-focus-within/input:w-full transition-all duration-700"></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 animate-slide-up stagger-3">
                    <label className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] ml-6">Frequency (Subject)</label>
                    <div className="relative group/input overflow-hidden rounded-2xl">
                      <select
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full bg-[#050914] border border-white/5 rounded-2xl py-5 px-8 text-sm font-bold text-white focus:ring-0 focus:border-blue-500/60 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                      >
                        <option className="bg-[#030712]">General Inquiry</option>
                        <option className="bg-[#030712]">Order Support</option>
                        <option className="bg-[#030712]">Wholesale/Business</option>
                        <option className="bg-[#030712]">Tech Issue</option>
                      </select>
                      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-500 group-focus-within/input:w-full transition-all duration-700"></div>
                    </div>
                  </div>

                  <div className="space-y-4 animate-slide-up stagger-4">
                    <label className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] ml-6">Signal Content (Message)</label>
                    <div className="relative group/input overflow-hidden rounded-3xl">
                      <textarea
                        required
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        rows={5}
                        placeholder="Transmission details..."
                        className="w-full bg-[#050914] border border-white/5 rounded-3xl py-8 px-10 text-sm font-medium text-gray-400 focus:ring-0 focus:border-blue-500/60 outline-none transition-all resize-none leading-relaxed shadow-inner"
                      ></textarea>
                      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-500 group-focus-within/input:w-full transition-all duration-700"></div>
                    </div>
                  </div>

                  <button
                    disabled={isLoading}
                    className="group relative w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.6em] text-[11px] transition-all shadow-[0_30px_60px_rgba(37,99,235,0.4)] flex items-center justify-center gap-6 overflow-hidden active:scale-95 disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center gap-6">
                      {isLoading ? <Loader2 className="animate-spin" size={24} /> : "Send Secure Transmission"}
                      <Send size={24} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>

                  <div className="flex items-center justify-center gap-4 opacity-20 mt-6 animate-fade-in stagger-5">
                    <div className="w-10 h-px bg-white/20"></div>
                    <Cpu size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Internal Node Redirection: Active</span>
                    <div className="w-10 h-px bg-white/20"></div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple Message Notification */}
      {showMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} />
            <span className="font-semibold">Message Sent Successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
};
