import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ShoppingBag, ExternalLink, Tag, X, ArrowRight, Filter,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AffiliateBrand {
  id: string;
  name: string;
  name_urdu?: string | null;
  logo_url: string;
  affiliate_url: string;
  description?: string | null;
  category: string;
  is_active: boolean;
  sort_order: number;
}

// ── Category colour map ───────────────────────────────────────────────────────
const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Shopping:    { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b', border: 'rgba(245,158,11,0.25)'  },
  Electronics: { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6', border: 'rgba(59,130,246,0.25)'  },
  Fashion:     { bg: 'rgba(236,72,153,0.1)',  text: '#ec4899', border: 'rgba(236,72,153,0.25)'  },
  Wholesale:   { bg: 'rgba(139,92,246,0.1)',  text: '#8b5cf6', border: 'rgba(139,92,246,0.25)'  },
  Groceries:   { bg: 'rgba(16,185,129,0.1)',  text: '#10b981', border: 'rgba(16,185,129,0.25)'  },
  Gadgets:     { bg: 'rgba(6,182,212,0.1)',   text: '#06b6d4', border: 'rgba(6,182,212,0.25)'   },
  Home:        { bg: 'rgba(249,115,22,0.1)',  text: '#f97316', border: 'rgba(249,115,22,0.25)'  },
  General:     { bg: 'rgba(107,114,128,0.1)', text: '#6b7280', border: 'rgba(107,114,128,0.25)' },
};
const catStyle = (cat: string) => CAT_COLORS[cat] ?? CAT_COLORS['General'];

const openLink = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

// ── Desktop Brand Card (original) ────────────────────────────────────────────
const BrandCardDesktop: React.FC<{ brand: AffiliateBrand }> = ({ brand }) => {
  const cs = catStyle(brand.category);
  return (
    <div className="group relative glass rounded-[2.5rem] border border-white/5 bg-white/[0.01] transition-all duration-500 hover:-translate-y-3 hover:border-yellow-500/20 shadow-xl overflow-hidden flex flex-col items-center p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 via-white/[0.01] to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative z-10 w-36 h-36 mb-5 flex items-center justify-center">
        <img
          src={brand.logo_url}
          alt={brand.name}
          className="w-full h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/144x144/f59e0b/fff?text=${brand.name[0]}`; }}
        />
      </div>
      <h3 className="relative z-10 text-white font-black text-lg text-center leading-tight tracking-tight mb-1">{brand.name}</h3>
      {brand.name_urdu && (
        <p className="relative z-10 text-gray-500 text-sm text-center mb-2">{brand.name_urdu}</p>
      )}
      <span
        className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3"
        style={{ background: cs.bg, color: cs.text, border: `1px solid ${cs.border}` }}
      >
        <Tag size={9} />{brand.category}
      </span>
      {brand.description && (
        <p className="relative z-10 text-gray-500 text-xs text-center leading-relaxed mb-4 line-clamp-2 px-2">{brand.description}</p>
      )}
      <button
        onClick={() => openLink(brand.affiliate_url)}
        className="relative z-10 mt-auto w-full py-3 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg shadow-yellow-500/25"
      >
        <ShoppingBag size={14} />Order Now<ExternalLink size={11} className="opacity-70" />
      </button>
    </div>
  );
};

// ── Mobile Brand Card (simple) ────────────────────────────────────────────────
const BrandCardMobile: React.FC<{ brand: AffiliateBrand }> = ({ brand }) => {
  const cs = catStyle(brand.category);
  return (
    <div className="flex items-center gap-3 bg-[#0f172a] border border-white/10 rounded-xl px-3 py-3">
      {/* Logo */}
      <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
        <img
          src={brand.logo_url}
          alt={brand.name}
          className="w-full h-full object-contain p-1"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/56x56/f59e0b/fff?text=${brand.name[0]}`; }}
        />
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight truncate">{brand.name}</p>
        {brand.name_urdu && (
          <p className="text-gray-500 text-xs truncate">{brand.name_urdu}</p>
        )}
        <span
          className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
          style={{ background: cs.bg, color: cs.text, border: `1px solid ${cs.border}` }}
        >
          <Tag size={7} />{brand.category}
        </span>
      </div>
      {/* Button */}
      <button
        onClick={() => openLink(brand.affiliate_url)}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-yellow-500 text-black text-[10px] font-black uppercase tracking-wider"
      >
        <ShoppingBag size={11} />Order
      </button>
    </div>
  );
};

// ── Skeletons ─────────────────────────────────────────────────────────────────
const BrandSkeletonDesktop = () => (
  <div className="glass rounded-[2.5rem] border border-white/5 p-8 flex flex-col items-center animate-pulse">
    <div className="w-36 h-36 rounded-2xl bg-white/5 mb-5" />
    <div className="h-5 w-28 rounded-full bg-white/5 mb-2" />
    <div className="h-3 w-20 rounded-full bg-white/5 mb-4" />
    <div className="h-10 w-full rounded-2xl bg-white/5 mt-auto" />
  </div>
);

const BrandSkeletonMobile = () => (
  <div className="flex items-center gap-3 bg-[#0f172a] border border-white/10 rounded-xl px-3 py-3 animate-pulse">
    <div className="w-14 h-14 rounded-lg bg-white/10 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-3/4 rounded-full bg-white/10" />
      <div className="h-3 w-1/2 rounded-full bg-white/10" />
    </div>
    <div className="w-16 h-8 rounded-lg bg-white/10 flex-shrink-0" />
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export const AffiliateBrands: React.FC = () => {
  const [brands, setBrands]           = useState<AffiliateBrand[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const isMobile                      = useIsMobile();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('affiliate_brands')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setBrands(data || []);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(brands.map(b => b.category)));
    return ['All', ...cats];
  }, [brands]);

  const filtered = useMemo(() => {
    return brands.filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        b.name.toLowerCase().includes(q) ||
        (b.name_urdu ?? '').toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);
      const matchCat = selectedCat === 'All' || b.category === selectedCat;
      return matchSearch && matchCat;
    });
  }, [brands, search, selectedCat]);

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#020617] text-white pt-20 pb-24 px-4">

        {/* Header */}
        <div className="mb-5">
          <p className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest mb-1">Affiliate Partners</p>
          <h1 className="text-2xl font-black text-white tracking-tight">Top Brands</h1>
          <p className="text-gray-500 text-xs mt-1">
            {loading ? '...' : `${brands.length} brands`}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search brands..."
            className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2.5 pl-9 pr-8 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {categories.map(cat => {
            const active = selectedCat === cat;
            const cs = cat === 'All' ? null : catStyle(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all"
                style={active
                  ? cs
                    ? { background: cs.bg, color: cs.text, borderColor: cs.border }
                    : { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }
                  : { background: 'transparent', color: '#6b7280', borderColor: 'rgba(255,255,255,0.08)' }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-3">
            {filtered.length} {filtered.length === 1 ? 'brand' : 'brands'} found
          </p>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5,6].map(i => <BrandSkeletonMobile key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
            <ShoppingBag size={36} className="mx-auto text-gray-700 mb-3" />
            <p className="text-white font-bold mb-1">No Brands Found</p>
            <p className="text-gray-500 text-sm mb-4">
              {search ? `No match for "${search}"` : 'No brands in this category'}
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCat('All'); }}
              className="px-5 py-2 border border-yellow-500/30 text-yellow-500 text-xs font-bold rounded-full"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(brand => <BrandCardMobile key={brand.id} brand={brand} />)}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-center text-gray-700 text-xs mt-8">
            Clicking "Order" will take you to the brand's website.
          </p>
        )}
      </div>
    );
  }

  // ── DESKTOP LAYOUT (original, unchanged) ───────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white pt-24 pb-32 relative overflow-hidden">
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-0 right-1/4 w-[50vw] h-[50vw] bg-yellow-500/5 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[40vw] h-[40vw] bg-amber-500/5 blur-[160px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 glass border border-yellow-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500 mb-4">
              <ShoppingBag size={12} className="fill-yellow-500/30" /> Affiliate Partners
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
              Top Brands
            </h1>
            <p className="text-gray-500 text-sm mt-3">
              {loading ? '...' : `${brands.length} brands — click Order to shop directly`}
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search brands..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-full py-3.5 pl-12 pr-10 text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all placeholder:text-gray-600"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Category filter ───────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map(cat => {
            const active = selectedCat === cat;
            const cs = cat === 'All' ? null : catStyle(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 border"
                style={active
                  ? cs
                    ? { background: cs.bg, color: cs.text, borderColor: cs.border }
                    : { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.25)' }
                  : { background: 'transparent', color: '#6b7280', borderColor: 'rgba(255,255,255,0.08)' }
                }
              >
                {cat !== 'All' && <Tag size={9} />}{cat}
              </button>
            );
          })}
        </div>

        {!loading && (
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-8">
            {filtered.length} {filtered.length === 1 ? 'brand' : 'brands'} found
          </p>
        )}

        {/* ── Grid ─────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1,2,3,4,5,6,7,8,9,10].map(i => <BrandSkeletonDesktop key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 glass rounded-[3rem] border-dashed border-white/10">
            <ShoppingBag size={56} className="mx-auto text-gray-800 mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">No Brands Found</h3>
            <p className="text-gray-600 mb-8">
              {search ? `No match for "${search}"` : 'No brands in this category'}
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCat('All'); }}
              className="px-8 py-3 glass border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-yellow-500/10 transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filtered.map(brand => <BrandCardDesktop key={brand.id} brand={brand} />)}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-center text-gray-700 text-xs mt-14">
            Clicking "Order Now" will take you directly to the brand's website.
          </p>
        )}
      </div>
    </div>
  );
};
