import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import {
  ArrowRight, Truck, CheckCircle, Clock, ShoppingBag, Banknote, CreditCard,
  XCircle, AlertCircle, Loader2, RefreshCw, MessageSquare, Send, Upload, ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Mobile Orders ──────────────────────────────────────────────────────────────
const bg = '#0d0d0d'; const surface = '#1a1a1a'; const border = '#2a2a2a'; const text = '#f0f0f0'; const sub = '#888'; const accent = '#6366f1';

const MobileOrdersView: React.FC = () => {
  const { orders = [], currentUser, cancelOrder, requestReturn, formatPrice } = useStore();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const navigate = useNavigate();

  const my = (orders || []).filter(o => o && o.userId === currentUser?.id);

  const pending = my.filter(o => ['easypaisa','jazzcash'].includes(o.paymentMethod) && ['awaiting_approval','pending',undefined,null].includes(o.paymentStatus as any));
  const rejected = my.filter(o => ['easypaisa','jazzcash'].includes(o.paymentMethod) && o.paymentStatus === 'rejected');
  const active = my.filter(o => {
    const online = ['easypaisa','jazzcash'].includes(o.paymentMethod);
    if (!online) return true;
    return ['approved','paid'].includes(o.paymentStatus || '');
  });

  const statusColor = (s: string) => ({ delivered:'#16a34a', shipped:'#3b82f6', cancelled:'#555', returned:'#8b5cf6', pending:'#f97316' }[s] || '#f97316');
  const statusBg   = (s: string) => ({ delivered:'rgba(22,163,74,0.12)', shipped:'rgba(59,130,246,0.12)', cancelled:'rgba(85,85,85,0.12)', returned:'rgba(139,92,246,0.12)', pending:'rgba(249,115,22,0.12)' }[s] || 'rgba(249,115,22,0.12)');

  const canReturn = (o: any) => {
    if (!o || o.status !== 'delivered' || o.returnRequest) return false;
    const d = o.deliveredAt ? new Date(o.deliveredAt) : new Date(o.date);
    return Math.ceil(Math.abs(Date.now() - d.getTime()) / 86400000) <= 7;
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this order? This is irreversible.')) return;
    setCancellingId(id);
    try { await cancelOrder(id); } finally { setCancellingId(null); }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId || !returnReason.trim()) return;
    setSubmittingReturn(true);
    try { await requestReturn(returnOrderId, returnReason); setReturnOrderId(null); setReturnReason(''); }
    catch (err: any) { alert(err?.message || 'Failed'); }
    finally { setSubmittingReturn(false); }
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${border}` }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: sub, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 8, padding: 0 }}>
          ← Back
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: text, margin: 0 }}>My Orders</h1>
        <p style={{ fontSize: 12, color: sub, margin: '3px 0 0' }}>{my.length} order{my.length !== 1 ? 's' : ''}</p>
      </div>

      {my.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px' }}>
          <ShoppingBag size={52} style={{ color: '#333', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontWeight: 700, fontSize: 17, color: text, marginBottom: 6 }}>No orders yet</p>
          <p style={{ fontSize: 13, color: sub, marginBottom: 16 }}>Start shopping to see your orders here.</p>
          <Link to="/shop" style={{ display: 'inline-block', background: accent, color: '#fff', padding: '9px 20px', borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Shop Now</Link>
        </div>
      ) : (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Pending payment */}
          {pending.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <Clock size={13} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Awaiting Payment Approval</span>
              </div>
              <div style={{ padding: '10px 13px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 11, marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: '#f59e0b', margin: 0, fontWeight: 600 }}>Jab Adil Zaman approve karein ge, orders automatically active ho jayen ge.</p>
              </div>
              {pending.map(o => (
                <div key={o.id} style={{ background: surface, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '13px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>#{o.id?.slice(0,10)}</span>
                    <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '2px 9px' }}>{o.paymentStatus === 'awaiting_approval' ? 'Awaiting Approval' : 'Pending'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: sub }}>{o.paymentMethod === 'easypaisa' ? '📱 Easypaisa' : '💳 JazzCash'}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: text }}>{formatPrice(o.total || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {(o.items || []).slice(0,3).map((item: any, i: number) => (
                      <img key={i} src={item?.image} alt="" style={{ width: 36, height: 36, borderRadius: 7, objectFit: 'cover', border: `1px solid ${border}` }} />
                    ))}
                    {(o.items || []).length > 3 && <span style={{ fontSize: 10, color: sub, alignSelf: 'center' }}>+{o.items.length-3}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <div>
              {rejected.map(o => (
                <div key={o.id} style={{ background: surface, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '13px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>#{o.id?.slice(0,10)}</span>
                    <span style={{ fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '2px 9px' }}>Rejected</span>
                  </div>
                  <p style={{ fontSize: 11, color: sub, margin: '6px 0 0' }}>Payment reject ho gayi. Support se rabta karein.</p>
                </div>
              ))}
            </div>
          )}

          {/* Active orders */}
          {active.map(o => (
            <div key={o.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', opacity: o.status === 'cancelled' ? 0.6 : 1 }}>
              {/* Order header */}
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <p style={{ fontSize: 11, color: sub, margin: '0 0 2px', fontWeight: 600 }}>#{o.id?.slice(0,10)}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: '0 0 2px' }}>{formatPrice(o.total || 0)}</p>
                  <p style={{ fontSize: 11, color: sub, margin: 0 }}>{o.date ? new Date(o.date).toLocaleDateString() : '—'}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(o.status || 'pending'), background: statusBg(o.status || 'pending'), border: `1px solid ${statusColor(o.status||'pending')}40`, borderRadius: 20, padding: '3px 10px', flexShrink: 0, textTransform: 'capitalize' }}>
                  {o.status || 'pending'}
                </span>
              </div>

              {/* Items */}
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {(o.items || []).map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, background: bg, border: `1px solid ${border}`, borderRadius: 9, padding: '6px 9px' }}>
                      <img src={item?.image} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: text, margin: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item?.name}</p>
                        <p style={{ fontSize: 10, color: sub, margin: 0 }}>×{item?.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '10px 14px', display: 'flex', gap: 8 }}>
                {o.status === 'pending' && (
                  <button onClick={() => handleCancel(o.id)} disabled={cancellingId === o.id} style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {cancellingId === o.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
                {canReturn(o) && (
                  <button onClick={() => setReturnOrderId(o.id)} style={{ flex: 1, padding: '8px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, color: '#8b5cf6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Return
                  </button>
                )}
                {o.returnRequest && (
                  <div style={{ flex: 1, padding: '8px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: '#8b5cf6', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>Return: {o.returnRequest.status}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Return modal */}
      {returnOrderId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setReturnOrderId(null)}>
          <div style={{ background: surface, borderRadius: '18px 18px 0 0', padding: '20px 18px', width: '100%', border: `1px solid ${border}` }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: text, margin: '0 0 6px' }}>Return Request</h3>
            <p style={{ fontSize: 12, color: sub, margin: '0 0 16px' }}>Delivery ke 7 din ke andar return allowed hai.</p>
            <form onSubmit={handleReturn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea required value={returnReason} onChange={e => setReturnReason(e.target.value)} rows={3} placeholder="Return ka reason describe karein..."
                style={{ width: '100%', padding: '10px 13px', background: bg, border: `1px solid ${border}`, borderRadius: 10, fontSize: 14, color: text, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              <button type="submit" disabled={submittingReturn} style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {submittingReturn ? 'Submitting...' : 'Submit Return'}
              </button>
              <button type="button" onClick={() => setReturnOrderId(null)} style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 10, padding: '10px', fontWeight: 600, fontSize: 13, color: sub, cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const UserOrders: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileOrdersView />;

  const { orders = [], currentUser, cancelOrder, requestReturn, formatPrice } = useStore();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const myOrders = (orders || []).filter(o => o && o.userId === currentUser?.id);

  // Pending payment = easypaisa/jazzcash AND not yet approved/rejected
  const pendingPaymentOrders = myOrders.filter(
    o => (o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash') &&
      (o.paymentStatus === 'awaiting_approval' || o.paymentStatus === 'pending' || !o.paymentStatus)
  );

  // Rejected payment
  const rejectedPaymentOrders = myOrders.filter(
    o => (o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash') &&
      o.paymentStatus === 'rejected'
  );

  // Active orders — COD always active, online only when approved/paid
  const activeOrders = myOrders.filter(o => {
    const isOnline = o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash';
    if (!isOnline) return true; // COD → always active
    return o.paymentStatus === 'approved' || o.paymentStatus === 'paid';
  });

  // ── helpers ──────────────────────────────────────────────────────────────
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={14} className="text-green-400" />;
      case 'shipped':   return <Truck size={14} className="text-blue-400" />;
      case 'cancelled': return <XCircle size={14} className="text-gray-500" />;
      case 'returned':  return <RefreshCw size={14} className="text-purple-400" />;
      default:          return <Clock size={14} className="text-orange-400" />;
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? This is irreversible.')) return;
    try {
      setCancellingId(id);
      await cancelOrder(id);
    } catch {
      alert('Could not cancel order. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId || !returnReason.trim()) return;
    setIsSubmittingReturn(true);
    try {
      await requestReturn(returnOrderId, returnReason);
      setReturnOrderId(null);
      setReturnReason('');
    } catch (e: any) {
      alert(`Return request failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const canReturnOrder = (order: any) => {
    if (!order || order.status !== 'delivered' || order.returnRequest) return false;
    const deliveryDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.date);
    const diffDays = Math.ceil(Math.abs(Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-24 animate-fade-in min-h-screen">

      {/* Page header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 reveal">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 glass border-white/10 rounded-lg text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
            My Orders
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none text-white">
            Asset <span className="gradient-text">Archive</span>
          </h1>
          <p className="text-gray-400 text-lg font-medium">All your orders in one place.</p>
        </div>
        <Link
          to="/shop"
          className="px-8 py-4 glass border-white/10 hover:border-blue-500/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-400 flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
        >
          Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>

      {myOrders.length === 0 ? (
        /* ── Empty state ── */
        <div className="text-center py-48 glass-dark rounded-[5rem] border-dashed border-white/10 shadow-3xl bg-white/[0.01] reveal">
          <div className="relative mb-12">
            <ShoppingBag size={80} className="mx-auto text-gray-800 animate-float" />
            <div className="absolute inset-0 bg-blue-500/10 blur-3xl opacity-50 -z-10" />
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-white">No Orders Yet</h3>
          <p className="text-gray-500 mb-12 max-w-sm mx-auto font-medium text-lg leading-relaxed">
            You haven't placed any orders yet. Start shopping to see them here.
          </p>
          <Link
            to="/shop"
            className="inline-flex px-16 py-6 bg-white text-black rounded-full font-black uppercase tracking-[0.6em] text-[11px] transition-all hover:bg-blue-600 hover:text-white shadow-3xl active:scale-95 hover:scale-105"
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="space-y-16">

          {/* ════════════════════════════════════════════════════
              SECTION 1 — Pending Payment Orders
          ════════════════════════════════════════════════════ */}
          {(pendingPaymentOrders.length > 0 || rejectedPaymentOrders.length > 0) && (
            <div className="space-y-6">

              {/* Section label */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Clock size={14} className="text-amber-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Pending Payment Approval
                  </span>
                  {pendingPaymentOrders.length > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black text-[9px] font-black">
                      {pendingPaymentOrders.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Info banner */}
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-4">
                <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-amber-400 mb-1">
                    Aapke orders payment approval ka intezaar kar rahe hain
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Jab <span className="text-white font-black">Adil Zaman</span> aapki payment approve kar dein ge,
                    yeh orders automatically active ho jayen ge aur processing shuru ho jaye gi.
                  </p>
                </div>
              </div>

              {/* Awaiting approval cards */}
              {pendingPaymentOrders.map((order, idx) => (
                <div
                  key={order?.id || idx}
                  className="glass-dark rounded-[2.5rem] border border-amber-500/20 bg-amber-500/[0.02] overflow-hidden shadow-xl"
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-wrap gap-8">
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-1">Order ID</p>
                        <p className="text-sm font-mono font-black text-amber-400">#{order?.id?.slice(0, 10)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-1">Date</p>
                        <p className="text-sm font-black text-white">
                          {order?.date ? new Date(order.date).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-1">Payment</p>
                        <p className="text-sm font-black text-white flex items-center gap-2">
                          <span>{order?.paymentMethod === 'easypaisa' ? '📱' : '💳'}</span>
                          {order?.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-1">Amount</p>
                        <p className="text-xl font-black text-amber-400">{formatPrice(order?.total || 0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Clock size={14} className="text-amber-400 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                        {order?.paymentStatus === 'awaiting_approval'
                          ? 'Receipt Submitted — Awaiting Approval'
                          : 'Awaiting Receipt Upload'}
                      </span>
                    </div>
                  </div>

                  {/* Items preview + receipt link */}
                  <div className="px-6 md:px-8 pb-6 flex flex-wrap items-center gap-3">
                    {(order?.items || []).slice(0, 4).map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2"
                      >
                        <img src={item?.image} className="w-7 h-7 rounded-lg object-cover" alt="" />
                        <span className="text-[10px] font-black text-gray-400 truncate max-w-[100px]">{item?.name}</span>
                        <span className="text-[9px] text-gray-600">×{item?.quantity}</span>
                      </div>
                    ))}
                    {(order?.items || []).length > 4 && (
                      <span className="text-[10px] text-gray-600 font-black">
                        +{order.items.length - 4} more
                      </span>
                    )}
                    {order?.paymentReceiptUrl && (
                      <a
                        href={order.paymentReceiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                      >
                        <ExternalLink size={11} /> View Receipt
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {/* Rejected payment cards */}
              {rejectedPaymentOrders.map((order, idx) => (
                <div
                  key={order?.id || idx}
                  className="glass-dark rounded-[2.5rem] border border-red-500/20 bg-red-500/[0.02] overflow-hidden shadow-xl"
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-wrap gap-8">
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-1">Order ID</p>
                        <p className="text-sm font-mono font-black text-red-400">#{order?.id?.slice(0, 10)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-1">Amount</p>
                        <p className="text-xl font-black text-white">{formatPrice(order?.total || 0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                      <XCircle size={14} className="text-red-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                        Payment Rejected
                      </span>
                    </div>
                  </div>
                  <div className="px-6 md:px-8 pb-5 flex items-center gap-3">
                    <AlertCircle size={14} className="text-red-400/70" />
                    <p className="text-[11px] text-red-400/70">
                      Aapki payment reject ho gayi. Mazeed madad ke liye support se rabta karein.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════════════════════════════════════════════════════
              SECTION 2 — Active Orders
          ════════════════════════════════════════════════════ */}
          {activeOrders.length > 0 && (
            <div className="space-y-10">

              {/* Divider when both sections exist */}
              {(pendingPaymentOrders.length > 0 || rejectedPaymentOrders.length > 0) && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Active Orders</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
              )}

              {activeOrders.map((order, idx) => (
                <div
                  key={order?.id || idx}
                  className={`glass-dark rounded-[3rem] border-white/5 overflow-hidden transition-all hover:border-white/10 group reveal stagger-${(idx % 3) + 1} ${order?.status === 'cancelled' ? 'opacity-50 grayscale' : ''}`}
                >
                  {/* Order header */}
                  <div className="p-8 md:p-10 bg-white/[0.02] border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-grow">
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-2">Order ID</p>
                        <p className="text-sm font-mono font-black text-blue-400 tracking-tighter uppercase">
                          #{order?.id?.slice(0, 8) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-2">Date</p>
                        <p className="text-sm font-black text-white">
                          {order?.date ? new Date(order.date).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-2">Payment</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                          {order?.paymentMethod === 'cod'
                            ? <><Banknote size={14} className="text-blue-500" /> Cash on Delivery</>
                            : order?.paymentMethod === 'easypaisa'
                            ? <><span>📱</span> Easypaisa ✓</>
                            : order?.paymentMethod === 'jazzcash'
                            ? <><span>💳</span> JazzCash ✓</>
                            : <><CreditCard size={14} className="text-purple-500" /> Online</>}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-2">Total</p>
                        <p className="text-xl font-black gradient-text tracking-tighter">
                          {formatPrice(order?.total || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 border shadow-xl ${
                      order?.status === 'delivered' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      order?.status === 'shipped'   ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                      order?.status === 'cancelled' ? 'bg-white/5 border-white/10 text-gray-500' :
                      order?.status === 'returned'  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                                      'bg-orange-500/10 border-orange-500/20 text-orange-400'
                    }`}>
                      {getStatusIcon(order?.status || 'pending')} {order?.status || 'pending'}
                    </div>
                  </div>

                  {/* Order body */}
                  <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-3 space-y-6">
                      {(order?.items || []).map((item, i) => (
                        <div key={i} className="flex items-center gap-6 group/item p-4 glass rounded-3xl border-transparent hover:border-white/5 transition-all">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black border border-white/10 shrink-0 group-hover/item:scale-105 transition-transform duration-500">
                            <img src={item?.image} alt={item?.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="text-base font-black text-white group-hover/item:text-blue-400 transition-colors uppercase tracking-tight truncate">
                              {item?.name || 'Unknown Item'}
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item?.selectedVariants && Object.entries(item.selectedVariants).map(([k, v]) => (
                                <span key={k} className="text-[9px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">
                                  {k}: <span className="text-gray-400">{v}</span>
                                </span>
                              ))}
                              <span className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest bg-blue-400/5 px-2 py-1 rounded-lg">
                                Qty: {item?.quantity || 0}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-white tracking-tighter">
                              {formatPrice((item?.price || 0) * (item?.quantity || 0))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-white/5 pt-8 lg:pt-0 lg:pl-10 flex flex-col justify-between space-y-8">
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-600 tracking-widest mb-4">
                          Shipping Address
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium bg-black/40 p-5 rounded-2xl border border-white/5">
                          {order?.shippingAddress || '—'}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {order?.status === 'pending' && (
                          <button
                            onClick={() => order && handleCancel(order.id)}
                            disabled={!!cancellingId}
                            className="group w-full py-4 bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                          >
                            {cancellingId === order?.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <XCircle size={16} className="group-hover:rotate-90 transition-transform" />}
                            Cancel Order
                          </button>
                        )}

                        {canReturnOrder(order) && (
                          <button
                            onClick={() => order && setReturnOrderId(order.id)}
                            className="group w-full py-4 bg-purple-600/10 border border-purple-500/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                          >
                            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                            Return Item
                          </button>
                        )}

                        {order?.returnRequest && (
                          <div className="p-4 glass rounded-2xl border-purple-500/20 bg-purple-500/5">
                            <p className="text-[8px] font-black uppercase text-purple-400 tracking-widest mb-1">
                              Return Status
                            </p>
                            <p className="text-[10px] font-bold text-white uppercase">
                              {order.returnRequest.status}
                            </p>
                          </div>
                        )}

                        <button className="w-full py-4 glass border-white/10 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all text-gray-500 hover:text-white">
                          Support
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ── Return Request Modal ────────────────────────────────────────────── */}
      {returnOrderId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={() => setReturnOrderId(null)}
          />
          <div className="relative w-full max-w-xl glass-dark border border-purple-500/30 rounded-[3rem] p-10 md:p-14 shadow-[0_50px_100px_rgba(0,0,0,0.9)] animate-fade-in">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Return Request</h3>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-2">
                  Within 7 days of delivery
                </p>
              </div>
              <button onClick={() => setReturnOrderId(null)} className="p-2 text-gray-500 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] ml-4 flex items-center gap-3">
                  <MessageSquare size={14} className="text-purple-400" /> Reason for Return
                </label>
                <textarea
                  required
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="Describe the issue with your order..."
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-[2.5rem] py-6 px-10 text-sm font-medium text-gray-300 focus:border-purple-500 outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-3xl flex items-start gap-4">
                <AlertCircle size={20} className="text-purple-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium leading-relaxed text-purple-200">
                  By submitting this return, you confirm the item is in its original condition. Our team will review and contact you.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmittingReturn}
                className="group relative w-full py-6 bg-purple-600 text-white rounded-full font-black uppercase tracking-[0.4em] text-[11px] transition-all hover:scale-105 active:scale-95 shadow-2xl overflow-hidden disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-4">
                  {isSubmittingReturn ? 'Submitting...' : 'Submit Return Request'}
                  <Send size={18} />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
