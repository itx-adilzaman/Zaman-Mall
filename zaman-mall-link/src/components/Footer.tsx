import React from 'react';
import { Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-10 px-6 relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <img 
            src="./assets/zaman-logo1.png" 
            alt="Zaman Mall Logo" 
            className="w-10 h-10 rounded-full object-cover border border-gold/40 shadow-lg shadow-gold/20"
            referrerPolicy="no-referrer"
          />
          <span className="font-serif text-lg font-black tracking-tight text-white uppercase">Zaman Mall</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#" className="text-white/40 hover:text-gold transition-all hover:scale-110 active:scale-95">
            <Instagram size={18} />
          </a>
          <a href="#" className="text-white/40 hover:text-gold transition-all hover:scale-110 active:scale-95">
            <Facebook size={18} />
          </a>
          <a href="#" className="text-white/40 hover:text-gold transition-all hover:scale-110 active:scale-95">
            <Twitter size={18} />
          </a>
          <a href="#" className="text-white/40 hover:text-gold transition-all hover:scale-110 active:scale-95">
            <Linkedin size={18} />
          </a>
        </div>

        <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] font-black text-white/40">
          <a href="#" className="transition-colors">Privacy</a>
          <a href="#" className="transition-colors">Terms</a>
          <a href="https://zamanmall.netlify.app" className="transition-colors italic">Main Store</a>
        </div>

        <p className="text-[10px] font-black text-white/20 tracking-widest uppercase">
          © 2026 ZAMAN MALL • DESIGN BY ADIL ZAMAN
        </p>
      </div>
    </footer>
  );
}
