import React from 'react';
import { motion } from 'motion/react';
import { Download, Globe, ChevronDown } from 'lucide-react';

const APK_URL = "https://download1326.mediafire.com/gio9eiwmiwkgO0wW2chboQ8sGOKwvpppm8KA3ryhxnzJjr06Fbwj6LNsADr7qhR5bmiAzZrKUCG9rLD2orCYURClelUMkUbpoQrnUgtTrOs38-fxWFLRFnebRWZkwjW0I7fUWeeUh8yA-2pCtW7DtFSXeHsXfHPS3eDmiObtzldPsZs/r5t6ji70ez47hip/Zaman+Mall.apk";

export default function Hero() {
  return (
    <section id="home" className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl z-20"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass border border-gold/30 mb-8 shadow-lg shadow-gold/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
          </span>
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-gold">System Online • v1.0.42</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-8 flex justify-center"
        >
          <img 
            src="./assets/zaman-logo1.png" 
            alt="Zaman Mall Logo" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-gold shadow-[0_0_50px_rgba(255,215,0,0.4)]"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <h1 className="font-serif text-5xl sm:text-7xl md:text-9xl mb-6 leading-[0.9] tracking-tighter text-white font-black">
          ZAMAN <span className="text-gradient block italic font-light drop-shadow-[0_0_50px_rgba(255,215,0,0.4)]">MALL</span>
        </h1>
        
        <p className="text-white/90 text-sm md:text-xl max-w-xl mx-auto mb-12 font-bold leading-relaxed px-4 tracking-wide drop-shadow-md">
          Step into a hyper-luxury dimension. Our digital ecosystem bridges the physical 
          grandeur of Zaman Mall with next-gen interactive accessibility.
        </p>

        <div className="flex flex-col xs:flex-row items-center justify-center gap-4 md:gap-6 w-full max-w-sm mx-auto xs:max-w-none">
          <motion.a
            href="https://zamanmall.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-3 bg-white text-black px-8 md:px-12 py-5 rounded-3xl font-black text-sm md:text-lg shadow-[0_0_40px_rgba(255,215,0,0.3)] transition-all w-full xs:w-auto uppercase tracking-tighter outline outline-2 outline-white/20"
          >
            <Globe size={22} className="animate-spin-slow" />
            Visit Our Store
          </motion.a>

          <motion.a
            href={APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-3 liquid-glass border border-gold/40 px-8 md:px-12 py-5 rounded-3xl font-black text-sm md:text-lg transition-all w-full xs:w-auto uppercase tracking-tighter text-white shadow-lg shadow-gold/20 outline outline-2 outline-gold/30"
          >
            <Download size={22} className="text-gold" />
            Zaman Mall App
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
