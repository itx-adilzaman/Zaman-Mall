import React, { useState, useMemo } from 'react';
import {
  ShoppingCart, User as UserIcon, MapPin, Mail, Phone, Package, X,
  Search, ChevronDown, Clock,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAlert } from '../context/AlertContext';
import { Order } from '../types';

const STATUS: Order['status'][] = ['pending', 'shipped', 'delivered', 'cancelled', 'returned'];

const statusCfg: Record<Order['status'], { label: string; badge: string }> = {
  pending:   { label: 'Pending',   badge: 'badge badge-pending' },
  shipped:   { label: 'Shipped',   badge: 'badge badge-shipped' },
  delivered: { label: 'Delivered', badge: 'badge badge-delivered' },
  cancelled: { label: 'Cancelled', badge: 'badge badge-cancelled' },
  returned:  { label: 'Returned',  badge: 'badge badge-returned' },
};

export default function Orders() {
  const { orders, updateOrderStatus, formatPrice } = useAdmin();
  const { showAlert } = useAlert();
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all' | Order['status']>('all');
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = useMemo(() => orders.filter(o => {
    const ms = search.toLowerCase();
    const match = !ms || o.customerName?.toLowerCase().includes(ms)
      || o.customerEmail?.toLowerCase().includes(ms) || o.id.toLowerCase().includes(ms);
    return match && (filter === 'all' || o.status === filter);
  }), [orders, search, filter]);

  const handleStatus = async (id: string, status: Order['status']) => {
    try {
      await updateOrderStatus(id, status);
      showAlert('success', 'Status Updated', `Order set to ${status}.`);
    } catch { showAlert('error', 'Failed', 'Could not update status.'); }
  };

  const activeOrder = useMemo(() => {
    if (!selected) return null;
    return orders.find(o => o.id === selected.id) || selected;
  }, [selected, orders]);

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Controls ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search orders…" className="input-field pl-9 py-2.5 text-sm" />
        </div>

        {/* Filter pills — horizontally scrollable on mobile */}
        <div className="pills-scroll shrink-0">
          {(['all', ...STATUS] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap shrink-0"
              style={{
                background: filter === s ? 'rgba(245,158,11,0.12)' : 'var(--card)',
                color: filter === s ? 'var(--brand)' : 'var(--text-subtle)',
                border: `1px solid ${filter === s ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
              }}>
              {s}
            </button>
          ))}
        </div>

        <span className="text-xs font-medium shrink-0 hidden sm:block" style={{ color: 'var(--text-subtle)' }}>
          {filtered.length} orders
        </span>
      </div>

      {/* ── Desktop Table ────────────────────────────────── */}
      <div className="table-desktop card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Order ID', 'Customer', 'Items', 'Total', 'Date', 'Status', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-xs" style={{ color: 'var(--text-subtle)' }}>
                    No orders found
                  </td>
                </tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="group" onClick={() => setSelected(o)}>
                  <td>
                    <p className="text-xs font-bold font-mono-num" style={{ color: 'var(--brand)' }}>#{o.id.slice(0, 10)}</p>
                    {o.paymentMethod === 'cod' && (
                      <span className="text-[9px] font-medium" style={{ color: 'var(--text-subtle)' }}>COD</span>
                    )}
                  </td>
                  <td>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{o.customerName}</p>
                    <p className="text-xs font-mono-num" style={{ color: 'var(--text-subtle)' }}>{o.customerEmail}</p>
                  </td>
                  <td>
                    <div className="flex -space-x-1.5">
                      {o.items.slice(0, 4).map((item, i) => (
                        <div key={i} className="avatar w-7 h-7 !rounded-lg ring-1">
                          <img src={item.image} alt="" className="object-cover" />
                        </div>
                      ))}
                      {o.items.length > 4 && (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold"
                          style={{ background: 'var(--hover)', color: 'var(--text-subtle)', border: '1px solid var(--border)' }}>
                          +{o.items.length - 4}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="font-bold font-mono-num text-sm" style={{ color: 'var(--text)' }}>{formatPrice(o.total)}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-subtle)' }}>
                      <Clock size={11} />
                      {new Date(o.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td><span className={statusCfg[o.status].badge}>{statusCfg[o.status].label}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <select
                        value={o.status}
                        onChange={e => handleStatus(o.id, e.target.value as Order['status'])}
                        className="appearance-none text-[10px] font-bold uppercase py-1.5 pl-3 pr-7 rounded-lg cursor-pointer outline-none transition-all"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      >
                        {STATUS.map(s => <option key={s} value={s} style={{ background: 'var(--card)' }}>{s}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Cards ─────────────────────────────────── */}
      <div className="cards-mobile space-y-3">
        {filtered.length === 0 ? (
          <div className="mobile-card text-center py-10 text-xs" style={{ color: 'var(--text-subtle)' }}>
            No orders found
          </div>
        ) : filtered.map(o => (
          <div
            key={o.id}
            className="mobile-card cursor-pointer"
            onClick={() => setSelected(o)}
          >
            {/* Top row: ID + status badge */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold font-mono-num" style={{ color: 'var(--brand)' }}>
                  #{o.id.slice(0, 12)}
                </p>
                {o.paymentMethod === 'cod' && (
                  <span className="text-[9px] font-semibold" style={{ color: 'var(--text-subtle)' }}>COD</span>
                )}
              </div>
              <span className={statusCfg[o.status].badge}>{statusCfg[o.status].label}</span>
            </div>

            {/* Customer */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                <UserIcon size={14} style={{ color: 'var(--text-subtle)' }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{o.customerName}</p>
                <p className="text-xs font-mono-num truncate" style={{ color: 'var(--text-subtle)' }}>{o.customerEmail}</p>
              </div>
            </div>

            {/* Items row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-1.5 flex-1">
                {o.items.slice(0, 5).map((item, i) => (
                  <div key={i} className="avatar w-8 h-8 !rounded-lg">
                    <img src={item.image} alt="" className="object-cover" />
                  </div>
                ))}
                {o.items.length > 5 && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ background: 'var(--hover)', color: 'var(--text-subtle)', border: '1px solid var(--border)' }}>
                    +{o.items.length - 5}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-subtle)' }}>
                {o.items.length} item{o.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Footer: total + date + status selector */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-base font-extrabold font-mono-num" style={{ color: 'var(--brand)' }}>
                  {formatPrice(o.total)}
                </p>
                <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                  <Clock size={10} />
                  {new Date(o.date).toLocaleDateString()}
                </p>
              </div>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <select
                  value={o.status}
                  onChange={e => handleStatus(o.id, e.target.value as Order['status'])}
                  className="appearance-none text-[10px] font-bold uppercase py-2 pl-3 pr-7 rounded-xl cursor-pointer outline-none"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  {STATUS.map(s => <option key={s} value={s} style={{ background: 'var(--card)' }}>{s}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Detail Modal ──────────────────────────────────── */}
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
                  <span className={statusCfg[activeOrder.status].badge}>{statusCfg[activeOrder.status].label}</span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-subtle)' }}>
                  {new Date(activeOrder.date).toLocaleString()}
                </p>
              </div>
              <button className="btn-icon shrink-0" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Items */}
                <div className="space-y-3">
                  <p className="section-title flex items-center gap-1.5"><Package size={11} />Items</p>
                  {activeOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                      <div className="avatar w-11 h-11 shrink-0"><img src={item.image} className="object-cover" alt="" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                        {item.selectedVariants && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {Object.entries(item.selectedVariants).map(([k, v]) => (
                              <span key={k} className="text-[8px] font-medium px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--input-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs font-mono-num mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                          Rs.{item.price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold font-mono-num shrink-0" style={{ color: 'var(--text)' }}>
                        Rs.{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Customer & Shipping */}
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
                    <p className="section-title flex items-center gap-1.5 mb-2"><MapPin size={11} />Shipping Address</p>
                    <div className="p-4 rounded-xl flex gap-2.5" style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                      <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{activeOrder.shippingAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                    <span className="section-title mb-0">Payment</span>
                    <span className="text-xs font-bold uppercase" style={{ color: 'var(--text)' }}>{activeOrder.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="section-title mb-0.5">Total Amount</p>
                <p className="text-2xl font-extrabold font-mono-num" style={{ color: 'var(--brand)' }}>
                  {formatPrice(activeOrder.total)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Update Status</label>
                <div className="relative">
                  <select
                    value={activeOrder.status}
                    onChange={e => handleStatus(activeOrder.id, e.target.value as Order['status'])}
                    className="appearance-none text-xs font-bold py-2.5 pl-4 pr-8 rounded-xl cursor-pointer outline-none"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    {STATUS.map(s => <option key={s} value={s} style={{ background: 'var(--card)' }}>{s}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
