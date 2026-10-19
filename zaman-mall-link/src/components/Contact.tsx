import React from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="py-24 px-4 md:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 text-gold font-black tracking-[0.4em] uppercase text-[10px] mb-6">
              <div className="w-8 h-[1px] bg-gold" />
              Direct Connection
            </div>
            
            <h2 className="font-serif text-5xl md:text-8xl mb-8 leading-[0.9] tracking-tighter text-white font-black">
              SAY <span className="text-gold italic font-light drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]">HELLO</span>
            </h2>
            
            <p className="text-white/80 mb-12 text-base md:text-xl font-bold leading-relaxed max-w-md tracking-wide">
              Need assistance? Our specialized support team is available 24/7 through 
              encrypted digital channels.
            </p>

            <div className="space-y-6 md:space-y-10 mb-12">
              <div className="group cursor-default">
                <p className="text-[11px] text-white/50 uppercase tracking-[0.4em] font-black mb-2 transition-colors">Digital Mail</p>
                <div className="flex items-center gap-4">
                  <Mail className="text-gold" size={24} />
                  <p className="text-lg md:text-3xl font-serif text-white transition-transform tracking-tight font-black">malikmuhammadadilzaman@gmail.com</p>
                </div>
              </div>

              <div className="group cursor-default">
                <p className="text-[11px] text-white/50 uppercase tracking-[0.4em] font-black mb-2 transition-colors">Voice Lines</p>
                <div className="flex items-center gap-4">
                  <Phone className="text-gold" size={24} />
                  <div className="space-y-2">
                    <p className="text-lg md:text-3xl font-serif text-white transition-transform tracking-tight font-black">0334-5866715</p>
                    <p className="text-lg md:text-3xl font-serif text-white transition-transform tracking-tight font-black">0348-9054973</p>
                  </div>
                </div>
              </div>

              <div className="group cursor-default">
                <p className="text-[11px] text-white/50 uppercase tracking-[0.4em] font-black mb-4 transition-colors">Social Network</p>
                <div className="flex items-center gap-6">
                  <motion.a 
                    href="#" 
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center text-gold border border-gold/20 hover:border-gold/50 transition-colors"
                  >
                    <Instagram size={20} />
                  </motion.a>
                  <motion.a 
                    href="#" 
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center text-gold border border-gold/20 hover:border-gold/50 transition-colors"
                  >
                    <Facebook size={20} />
                  </motion.a>
                  <motion.a 
                    href="#" 
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center text-gold border border-gold/20 hover:border-gold/50 transition-colors"
                  >
                    <Twitter size={20} />
                  </motion.a>
                  <motion.a 
                    href="#" 
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center text-gold border border-gold/20 hover:border-gold/50 transition-colors"
                  >
                    <Linkedin size={20} />
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Background glow for the form */}
            <div className="absolute -inset-4 bg-gold/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative liquid-glass p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border-white/30 shadow-2xl overflow-hidden">
              {/* Internal subtle glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/10 blur-[60px] rounded-full pointer-events-none" />
              
              <h3 className="text-xl md:text-2xl font-serif mb-8 text-white relative z-10">System Inquiry Form</h3>
              
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="NAME"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 md:py-5 focus:border-gold/50 focus:bg-white/10 outline-none transition-all placeholder:text-white/20 text-sm font-bold tracking-widest uppercase text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="email" 
                      placeholder="EMAIL"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 md:py-5 focus:border-gold/50 focus:bg-white/10 outline-none transition-all placeholder:text-white/20 text-sm font-bold tracking-widest uppercase text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <textarea 
                    rows={4}
                    placeholder="YOUR MESSAGE TO ADIL ZAMAN"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 md:py-5 focus:border-gold/50 focus:bg-white/10 outline-none transition-all placeholder:text-white/20 resize-none text-sm font-bold tracking-widest uppercase text-white"
                  ></textarea>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white/5 border-2 border-gold text-gold font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all text-[11px] md:text-xs tracking-[0.4em] uppercase"
                >
                  <Send size={16} />
                  Transmit Signal
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
