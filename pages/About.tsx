
import React, { useState, useRef } from 'react';
import { Zap, Target, Users, ShieldCheck, Globe, Rocket, Sparkles, TrendingUp, Award } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Mobile About ───────────────────────────────────────────────────────────────
const bg = '#0d0d0d'; const surface = '#1a1a1a'; const border = '#2a2a2a'; const text = '#f0f0f0'; const sub = '#888'; const accent = '#6366f1';

const MobileAboutView: React.FC = () => {
  const navigate = useNavigate();
  return (
  <div style={{ background: bg, minHeight: '100vh', paddingBottom: 80 }}>
    {/* Back button */}
    <div style={{ padding: '14px 16px 0' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: sub, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>
        ← Back
      </button>
    </div>
    {/* Hero */}
    <div style={{ padding: '20px 16px 20px', textAlign: 'center', borderBottom: `1px solid ${border}` }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 20, marginBottom: 14 }}>
        <Award size={13} style={{ color: accent }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>The Zaman Legacy</span>
      </div>
      <h1 style={{ fontWeight: 900, fontSize: 28, color: text, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Redefining<br /><span style={{ color: accent }}>The Standard</span></h1>
      <p style={{ fontSize: 14, color: sub, lineHeight: 1.6, margin: 0 }}>Pakistan's premier curated lifestyle destination — quality products at your doorstep since 2026.</p>
    </div>

    {/* Stats */}
    <div style={{ padding: '20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[{ icon: <TrendingUp size={20} style={{ color: '#3b82f6' }} />, num: '10k+', label: 'Global Brands' },
        { icon: <Users size={20} style={{ color: '#8b5cf6' }} />, num: '500k+', label: 'Active Clients' }].map(s => (
        <div key={s.label} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: '16px 14px' }}>
          {s.icon}
          <p style={{ fontWeight: 800, fontSize: 22, color: text, margin: '8px 0 2px' }}>{s.num}</p>
          <p style={{ fontSize: 11, color: sub, margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
        </div>
      ))}
    </div>

    {/* Story */}
    <div style={{ padding: '0 16px 20px' }}>
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: '18px 16px' }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, color: text, margin: '0 0 12px' }}>Our Story</h2>
        <p style={{ fontSize: 13, color: sub, lineHeight: 1.7, margin: '0 0 10px' }}>Zaman Sons began as a small family venture to bridge the gap between high-end global innovation and the local market. What started as a boutique passion project has evolved into a <strong style={{ color: text }}>digital-first powerhouse</strong>.</p>
        <p style={{ fontSize: 13, color: sub, lineHeight: 1.7, margin: 0 }}>We believe that luxury shouldn't be inaccessible. Every product in our catalog is meticulously selected to ensure only the absolute pinnacle of quality reaches your home.</p>
      </div>
    </div>

    {/* Philosophy cards */}
    <div style={{ padding: '0 16px 20px' }}>
      <h2 style={{ fontWeight: 800, fontSize: 18, color: text, margin: '0 0 14px' }}>Core Philosophy</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: <Target size={18} style={{ color: '#3b82f6' }} />, title: 'Our Mission', desc: 'To empower consumers through technology with a seamless, secure world-class shopping ecosystem.' },
          { icon: <ShieldCheck size={18} style={{ color: '#8b5cf6' }} />, title: 'Uncompromising Trust', desc: 'Every product is authenticated. Every transaction is encrypted. Your security is our primary directive.' },
          { icon: <Globe size={18} style={{ color: '#ec4899' }} />, title: 'Global Reach', desc: "We bring the world's best innovations to Pakistan, ensuring our community stays ahead." },
          { icon: <Users size={18} style={{ color: '#06b6d4' }} />, title: 'Community First', desc: "We don't just sell products; we build relationships. Our support team is here for you 24/7." },
          { icon: <Rocket size={18} style={{ color: '#f97316' }} />, title: 'Innovation Focus', desc: 'Constantly evolving our AI and logistical tools to make your experience faster and smarter.' },
          { icon: <Zap size={18} style={{ color: '#eab308' }} />, title: 'Peak Performance', desc: 'From browsing to unboxing, we strive for perfection in every micro-interaction.' },
        ].map(item => (
          <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', background: surface, border: `1px solid ${border}`, borderRadius: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: text, margin: '0 0 4px' }}>{item.title}</p>
              <p style={{ fontSize: 12, color: sub, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* CTA */}
    <div style={{ padding: '0 16px 10px' }}>
      <div style={{ background: `linear-gradient(135deg, ${accent}22, #8b5cf622)`, border: `1px solid ${accent}30`, borderRadius: 16, padding: '22px 18px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 800, fontSize: 20, color: text, margin: '0 0 8px' }}>Be Part of the <span style={{ color: accent }}>Future</span></h2>
        <p style={{ fontSize: 13, color: sub, margin: '0 0 16px', lineHeight: 1.5 }}>Zaman Sons is more than a name — it's a promise of quality and a gateway to next-gen lifestyle commerce.</p>
        <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: accent, color: '#fff', padding: '11px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Start Shopping <Rocket size={15} />
        </Link>
      </div>
    </div>
  </div>
  );
};

export const About: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileAboutView />;

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = heroRef.current.getBoundingClientRect();
    const x = ((clientX - left) / width) * 2 - 1;
    const y = ((clientY - top) / height) * 2 - 1;
    setMousePos({ x, y });
  };

  return (
    <div className="relative overflow-hidden bg-[#020617] text-white">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full animate-float"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full animate-pulse stagger-3"></div>
        <div className="absolute top-[60%] left-[20%] w-[300px] h-[300px] bg-pink-600/5 blur-[80px] rounded-full animate-float stagger-2"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-32 relative z-10">
        {/* Hero Section */}
        <section 
          ref={heroRef}
          onMouseMove={handleMouseMove}
          className="text-center space-y-8 reveal py-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-white/10 text-xs font-bold text-blue-400 mb-2 animate-bounce">
            <Award size={14} className="fill-current" /> The Zaman Legacy
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none transition-transform duration-500 ease-out"
              style={{ transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)` }}>
            Redefining <br />
            <span className="gradient-text">The Standard</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-xl leading-relaxed">
            Founded with a vision to bring global excellence to your doorstep, Zaman Sons Super Mall is Pakistan's premier curated lifestyle destination.
          </p>
          
          <div className="flex justify-center gap-4 pt-4">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping stagger-1"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping stagger-2"></div>
          </div>
        </section>

        {/* Story Section with High-Fidelity Innovation Lab Image */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="reveal-left space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-black uppercase tracking-tight">Our Story</h2>
              <div className="w-20 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
            </div>
            <div className="space-y-6 text-gray-400 leading-relaxed text-lg">
              <p>
                Zaman Sons began as a small family venture with a single goal: to bridge the gap between high-end global innovation and the local market. 
                What started as a boutique passion project has evolved into a <span className="text-white font-bold">digital-first powerhouse</span>.
              </p>
              <p>
                We believe that luxury shouldn't be inaccessible. Every team member meticulously selects every product in our catalog, ensuring that only the absolute pinnacle of technology reaches your home.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div className="group relative glass p-8 rounded-3xl border-white/5 transition-all duration-500 hover:scale-105 hover:bg-white/10 card-glow-hover">
                <TrendingUp className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={28} />
                <p className="text-4xl font-black text-white mb-1">10k+</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">Global Brands</p>
              </div>
              <div className="group relative glass p-8 rounded-3xl border-white/5 transition-all duration-500 hover:scale-105 hover:bg-white/10 card-glow-hover">
                <Users className="text-purple-500 mb-4 group-hover:scale-110 transition-transform" size={28} />
                <p className="text-4xl font-black text-white mb-1">500k+</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">Active Clients</p>
              </div>
            </div>
          </div>
          
          <div className="reveal-right relative group">
            {/* Ambient Glow behind image */}
            <div className="absolute -inset-8 bg-gradient-to-tr from-blue-600/30 via-purple-600/30 to-transparent rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden glass border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] z-10 transition-all duration-700 group-hover:scale-[1.03] group-hover:border-blue-500/30">
              {/* High Fidelity Lab Image */}
              <img 
                src="https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=1200" 
                alt="Zaman Innovation Lab" 
                className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" 
              />
              
              {/* Overlay Accents */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60"></div>
              <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
              
              <div className="absolute bottom-10 left-10 flex flex-col gap-3">
                 <div className="flex items-center gap-3">
                    <div className="p-3 glass rounded-2xl bg-white/5">
                      <Sparkles size={20} className="text-blue-400 animate-pulse" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-[0.4em] text-white">Zaman Innovation Lab</span>
                 </div>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] ml-1">Karachi Research Node #04</p>
              </div>

              {/* Decorative Tech Corners */}
              <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-white/10 group-hover:border-blue-500/40 transition-colors"></div>
              <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-white/10 group-hover:border-blue-500/40 transition-colors pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* Core Philosophy Section */}
        <section className="space-y-16">
          <div className="text-center reveal">
            <h2 className="text-4xl font-black uppercase tracking-tight mb-4">Core Philosophy</h2>
            <p className="text-gray-500 max-w-xl mx-auto">The engineering values that power our platform every second of every day.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { 
                icon: <Target className="text-blue-400" />, 
                title: "Our Mission", 
                desc: "To empower consumers through technology by providing a seamless, secure, and world-class shopping ecosystem.",
                gradient: "from-blue-600/20"
              },
              { 
                icon: <ShieldCheck className="text-purple-400" />, 
                title: "Uncompromising Trust", 
                desc: "Every product is authenticated. Every transaction is encrypted. Your security is our primary directive.",
                gradient: "from-purple-600/20"
              },
              { 
                icon: <Globe className="text-pink-400" />, 
                title: "Global Reach", 
                desc: "We bring the world's best innovations to Pakistan, ensuring our community stays ahead of the curve.",
                gradient: "from-pink-600/20"
              },
              { 
                icon: <Users className="text-cyan-400" />, 
                title: "Community First", 
                desc: "We don't just sell products; we build relationships. Our support team is here for you 24/7.",
                gradient: "from-cyan-600/20"
              },
              { 
                icon: <Rocket className="text-orange-400" />, 
                title: "Innovation Focus", 
                desc: "We are constantly evolving our AI and logistical tools to make your experience faster and smarter.",
                gradient: "from-orange-600/20"
              },
              { 
                icon: <Zap className="text-yellow-400" />, 
                title: "Peak Performance", 
                desc: "From browsing to unboxing, we strive for perfection in every micro-interaction.",
                gradient: "from-yellow-600/20"
              },
            ].map((item, idx) => (
              <div key={idx} className={`reveal stagger-${(idx % 3) + 1} group relative`}>
                <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] transition-all duration-500 group-hover:from-white/20"></div>
                <div className="relative glass p-10 rounded-[2.5rem] border-white/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden group-hover:-translate-y-3">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  <div className="relative w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-xl group-hover:rotate-6">
                    {React.cloneElement(item.icon as React.ReactElement<any>, { size: 32 })}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                    {item.desc}
                  </p>
                  
                  <div className="mt-8 w-12 h-1 bg-white/5 rounded-full overflow-hidden transition-all duration-500 group-hover:w-24">
                     <div className={`h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-float`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing Vision Section */}
        <section className="reveal py-20">
          <div className="glass rounded-[3rem] p-12 md:p-20 border-white/10 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-transparent relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] -z-10"></div>
            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight">
                  Be Part of the <span className="gradient-text">Future</span>
               </h2>
               <p className="text-gray-400 text-lg">
                  Zaman Sons is more than a name; it's a promise of quality, a legacy of trust, and a gateway to the next generation of lifestyle commerce.
               </p>
               <div className="pt-4">
                  <a href="#/shop" className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all hover:scale-105 shadow-xl shadow-blue-600/20 group">
                    Start Your Experience <Rocket size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
