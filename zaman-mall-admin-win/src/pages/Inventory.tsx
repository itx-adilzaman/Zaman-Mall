import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, Package, Search, Edit2, Check, X,
  TrendingDown, RefreshCw, Filter, ChevronDown,
  Archive, Loader2, BarChart2,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAlert } from '../context/AlertContext';
import { Product } from '../types';

type FilterType = 'all' | 'out' | 'critical' | 'low';
type SortType   = 'stock-asc' | 'stock-desc' | 'name' | 'category';

const FILTER_CFG: Record<FilterType, { label: string; color: string; desc: string }> = {
  all:      { label: 'All Alerts', color: 'var(--brand)',  desc: 'All low & out-of-stock' },
  out:      { label: 'Out of Stock', color: '#ef4444',     desc: 'Stock = 0' },
  critical: { label: 'Critical',  color: '#f97316',        desc: 'Stock 1–2' },
  low:      { label: 'Low Stock', color: '#fbbf24',        desc: 'Stock 3–10' },
};

// Inline editable stock cell
function StockEditor({
  product,
  onSave,
}: {
  product: Product;
  onSave: (id: string, newStock: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(String(product.stock));
  const [saving, setSaving]   = useState(false);

  const commit = async () => {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) { setVal(String(product.stock)); setEditing(false); return; }
    if (n === product.stock) { setEditing(false); return; }
    setSaving(true);
    await onSave(product.id, n);
    setSaving(false);
    setEditing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  commit();
    if (e.key === 'Escape') { setVal(String(product.stock)); setEditing(false); }
  };

  if (saving) return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
      style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--brand)' }}>
      <Loader2 size={11} className="animate-spin" /> Saving…
    </div>
  );

  if (editing) return (
    <div className="flex items-center gap-1.5">
      <input
        type="number" min="0"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={handleKey}
        autoFocus
        className="input-field font-mono-num text-sm py-1.5 w-20 text-center"
        style={{ padding: '4px 8px' }}
      />
      <button onClick={commit}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
        <Check size={12} />
      </button>
      <button onClick={() => { setVal(String(product.stock)); setEditing(false); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
        <X size={12} />
      </button>
    </div>
  );

  const stockColor = product.stock === 0 ? '#ef4444'
    : product.stock <= 2 ? '#f97316'
    : product.stock <= 10 ? '#fbbf24'
    : '#4ade80';

  return (
    <button
      onClick={() => { setVal(String(product.stock)); setEditing(true); }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 group/stock"
      style={{
        background: `${stockColor}15`,
        border: `1px solid ${stockColor}35`,
        color: stockColor,
      }}
      title="Click to edit stock"
    >
      <span className="font-bold font-mono-num text-sm">{product.stock}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">units</span>
      <Edit2 size={10} className="opacity-0 group-hover/stock:opacity-100 transition-opacity" />
    </button>
  );
}

export default function Inventory() {
  const { products, updateProduct, formatPrice } = useAdmin();
  const { showAlert } = useAlert();

  const [filter, setFilter]           = useState<FilterType>('all');
  const [sort, setSort]               = useState<SortType>('stock-asc');
  const [search, setSearch]           = useState('');
  const [country, setCountry]         = useState<'all' | 'pakistan' | 'china'>('all');
  const [bulkMode, setBulkMode]       = useState(false);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkValue, setBulkValue]     = useState('');
  const [bulkSaving, setBulkSaving]   = useState(false);
  const [showSortDrop, setShowSortDrop] = useState(false);

  // --- Stats ---
  const stats = useMemo(() => ({
    out:      products.filter(p => p.stock === 0).length,
    critical: products.filter(p => p.stock > 0 && p.stock <= 2).length,
    low:      products.filter(p => p.stock > 2 && p.stock <= 10).length,
    total:    products.filter(p => p.stock <= 10).length,
  }), [products]);

  // --- Filtered & sorted list ---
  const alertProducts = useMemo(() => {
    let list = products.filter(p => p.stock <= 10);

    // filter by type
    if (filter === 'out')      list = list.filter(p => p.stock === 0);
    if (filter === 'critical') list = list.filter(p => p.stock > 0 && p.stock <= 2);
    if (filter === 'low')      list = list.filter(p => p.stock > 2 && p.stock <= 10);

    // filter by country
    if (country === 'pakistan') list = list.filter(p => p.country !== 'china');
    if (country === 'china')    list = list.filter(p => p.country === 'china');

    // search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // sort
    if (sort === 'stock-asc')  list = [...list].sort((a, b) => a.stock - b.stock);
    if (sort === 'stock-desc') list = [...list].sort((a, b) => b.stock - a.stock);
    if (sort === 'name')       list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'category')   list = [...list].sort((a, b) => a.category.localeCompare(b.category));

    return list;
  }, [products, filter, country, search, sort]);

  // --- Single stock save ---
  const handleSave = async (id: string, newStock: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    try {
      await updateProduct({ ...product, stock: newStock });
      showAlert('success', 'Stock Updated', `${product.name} → ${newStock} units`);
    } catch {
      showAlert('error', 'Update Failed');
    }
  };

  // --- Bulk update ---
  const handleBulkSave = async () => {
    const n = parseInt(bulkValue);
    if (isNaN(n) || n < 0) { showAlert('warning', 'Invalid Value', 'Please enter a valid number'); return; }
    if (selected.size === 0) { showAlert('warning', 'Nothing Selected', 'Select at least one product'); return; }

    setBulkSaving(true);
    let success = 0;
    for (const id of selected) {
      const product = products.find(p => p.id === id);
      if (!product) continue;
      try {
        await updateProduct({ ...product, stock: n });
        success++;
      } catch { /* continue */ }
    }
    setBulkSaving(false);
    showAlert('success', 'Bulk Update Done', `${success} of ${selected.size} products updated to ${n} units`);
    setSelected(new Set());
    setBulkMode(false);
    setBulkValue('');
  };

  // --- Bulk add (add N to existing stock) ---
  const handleBulkAdd = async () => {
    const n = parseInt(bulkValue);
    if (isNaN(n) || n <= 0) { showAlert('warning', 'Invalid Value', 'Enter a positive number to add'); return; }
    if (selected.size === 0) { showAlert('warning', 'Nothing Selected'); return; }

    setBulkSaving(true);
    let success = 0;
    for (const id of selected) {
      const product = products.find(p => p.id === id);
      if (!product) continue;
      try {
        await updateProduct({ ...product, stock: product.stock + n });
        success++;
      } catch { /* continue */ }
    }
    setBulkSaving(false);
    showAlert('success', 'Stock Restocked', `+${n} units added to ${success} products`);
    setSelected(new Set());
    setBulkMode(false);
    setBulkValue('');
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === alertProducts.length) setSelected(new Set());
    else setSelected(new Set(alertProducts.map(p => p.id)));
  };

  const stockLabel = (s: number) =>
    s === 0 ? 'Out of Stock'
    : s <= 2 ? 'Critical'
    : 'Low Stock';

  const stockBadgeStyle = (s: number) =>
    s === 0
      ? { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }
      : s <= 2
      ? { background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }
      : { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Stat Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            key: 'out' as FilterType,
            icon: Archive,
            label: 'Out of Stock',
            val: stats.out,
            color: '#ef4444',
            bg: 'rgba(239,68,68,0.08)',
            border: 'rgba(239,68,68,0.2)',
          },
          {
            key: 'critical' as FilterType,
            icon: AlertTriangle,
            label: 'Critical (1–2)',
            val: stats.critical,
            color: '#f97316',
            bg: 'rgba(249,115,22,0.08)',
            border: 'rgba(249,115,22,0.2)',
          },
          {
            key: 'low' as FilterType,
            icon: TrendingDown,
            label: 'Low Stock (3–10)',
            val: stats.low,
            color: '#fbbf24',
            bg: 'rgba(251,191,36,0.08)',
            border: 'rgba(251,191,36,0.2)',
          },
          {
            key: 'all' as FilterType,
            icon: BarChart2,
            label: 'Total Alerts',
            val: stats.total,
            color: 'var(--brand)',
            bg: 'rgba(245,158,11,0.08)',
            border: 'rgba(245,158,11,0.2)',
          },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className="card text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              border: filter === s.key ? `1.5px solid ${s.color}` : `1px solid ${s.border}`,
              background: filter === s.key ? s.bg : undefined,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              {filter === s.key && (
                <span className="w-2 h-2 rounded-full animate-pulse mt-1" style={{ background: s.color }} />
              )}
            </div>
            <p className="text-2xl font-extrabold font-mono-num leading-none" style={{ color: s.color }}>
              {s.val}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-subtle)' }}>
              {s.label}
            </p>
          </button>
        ))}
      </div>

      {/* ── Controls bar ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search product name or category…"
            className="input-field pl-8 py-2.5 text-sm"
          />
        </div>

        {/* Country filter */}
        <div className="flex gap-1 p-1 rounded-xl shrink-0" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {(['all', 'pakistan', 'china'] as const).map(c => (
            <button key={c} onClick={() => setCountry(c)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
              style={{
                background: country === c ? 'rgba(245,158,11,0.12)' : 'transparent',
                color: country === c ? 'var(--brand)' : 'var(--text-subtle)',
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSortDrop(v => !v)}
            className="btn-secondary !py-2 flex items-center gap-2"
          >
            <Filter size={13} />
            <span className="text-[11px]">
              {sort === 'stock-asc'  ? 'Stock ↑'
               : sort === 'stock-desc' ? 'Stock ↓'
               : sort === 'name'       ? 'Name A–Z'
               : 'Category'}
            </span>
            <ChevronDown size={11} />
          </button>
          {showSortDrop && (
            <div
              className="absolute right-0 top-full mt-1.5 z-20 rounded-xl py-1 min-w-[150px]"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
            >
              {([
                ['stock-asc',  'Stock (Lowest first)'],
                ['stock-desc', 'Stock (Highest first)'],
                ['name',       'Name A–Z'],
                ['category',   'Category'],
              ] as [SortType, string][]).map(([val, label]) => (
                <button key={val}
                  onClick={() => { setSort(val); setShowSortDrop(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors"
                  style={{
                    color: sort === val ? 'var(--brand)' : 'var(--text-muted)',
                    background: sort === val ? 'rgba(245,158,11,0.08)' : 'transparent',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bulk mode toggle */}
        <button
          onClick={() => { setBulkMode(v => !v); setSelected(new Set()); }}
          className={bulkMode ? 'btn-primary !py-2' : 'btn-secondary !py-2'}
        >
          <RefreshCw size={13} />
          <span className="text-[11px]">{bulkMode ? 'Cancel Bulk' : 'Bulk Update'}</span>
        </button>
      </div>

      {/* ── Bulk action panel (visible when bulkMode) ── */}
      {bulkMode && (
        <div className="card animate-scale-in"
          style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.1)' }}>
                <Package size={14} style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  Bulk Stock Update
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                  {selected.size > 0
                    ? `${selected.size} product${selected.size > 1 ? 's' : ''} selected`
                    : 'Select products below (checkboxes)'}
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center gap-2 flex-wrap">
              {/* Stock value input */}
              <div className="relative">
                <input
                  type="number" min="0"
                  value={bulkValue}
                  onChange={e => setBulkValue(e.target.value)}
                  placeholder="New stock value"
                  className="input-field font-mono-num text-sm py-2 w-40"
                />
              </div>

              {/* Set exact */}
              <button
                onClick={handleBulkSave}
                disabled={bulkSaving || selected.size === 0 || !bulkValue}
                className="btn-primary !py-2 disabled:opacity-40"
              >
                {bulkSaving
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Check size={13} />}
                Set Exact
              </button>

              {/* Add to stock */}
              <button
                onClick={handleBulkAdd}
                disabled={bulkSaving || selected.size === 0 || !bulkValue}
                className="btn-secondary !py-2 disabled:opacity-40"
                style={{ color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }}
              >
                <Package size={13} />+ Add to Stock
              </button>

              {/* Select all */}
              <button
                onClick={toggleAll}
                className="btn-secondary !py-2 ml-auto"
              >
                {selected.size === alertProducts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────── */}
      {alertProducts.length === 0 ? (
        <div className="card py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <Package size={28} style={{ color: '#4ade80' }} />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {search ? 'No matching products found' : 'All products are well-stocked! 🎉'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
              {search
                ? 'Try a different search term'
                : 'No product has stock ≤ 10 right now'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Result count ── */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>
              Showing <span className="font-bold" style={{ color: 'var(--text)' }}>{alertProducts.length}</span> products
              {filter !== 'all' && (
                <span> · <span style={{ color: FILTER_CFG[filter].color }}>{FILTER_CFG[filter].label}</span></span>
              )}
            </p>
            {bulkMode && selected.size > 0 && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--brand)', border: '1px solid rgba(245,158,11,0.2)' }}>
                {selected.size} selected
              </span>
            )}
          </div>

          {/* ── Desktop Table ── */}
          <div className="table-desktop card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {bulkMode && (
                      <th style={{ width: '44px' }}>
                        <input type="checkbox"
                          checked={selected.size === alertProducts.length && alertProducts.length > 0}
                          onChange={toggleAll}
                          className="w-4 h-4 rounded accent-amber-400 cursor-pointer" />
                      </th>
                    )}
                    <th>Product</th>
                    <th>Category</th>
                    <th>Country</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {alertProducts.map(p => (
                    <tr key={p.id} className={bulkMode ? 'cursor-pointer' : ''}
                      onClick={bulkMode ? () => toggleSelect(p.id) : undefined}
                      style={selected.has(p.id) ? { background: 'rgba(245,158,11,0.06)' } : undefined}>
                      {bulkMode && (
                        <td onClick={e => { e.stopPropagation(); toggleSelect(p.id); }}>
                          <input type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="w-4 h-4 rounded accent-amber-400 cursor-pointer" />
                        </td>
                      )}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar w-11 h-11 shrink-0">
                            <img src={p.image} alt={p.name} className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate max-w-[200px]"
                              style={{ color: 'var(--text)' }}>{p.name}</p>
                            <p className="text-[10px] mt-0.5 font-mono-num"
                              style={{ color: 'var(--text-subtle)' }}>ID: {p.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.category}</span>
                      </td>
                      <td>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                          style={{
                            background: p.country === 'china' ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
                            color: p.country === 'china' ? '#f87171' : '#4ade80',
                            border: `1px solid ${p.country === 'china' ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`,
                          }}>
                          {p.country || 'pakistan'}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold font-mono-num text-sm" style={{ color: 'var(--brand)' }}>
                          {formatPrice(p.price)}
                        </span>
                      </td>
                      <td>
                        <span className="badge text-[10px]" style={stockBadgeStyle(p.stock)}>
                          {stockLabel(p.stock)}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        {bulkMode
                          ? <span className="font-bold font-mono-num text-sm"
                              style={{ color: selected.has(p.id) ? 'var(--brand)' : 'var(--text-muted)' }}>
                              {p.stock}
                            </span>
                          : <StockEditor product={p} onSave={handleSave} />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="cards-mobile space-y-3">
            {alertProducts.map(p => (
              <div key={p.id}
                className="mobile-card"
                onClick={bulkMode ? () => toggleSelect(p.id) : undefined}
                style={selected.has(p.id) ? { border: '1.5px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.04)' } : undefined}
              >
                {/* Top: checkbox (bulk) + image + name */}
                <div className="flex items-center gap-3 mb-3">
                  {bulkMode && (
                    <input type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      onClick={e => e.stopPropagation()}
                      className="w-5 h-5 rounded accent-amber-400 cursor-pointer shrink-0" />
                  )}
                  <div className="avatar w-12 h-12 shrink-0">
                    <img src={p.image} alt={p.name} className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>{p.category}</p>
                  </div>
                  <span className="badge shrink-0" style={stockBadgeStyle(p.stock)}>
                    {stockLabel(p.stock)}
                  </span>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0"
                    style={{
                      background: p.country === 'china' ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
                      color: p.country === 'china' ? '#f87171' : '#4ade80',
                    }}>
                    {p.country || 'pakistan'}
                  </span>
                  <span className="font-bold font-mono-num text-sm" style={{ color: 'var(--brand)' }}>
                    {formatPrice(p.price)}
                  </span>
                </div>

                {/* Stock editor */}
                <div className="pt-3 border-t flex items-center justify-between gap-3"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>
                    Current Stock
                  </p>
                  {bulkMode
                    ? <span className="font-bold font-mono-num text-base"
                        style={{ color: selected.has(p.id) ? 'var(--brand)' : 'var(--text)' }}>
                        {p.stock} units
                      </span>
                    : <StockEditor product={p} onSave={handleSave} />
                  }
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* click-away for sort dropdown */}
      {showSortDrop && (
        <div className="fixed inset-0 z-10" onClick={() => setShowSortDrop(false)} />
      )}
    </div>
  );
}
