import React, { useState, useMemo } from 'react';
import { Search, X, Shield, User as UserIcon, Mail, Phone, MapPin, Calendar, ShoppingCart } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { User } from '../types';

export default function Users() {
  const { users, orders } = useAdmin();
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<User | null>(null);

  const filtered = useMemo(() => users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const userOrders = useMemo(() => {
    if (!selected) return [];
    return orders.filter(o => o.userId === selected.id || o.customerEmail === selected.email);
  }, [selected, orders]);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users…" className="input-field pl-9 py-2.5 text-sm" />
        </div>
        <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-subtle)' }}>
          {filtered.length} users
        </span>
      </div>

      {/* ── Desktop Table ── */}
      <div className="table-desktop card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>{['User', 'Email', 'Role', 'Joined', 'Orders'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-xs" style={{ color: 'var(--text-subtle)' }}>
                    No users found
                  </td>
                </tr>
              ) : filtered.map(u => {
                const count = orders.filter(o => o.userId === u.id || o.customerEmail === u.email).length;
                return (
                  <tr key={u.id} onClick={() => setSelected(u)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar w-9 h-9">
                          {u.avatar
                            ? <img src={u.avatar} alt="" className="object-cover" />
                            : <UserIcon size={14} style={{ color: 'var(--text-subtle)' }} />}
                        </div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{u.name || 'Unknown'}</p>
                      </div>
                    </td>
                    <td><span className="text-xs font-mono-num" style={{ color: 'var(--text-muted)' }}>{u.email}</span></td>
                    <td>
                      <span className={u.role === 'admin' ? 'badge badge-admin' : 'badge badge-user'}>{u.role}</span>
                    </td>
                    <td>
                      <span className="text-xs font-mono-num" style={{ color: 'var(--text-subtle)' }}>
                        {u.joinedDate ? new Date(u.joinedDate).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-bold font-mono-num" style={{ color: 'var(--text)' }}>{count}</span>
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
        {filtered.length === 0 ? (
          <div className="mobile-card text-center py-10 text-xs" style={{ color: 'var(--text-subtle)' }}>
            No users found
          </div>
        ) : filtered.map(u => {
          const count = orders.filter(o => o.userId === u.id || o.customerEmail === u.email).length;
          return (
            <div key={u.id} className="mobile-card cursor-pointer" onClick={() => setSelected(u)}>
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="avatar w-12 h-12 shrink-0">
                  {u.avatar
                    ? <img src={u.avatar} alt="" className="object-cover" />
                    : <UserIcon size={16} style={{ color: 'var(--text-subtle)' }} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {u.name || 'Unknown'}
                    </p>
                    <span className={`shrink-0 ${u.role === 'admin' ? 'badge badge-admin' : 'badge badge-user'}`}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs font-mono-num truncate" style={{ color: 'var(--text-subtle)' }}>{u.email}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                      Joined {u.joinedDate ? new Date(u.joinedDate).toLocaleDateString() : '—'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                      <ShoppingCart size={10} />
                      {count} orders
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal max-w-lg w-full" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-4">
                <div className="avatar w-14 h-14 !rounded-2xl shrink-0">
                  {selected.avatar
                    ? <img src={selected.avatar} alt="" className="object-cover" />
                    : <Shield size={22} style={{ color: 'var(--brand)' }} />}
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: 'var(--text)' }}>{selected.name}</p>
                  <span className={selected.role === 'admin' ? 'badge badge-admin' : 'badge badge-user'}>
                    {selected.role}
                  </span>
                </div>
              </div>
              <button className="btn-icon shrink-0" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Info grid — 1 col on xs, 2 cols on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Mail,     label: 'Email',    value: selected.email },
                  { icon: Phone,    label: 'Phone',    value: selected.phone || '—' },
                  { icon: MapPin,   label: 'Location', value: selected.location || '—' },
                  { icon: Calendar, label: 'Joined',   value: selected.joinedDate ? new Date(selected.joinedDate).toLocaleDateString() : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-3.5 rounded-xl"
                    style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={11} style={{ color: 'var(--text-subtle)' }} />
                      <p className="section-title mb-0">{label}</p>
                    </div>
                    <p className="text-xs font-mono-num break-all" style={{ color: 'var(--text)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {selected.bio && (
                <div className="p-4 rounded-xl" style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                  <p className="section-title mb-1.5">Bio</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>"{selected.bio}"</p>
                </div>
              )}

              {/* Orders */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart size={12} style={{ color: 'var(--text-subtle)' }} />
                  <p className="section-title mb-0">Orders ({userOrders.length})</p>
                </div>
                {userOrders.length === 0 ? (
                  <p className="text-xs italic" style={{ color: 'var(--text-subtle)' }}>No orders yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userOrders.map(o => (
                      <div key={o.id} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                        <span className="text-xs font-bold font-mono-num" style={{ color: 'var(--brand)' }}>
                          #{o.id.slice(0, 10)}
                        </span>
                        <span className={`badge ${
                          o.status === 'delivered' ? 'badge-delivered'
                          : o.status === 'pending'  ? 'badge-pending'
                          : 'badge-cancelled'
                        }`}>{o.status}</span>
                        <span className="text-xs font-bold font-mono-num" style={{ color: 'var(--text)' }}>
                          Rs.{o.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
