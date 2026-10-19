import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, Info } from 'lucide-react';

export const OrderConfirmation: React.FC = () => {
  const [params] = useSearchParams();
  const method   = params.get('method') || 'cod';      // 'easypaisa' | 'jazzcash' | 'cod'
  const name     = params.get('name')   || 'Customer';
  const orderId  = params.get('id')     || '';

  const isOnline = method === 'easypaisa' || method === 'jazzcash';

  const steps = isOnline
    ? [
        { n: '1', color: 'amber',   title: 'Payment Review',    desc: 'Adil Zaman 1-2 ghanton mein aapki receipt check karein ge.' },
        { n: '2', color: 'emerald', title: 'Order Placement',   desc: 'Payment approve hote hi order automatically active ho jaye ga.' },
        { n: '3', color: 'blue',    title: 'Delivery',           desc: 'Order confirm hone ke 24 ghante mein dispatch.' },
        { n: '4', color: 'red',     title: 'Rejection (agar hua)', desc: 'Agar payment reject ho toh My Orders mein status update ho ga.' },
      ]
    : [
        { n: '1', color: 'emerald', title: 'Order Confirmed',   desc: 'Aapka order record ho gaya hai.' },
        { n: '2', color: 'blue',    title: 'Processing',         desc: '24 ghante ke andar dispatch tayar ho jaye ga.' },
        { n: '3', color: 'amber',   title: 'Delivery',           desc: 'Order aapke address par deliver hoga.' },
        { n: '4', color: 'gray',    title: 'Returns',            desc: '7 din ke andar return request kar sakte hain.' },
      ];

  const colorMap: Record<string, string> = {
    amber:   'bg-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue:    'bg-blue-500/20 text-blue-400',
    red:     'bg-red-500/20 text-red-400',
    purple:  'bg-purple-500/20 text-purple-400',
    gray:    'bg-white/5 text-gray-500',
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-16 bg-[#010409]">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-emerald-500/5 blur-[180px] rounded-full animate-pulse" />
        {isOnline && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-amber-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        )}
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch relative z-10">

        {/* ── Left card ─────────────────────────────── */}
        <div className="glass-dark p-8 md:p-12 rounded-[3.5rem] border-emerald-500/20 text-center flex flex-col justify-center shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>

          <h2 className="font-display text-4xl md:text-5xl font-black mb-3 text-white uppercase tracking-tight leading-none">
            Order <span className="text-emerald-500 italic">Received!</span>
          </h2>

          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] mb-8">
            {isOnline ? 'Awaiting Payment Approval' : 'Confirmed'}
          </p>

          {orderId && (
            <p className="text-[10px] font-mono text-gray-600 mb-4">
              Order ID: <span className="text-white font-black">{orderId}</span>
            </p>
          )}

          <p className="text-gray-400 text-sm font-medium leading-relaxed mb-6">
            Shukriya <span className="text-white font-black">{name}</span>!
            Aapka order hamare paas aa gaya hai.
          </p>

          {isOnline && (
            <div className="space-y-3 mb-6">
              <div className="px-5 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left space-y-2">
                <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} className="animate-pulse" /> Payment Verification Pending
                </p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Jab <span className="text-white font-black">Adil Zaman</span> aapki payment approve
                  kar dein ge, aapka order automatically place ho jaye ga.
                </p>
              </div>
              <div className="px-5 py-3 bg-white/[0.03] border border-white/5 rounded-2xl">
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Filhal aapka order{' '}
                  <span className="text-amber-400 font-black">Pending Payment</span>{' '}
                  section mein hai.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              to="/orders"
              className="py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.4em] text-[9px] transition-all shadow-xl"
            >
              {isOnline ? 'Check Payment Status' : 'Track My Order'}
            </Link>
            <Link
              to="/shop"
              className="py-5 glass-dark hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-[0.4em] text-[9px] transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* ── Right card ────────────────────────────── */}
        <div className="glass-dark p-8 md:p-12 rounded-[3.5rem] border-white/5 shadow-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
            <Info size={20} className="text-emerald-500" />
            <h3 className="text-lg font-black uppercase tracking-tighter text-white">
              Aage Kya <span className="text-gray-500 italic">Hoga?</span>
            </h3>
          </div>

          <div className="space-y-5 flex-grow">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorMap[s.color] || colorMap.gray}`}>
                  <span className="text-[10px] font-black">{s.n}</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-white">{s.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-30">
            <span className="text-[8px] font-black uppercase tracking-[1em] text-white">Zaman Mall</span>
            <span className="text-[8px] font-black uppercase text-gray-500">© 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
