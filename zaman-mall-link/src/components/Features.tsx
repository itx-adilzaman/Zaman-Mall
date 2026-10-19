import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Zap, Utensils } from 'lucide-react';

const features = [
  {
    icon: <Sparkles className="text-gold" size={28} />,
    title: "Curated Boutiques",
    desc: "Discover an exclusive collection of international and local luxury brands tailored for the elite."
  },
  {
    icon: <Utensils className="text-gold" size={28} />,
    title: "Gourmet Dining",
    desc: "Savor world-class culinary experiences with a panoramic view of the city Skyline."
  },
  {
    icon: <Shield className="text-gold" size={28} />,
    title: "Secure Experience",
    desc: "Vip-level security and valet services ensuring your peace of mind and comfort."
  },
  {
    icon: <Zap className="text-gold" size={28} />,
    title: "Smart Navigation",
    desc: "Use our mobile app for interactive indoor maps and real-time boutique availability."
  }
];

export default function Features() {
  return (
    <section id="experience" className="py-24 px-6 relative z-10 bg-luxury-black/80">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-serif text-4xl md:text-6xl mb-6 tracking-tight">ELEVATED <span className="text-gold italic font-light">SERVICES</span></h2>
          <div className="w-24 h-px bg-gold mx-auto opacity-50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-3xl hover:border-gold/30 transition-all group"
            >
              <div className="mb-6 p-4 bg-white/5 rounded-2xl w-fit group-hover:bg-gold/10 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-xl font-serif font-semibold mb-3 tracking-wide">{f.title}</h3>
              <p className="text-white/50 font-light leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
