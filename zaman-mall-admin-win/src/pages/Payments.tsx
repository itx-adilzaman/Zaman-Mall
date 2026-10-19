import React, { useState, useMemo } from 'react';
import {
  CreditCard, CheckCircle2, XCircle, Clock, Upload,
  User as UserIcon, Mail, Phone, MapPin, ExternalLink,
  Search, X, Package, AlertCircle,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAlert } from '../context/AlertContext';
import { Order } from '../types';

type PayFilter = 'all' | 'awaiting_approval' | 'pending' | 'approved' | 'rejected';

const filterCfg: Record<PayFilter, { label: string; color: string }> = {
  all:               { label: 'All',       color: 'var(--text-subtle)' },
  awaiting_approval: { label: 'Awaiting',  color: '#f59e0b' },
  pending:           { label: 'No Receipt',color: '#f97316' },
  approved:          { label: 'Approved',  color: '#22c55e' },
  rejected:          { label: 'Rejected',  color: '#ef4444' },
};

const payStatusBadge = (ps: string | undefined) => {
  if (ps === 'approved')          return { label: '✓ Approved',  cls: 'badge-delivered' };
  if (ps === 'rejected')          return { label: '✗ Rejected',  cls: 'badge-cancelled' };
  if (ps === 'awaiting_approval') return { label: '⏳ Awaiting', cls: 'badge-pending' };
  return                                 { label: '⚠ No Receipt',cls: 'badge-pending' };
};

export default function Payments() {
  const { orders, approvePayment, rejectPayment, formatPrice } = useAdmin();
  const { showAlert } = useAlert();

  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<PayFilter>('awaiting_approval');
  const [selected, setSelected]   = useState<Order | null>(null);
  const [actionLoading, setAction] = useState<string | null>(null);

  const onlineOrders = useMemo(() =>
    orders.filter(o => o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash'),
    [orders]
  );

  const counts = useMemo(() => ({
    all:               onlineOrders.length,
    awaiting_approval: onlineOrders.filter(o => o.paymentStatus === 'awaiting_approval').length,
    pending:           onlineOrders.filter(o => !o.paymentStatus || o.paymentStatus === 'pending').length,
    approved:          onlineOrders.filter(o => o.paymentStatus === 'approved').length,
    rejected:          onlineOrders.filter(o => o.paymentStatus === 'rejected').length,
  }), [onlineOrders]);

  const filtered = useMemo(() => {
    let list = onlineOrders;
    if (filter !== 'all') {
      list = list.filter(o => {
        if (filter === 'pending') return !o.paymentStatus || o.paymentStatus === 'pending';
        return o.paymentStatus === filter;
      });
    }
    const ms = search.toLowerCase();
    if (ms) list = list.filter(o =>
      o.customerName?.toLowerCase().includes(ms) ||
      o.customerEmail?.toLowerCase().includes(ms) ||
      o.id.toLowerCase().includes(ms)
    );
    return list;
  }, [onlineOrders, filter, search]);

  const activeOrder = useMemo(() => {
    if (!selected) return null;
    return orders.find(o => o.id === selected.id) || selected;
  }, [selected, orders]);

  const handleApprove = async (id: string) => {
    setAction(id + '-approve');
    try {
      await approvePayment(id);
      showAlert('success', 'Payment Approved', 'The payment has been approved.');
      setSelected(null);
    } catch { showAlert('error', 'Failed', 'Could not approve payment.'); }
    finally { setAction(null); }
  };

  const handleReject = async (id: string) => {
    setAction(id + '-reject');
    try {
      await rejectPayment(id);
      showAlert('warning', 'Payment Rejected', 'The payment has been rejected.');
      setSelected(null);
    } catch { showAlert('error', 'Failed', 'Could not reject payment.'); }
    finally { setAction(null); }
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['awaiting_approval', 'pending', 'approved', 'rejected'] as PayFilter[]).map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className="card p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              border: filter === k ? `1px solid ${filterCfg[k].color}40` : undefined,
              background: filter === k ? `${filterCfg[k].color}10` : undefined,
            }}>
            <p className="text-2xl font-extrabold font-mono-num" style={{ color: filterCfg[k].color }}>
              {counts[k]}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-subtle)' }}>
              {filterCfg[k].label}
            </p>
          </button>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, ID…" className="input-field pl-9 py-2.5 text-sm" />
        </div>

        {/* Filter pills — scrollable on mobile */}
        <div className="pills-scroll shrink-0">
          {(Object.keys(filterCfg) as PayFilter[]).map(k => (
            <button key={k} onClick={() => setFilter(k)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap shrink-0"
              style={{
                background: filter === k ? `${filterCfg[k].color}18` : 'var(--card)',
                color: filter === k ? filterCfg[k].color : 'var(--text-subtle)',
                border: `1px solid ${filter === k ? filterCfg[k].color + '40' : 'var(--border)'}`,
              }}>
              {filterCfg[k].label}
              {k !== 'all' && <span className="ml-1 opacity-60">({counts[k]})</span>}
            </button>
          ))}
        </div>

        <span className="text-xs font-medium shrink-0 hidden sm:block" style={{ color: 'var(--text-subtle)' }}>
          {filtered.length} payment{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Empty states ── */}
      {onlineOrders.length === 0 ? (
        <div className="card py-20 text-center space-y-3">
          <CreditCard size={40} className="mx-auto opacity-20" style={{ color: 'var(--text-subtle)' }} />
          <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>No online payments yet</p>
          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
            Easypaisa &amp; JazzCash orders will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>No orders match this filter.</p>
        </div>
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="table-desktop card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Order', 'Customer', 'Method', 'Amount', 'Date', 'Receipt', 'Status', 'Actions'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => {
                    const ps = payStatusBadge(o.paymentStatus);
                    const isAwaiting = o.paymentStatus === 'awaiting_approval';
                    const isDone = o.paymentStatus === 'approved' || o.paymentStatus === 'rejected';
                    return (
                      <tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer">
                        <td>
                          <p className="text-xs font-bold font-mono-num" style={{ color: 'var(--brand)' }}>
                            #{o.id.slice(0, 10)}
                          </p>
                          <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                            {new Date(o.date).toLocaleDateString()}
                          </p>
                        </td>
                        <td>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{o.customerName}</p>
                          <p className="text-[10px] font-mono-num" style={{ color: 'var(--text-subtle)' }}>{o.customerPhone}</p>
                        </td>
                        <td>
                          <span className="flex items-center gap-1.5 text-xs font-bold">
                            <span className="text-base">{o.paymentMethod === 'easypaisa' ? '📱' : '💳'}</span>
                            <span style={{ color: o.paymentMethod === 'easypaisa' ? '#22c55e' : '#ef4444' }}>
                              {o.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="font-bold font-mono-num text-sm" style={{ color: 'var(--text)' }}>
                            {formatPrice(o.total)}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                            {new Date(o.date).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          {o.paymentReceiptUrl ? (
                            <a href={o.paymentReceiptUrl} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-[10px] font-bold hover:opacity-80"
                              style={{ color: 'var(--brand)' }}>
                              <ExternalLink size={11} /> View
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                              <Upload size={11} /> None
                            </span>
                          )}
                        </td>
                        <td><span className={`badge ${ps.cls}`}>{ps.label}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          {isAwaiting && (
                            <div className="flex gap-1.5">
                              <button disabled={!!actionLoading} onClick={() => handleApprove(o.id)}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                                {actionLoading === o.id + '-approve' ? '…' : '✓'}
                              </button>
                              <button disabled={!!actionLoading} onClick={() => handleReject(o.id)}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                {actionLoading === o.id + '-reject' ? '…' : '✗'}
                              </button>
                            </div>
                          )}
                          {isDone && <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>—</span>}
                          {!isAwaiting && !isDone && (
                            <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>Waiting</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="cards-mobile space-y-3">
            {filtered.map(o => {
              const ps = payStatusBadge(o.paymentStatus);
              const isAwaiting = o.paymentStatus === 'awaiting_approval';
              return (
                <div key={o.id} className="mobile-card cursor-pointer" onClick={() => setSelected(o)}>
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold font-mono-num" style={{ color: 'var(--brand)' }}>
                        #{o.id.slice(0, 12)}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                        {new Date(o.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge ${ps.cls}`}>{ps.label}</span>
                  </div>

                  {/* Customer + method */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{o.customerName}</p>
                      <p className="text-xs font-mono-num" style={{ color: 'var(--text-subtle)' }}>{o.customerPhone}</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                      <span className="text-base">{o.paymentMethod === 'easypaisa' ? '📱' : '💳'}</span>
                      <span style={{ color: o.paymentMethod === 'easypaisa' ? '#22c55e' : '#ef4444' }}>
                        {o.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}
                      </span>
                    </span>
                  </div>

                  {/* Amount + receipt + actions */}
                  <div className="flex items-center justify-between pt-3 border-t gap-2 flex-wrap"
                    style={{ borderColor: 'var(--border)' }}>
                    <p className="text-base font-extrabold font-mono-num" style={{ color: 'var(--brand)' }}>
                      {formatPrice(o.total)}
                    </p>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {o.paymentReceiptUrl && (
                        <a href={o.paymentReceiptUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
                          style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--brand)', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <ExternalLink size={11} /> Receipt
                        </a>
                      )}
                      {isAwaiting && (
                        <>
                          <button disabled={!!actionLoading} onClick={() => handleApprove(o.id)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-50"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                            {actionLoading === o.id + '-approve' ? '…' : '✓ Approve'}
                          </button>
                          <button disabled={!!actionLoading} onClick={() => handleReject(o.id)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-50"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            {actionLoading === o.id + '-reject' ? '…' : '✗ Reject'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Detail Modal ── */}
      {activeOrder && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-start justify-between" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-mono-num font-bold" style={{ color: 'var(--brand)' }}>
                    Order #{activeOrder.id.slice(0, 12)}
                  </p>
                  <span className="flex items-center gap-1 text-xs font-bold">
                    <span>{activeOrder.paymentMethod === 'easypaisa' ? '📱' : '💳'}</span>
                    <span style={{ color: activeOrder.paymentMethod === 'easypaisa' ? '#22c55e' : '#ef4444' }}>
                      {activeOrder.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}
                    </span>
                  </span>
                  <span className={`badge ${payStatusBadge(activeOrder.paymentStatus).cls}`}>
                    {payStatusBadge(activeOrder.paymentStatus).label}
                  </span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-subtle)' }}>
                  {new Date(activeOrder.date).toLocaleString()}
                </p>
              </div>
              <button className="btn-icon shrink-0" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Receipt + Actions */}
                <div className="space-y-4">
                  <p className="section-title flex items-center gap-1.5"><CreditCard size={11} />Payment Receipt</p>

                  {activeOrder.paymentReceiptUrl ? (
                    <div className="space-y-3">
                      <a href={activeOrder.paymentReceiptUrl} target="_blank" rel="noopener noreferrer">
                        <img src={activeOrder.paymentReceiptUrl} alt="Receipt"
                          className="w-full max-h-64 object-contain rounded-xl border hover:opacity-90 transition-opacity"
                          style={{ background: 'var(--hover)', borderColor: 'var(--border)' }} />
                      </a>
                      <a href={activeOrder.paymentReceiptUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold hover:opacity-80"
                        style={{ background: 'var(--hover)', color: 'var(--brand)', border: '1px solid var(--border)' }}>
                        <ExternalLink size={12} /> Open Full Receipt
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed"
                      style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}>
                      <Upload size={28} className="mb-3 opacity-30" style={{ color: 'var(--text-subtle)' }} />
                      <p className="text-xs font-bold" style={{ color: 'var(--text-subtle)' }}>No receipt uploaded yet</p>
                    </div>
                  )}

                  {activeOrder.paymentStatus === 'awaiting_approval' && (
                    <div className="flex gap-3 pt-1">
                      <button disabled={!!actionLoading} onClick={() => handleApprove(activeOrder.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                        <CheckCircle2 size={16} />
                        {actionLoading === activeOrder.id + '-approve' ? 'Processing…' : 'Approve'}
                      </button>
                      <button disabled={!!actionLoading} onClick={() => handleReject(activeOrder.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <XCircle size={16} />
                        {actionLoading === activeOrder.id + '-reject' ? 'Processing…' : 'Reject'}
                      </button>
                    </div>
                  )}

                  {activeOrder.paymentStatus === 'approved' && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <CheckCircle2 size={16} /> Payment Approved
                    </div>
                  )}
                  {activeOrder.paymentStatus === 'rejected' && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <XCircle size={16} /> Payment Rejected
                    </div>
                  )}
                  {(!activeOrder.paymentStatus || activeOrder.paymentStatus === 'pending') && (
                    <div className="flex items-center gap-2 py-3 px-4 rounded-xl text-xs font-medium"
                      style={{ background: 'rgba(249,115,22,0.08)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}>
                      <AlertCircle size={14} /> Customer hasn't uploaded a receipt yet.
                    </div>
                  )}
                </div>

                {/* Customer + Items */}
                <div className="space-y-4">
                  <div>
                    <p className="section-title flex items-center gap-1.5 mb-2"><UserIcon size={11} />Customer</p>
                    <div className="p-4 rounded-xl space-y-2.5" style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{activeOrder.customerName}</p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Mail size={12} style={{ color: 'var(--brand)' }} />
                        <span className="font-mono-num break-all">{activeOrder.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Phone size={12} style={{ color: 'var(--brand)' }} />
                        <span className="font-mono-num">{activeOrder.customerPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="section-title flex items-center gap-1.5 mb-2"><MapPin size={11} />Shipping</p>
                    <div className="p-4 rounded-xl flex gap-2.5" style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                      <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{activeOrder.shippingAddress}</p>
                    </div>
                  </div>

                  <div>
                    <p className="section-title flex items-center gap-1.5 mb-2"><Package size={11} />Items ({activeOrder.items.length})</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activeOrder.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl"
                          style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                          <div className="avatar w-10 h-10 rounded-lg shrink-0">
                            <img src={item.image} className="object-cover" alt="" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                            <p className="text-[10px] font-mono-num" style={{ color: 'var(--text-subtle)' }}>
                              Rs.{item.price.toLocaleString()} × {item.quantity}
                            </p>
                          </div>
                          <p className="text-xs font-bold font-mono-num shrink-0" style={{ color: 'var(--text)' }}>
                            Rs.{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="section-title mb-0.5">Total Amount</p>
                <p className="text-2xl font-extrabold font-mono-num" style={{ color: 'var(--brand)' }}>
                  {formatPrice(activeOrder.total)}
                </p>
              </div>
              <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-subtle)' }}>
                via {activeOrder.paymentMethod === 'easypaisa' ? '📱 Easypaisa' : '💳 JazzCash'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
