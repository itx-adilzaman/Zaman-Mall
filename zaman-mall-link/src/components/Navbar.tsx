import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Menu, X } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-4 py-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between liquid-glass rounded-[2rem] px-4 md:px-8 py-3 ring-1 ring-white/20 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
        <motion.div 
          initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3 md:gap-4 shrink-0"
        >
          <img 
            src="./assets/zaman-logo1.png" 
            alt="Zaman Mall Logo" 
            className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border-2 border-gold shadow-[0_0_20px_rgba(255,215,0,0.5)]"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-serif text-lg md:text-3xl font-black tracking-tighter leading-none text-white drop-shadow-lg">ZAMAN MALL</span>
            <span className="text-[7px] md:text-[10px] uppercase tracking-[0.4em] text-gold font-black drop-shadow-sm">Digital Luxury Center</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-2 md:gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 bg-gradient-to-br from-gold via-white to-gold text-black px-4 md:px-8 py-2 md:py-4 rounded-full font-black text-[10px] md:text-sm tracking-[0.2em] uppercase shadow-2xl transition-all"
          >
            <ShoppingBag size={16} className="md:w-5 md:h-5" />
            <span className="hidden xs:inline">Enter Portal</span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
