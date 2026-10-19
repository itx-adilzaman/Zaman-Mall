import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import {
  DollarSign, ShoppingCart, Package, Users, TrendingUp,
  Activity, CheckCircle, RotateCcw, MessageSquare, ArrowUpRight,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useTheme } from '../context/ThemeContext';

const PIE_COLORS    = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f97316'];
const STATUS_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-4 py-3 !rounded-xl text-xs space-y-1 min-w-[140px]">
      <p className="section-title mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            <span className="text-muted capitalize">{p.dataKey}</span>
          </div>
          <span className="font-bold font-mono-num" style={{ color: 'var(--text)' }}>
            {p.dataKey === 'sales' ? `Rs.${Number(p.value).toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { orders, products, users, messages, formatPrice } = useAdmin();
  const { isDark } = useTheme();

  const s = useMemo(() => {
    const valid      = orders.filter(o => o?.status !== 'cancelled');
    const totalSales = valid.reduce((a, o) => a + (o?.total || 0), 0);
    const delivered  = orders.filter(o => o?.status === 'delivered').length;
    const returned   = orders.filter(o => o?.status === 'returned').length;
    const pending    = orders.filter(o => o?.status === 'pending').length;
    const pMsg       = messages.filter(m => !m.read).length;
    const pReturns   = orders.filter(o => o?.returnRequest?.status === 'pending').length;
    const total      = orders.length;
    const delivRate  = total > 0 ? (delivered / total) * 100 : 0;
    const retRate    = total > 0 ? (returned  / total) * 100 : 0;
    const avgOrder   = total > 0 ? totalSales / total : 0;
    const revPerUser = users.length > 0 ? totalSales / users.length : 0;
    return {
      totalSales, delivered, returned, pending, pMsg, pReturns,
      total, delivRate, retRate, avgOrder, revPerUser,
      userCount: users.length, productCount: products.length,
    };
  }, [orders, products, users, messages]);

  const catDist = useMemo(() => {
    const c: Record<string, number> = {};
    orders.filter(o => o.status !== 'cancelled').forEach(o =>
      o.items.forEach(i => { c[i.category] = (c[i.category] || 0) + i.price * i.quantity; })
    );
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const statusDist = useMemo(() => {
    const c: Record<string, number> = { pending: 0, shipped: 0, delivered: 0, cancelled: 0, returned: 0 };
    orders.forEach(o => { if (o?.status) c[o.status] = (c[o.status] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({
      name: name[0].toUpperCase() + name.slice(1), value,
    }));
  }, [orders]);

  const chartData = useMemo(() => {
    const d: Record<string, { sales: number; orders: number; returns: number }> = {};
    orders.forEach(o => {
      if (!o?.date) return;
      const dt = new Date(o.date);
      if (isNaN(dt.getTime())) return;
      const k = dt.toISOString().split('T')[0];
      if (!d[k]) d[k] = { sales: 0, orders: 0, returns: 0 };
      d[k].orders += 1;
      if (o.status !== 'cancelled') d[k].sales += o.total || 0;
      if (o.status === 'returned')  d[k].returns += 1;
    });
    return Object.entries(d)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-14)
      .map(([iso, v]) => ({
        name: new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short' }),
        ...v,
      }));
  }, [orders]);

  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const axisColor = isDark ? '#334155' : '#cbd5e1';

  const kpis = [
    {
      label: 'Total Revenue',    val: formatPrice(s.totalSales), icon: DollarSign,
      accent: 'metric-accent-amber',  sub: `${s.total} orders total`,
      iconBg: 'rgba(245,158,11,0.1)', iconColor: '#f59e0b', trend: '+12%',
    },
    {
      label: 'Pending Orders',   val: s.pending, icon: ShoppingCart,
      accent: 'metric-accent-blue',   sub: `${s.delivered} delivered`,
      iconBg: 'rgba(59,130,246,0.1)', iconColor: '#60a5fa', trend: '',
    },
    {
      label: 'Registered Users', val: s.userCount, icon: Users,
      accent: 'metric-accent-purple', sub: `Rs.${Math.round(s.revPerUser).toLocaleString()} avg spend`,
      iconBg: 'rgba(168,85,247,0.1)', iconColor: '#c084fc', trend: '+8%',
    },
    {
      label: 'Products',         val: s.productCount, icon: Package,
      accent: 'metric-accent-green',  sub: `${s.pMsg} unread messages`,
      iconBg: 'rgba(16,185,129,0.1)', iconColor: '#34d399', trend: '',
    },
  ];

  const metrics = [
    { label: 'Avg Order Value', val: formatPrice(Math.round(s.avgOrder)),        pct: Math.min(s.avgOrder   / 20000 * 100, 100), color: '#f59e0b' },
    { label: 'Delivery Rate',   val: `${s.delivRate.toFixed(1)}%`,               pct: s.delivRate,                               color: '#10b981' },
    { label: 'Return Rate',     val: `${s.retRate.toFixed(1)}%`,                 pct: s.retRate,                                 color: '#ef4444' },
    { label: 'Revenue / User',  val: formatPrice(Math.round(s.revPerUser)),      pct: Math.min(s.revPerUser / 20000 * 100, 100), color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k, i) => (
          <div key={i}
            className={`card card-hover relative pl-5 animate-slide-up ${k.accent}`}
            style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.iconBg }}>
                <k.icon size={17} style={{ color: k.iconColor }} />
              </div>
              {k.trend && (
                <div className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: '#4ade80' }}>
                  <ArrowUpRight size={11} />{k.trend}
                </div>
              )}
            </div>
            <p className="section-title mb-1">{k.label}</p>
            {/* Smaller font on xs so numbers don't overflow */}
            <p className="text-xl sm:text-2xl font-extrabold font-mono-num leading-none" style={{ color: 'var(--text)' }}>
              {k.val}
            </p>
            <p className="text-[10px] font-medium mt-1.5 hidden sm:block" style={{ color: 'var(--text-subtle)' }}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Quick metrics ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="card animate-slide-up" style={{ animationDelay: `${0.3 + i * 0.07}s` }}>
            <p className="section-title mb-1">{m.label}</p>
            <p className="text-lg sm:text-xl font-bold font-mono-num" style={{ color: 'var(--text)' }}>{m.val}</p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${m.pct}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue chart + Pie ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Area chart — full height on mobile with min-height */}
        <div className="xl:col-span-2 card" style={{ minHeight: '280px' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="section-title">Revenue Overview</p>
              <p className="text-lg font-extrabold font-mono-num" style={{ color: 'var(--text)' }}>
                {formatPrice(s.totalSales)}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold" style={{ color: 'var(--text-subtle)' }}>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-1 rounded bg-amber-400" />Sales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-1 rounded bg-blue-400" />Orders
              </span>
            </div>
          </div>
          {/* Responsive height: shorter on mobile */}
          <div className="h-44 sm:h-56 xl:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={9} axisLine={false} tickLine={false}
                  interval="preserveStartEnd" />
                <YAxis yAxisId="l" stroke={axisColor} fontSize={9} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={36} />
                <YAxis yAxisId="r" orientation="right" stroke={axisColor} fontSize={9} axisLine={false}
                  tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="l" type="monotone" dataKey="sales"  stroke="#f59e0b" strokeWidth={2.5}
                  fill="url(#gSales)"  dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
                <Area yAxisId="r" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#gOrders)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category pie */}
        <div className="card flex flex-col" style={{ minHeight: '280px' }}>
          <p className="section-title mb-3">Revenue by Category</p>
          {catDist.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>No data yet</p>
            </div>
          ) : (
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catDist} cx="50%" cy="44%" innerRadius={48} outerRadius={72}
                    paddingAngle={4} dataKey="value" stroke="none">
                    {catDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: '10px', fontSize: '11px', color: 'var(--text)',
                    }}
                  />
                  <Legend
                    formatter={v => (
                      <span style={{
                        fontSize: '9px', color: 'var(--text-subtle)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{v}</span>
                    )}
                    iconType="circle" iconSize={7}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Bar chart + Health ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 card" style={{ minHeight: '240px' }}>
          <p className="section-title mb-4">Order Status Distribution</p>
          <div className="h-40 sm:h-48 xl:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDist} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={9} axisLine={false} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={9} axisLine={false} tickLine={false}
                  allowDecimals={false} width={30} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: '10px', fontSize: '11px', color: 'var(--text)',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {statusDist.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health snapshot */}
        <div className="card flex flex-col justify-between" style={{ minHeight: '240px' }}>
          <div>
            <p className="section-title mb-4">Health Snapshot</p>
            <div className="space-y-3">
              {[
                { label: 'Delivered Orders', val: s.delivered, color: '#4ade80', icon: CheckCircle },
                { label: 'Returned Orders',  val: s.returned,  color: '#f87171', icon: RotateCcw },
                { label: 'Pending Messages', val: s.pMsg,      color: '#fbbf24', icon: MessageSquare },
                { label: 'Total Orders',     val: s.total,     color: '#60a5fa', icon: Activity },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon size={12} style={{ color: item.color }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  </div>
                  <span className="text-sm font-bold font-mono-num" style={{ color: item.color }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="section-title mb-0">System Efficiency</span>
              <span className="text-xs font-bold" style={{ color: '#4ade80' }}>
                {s.delivRate.toFixed(1)}%
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill"
                style={{
                  width: `${Math.min(s.delivRate, 100)}%`,
                  background: 'linear-gradient(90deg,#10b981,#3b82f6,#f59e0b)',
                }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
