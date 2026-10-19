/**
 * MobileShopView — dark minimal shop page for mobile.
 * All features: search, image search, category filter, country switcher, sort, pagination, favorites, add-to-cart.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, ShoppingCart, Heart, CheckCircle2, Filter, ChevronLeft, ChevronRight, SlidersHorizontal, Camera, Loader2, Package, Sparkles, Trophy } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useCountrySession } from '../contexts/CountrySessionContext';
import { ProductImageSlider } from './ProductImageSlider';
import { identifyImageProduct, getAdvancedSearchResults } from '../services/gemini';
import { Product } from '../types';
import { VisualSearchModal } from './VisualSearchModal';
import { AISearchDropdown } from './AISearchDropdown';

const bg      = '#0d0d0d';
const surface = '#1a1a1a';
const border  = '#2a2a2a';
const text    = '#f0f0f0';
const sub     = '#888';
const accent  = '#6366f1';

const BATCH = 20;

export const MobileShopView: React.FC = () => {
  const { products: all, addToCart, favorites, toggleFavorite, currentUser, formatPrice, isDbLoading } = useStore();
  const { currentSession, setSession } = useCountrySession();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const category = params.get('category') || 'All';
  const q        = params.get('q') || '';
  const sort     = (params.get('sort') || 'Best Sellers') as 'Best Sellers' | 'Price: Low to High' | 'Price: High to Low';

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen,   setSortOpen]   = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [batch, setBatch] = useState(0);
  const [switching, setSwitching] = useState(false);
  const [imgSearching, setImgSearching] = useState(false);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [aiRankedIds, setAiRankedIds] = useState<string[]>([]);
  const [aiTopPicks, setAiTopPicks] = useState<{ product: Product; score: number; reason: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  const products = useMemo(() => all.filter(p => (p.country || 'pakistan') === currentSession), [all, currentSession]);

  const [shuffled, setShuffled] = useState<Product[] | null>(null);
  useEffect(() => {
    if (!products.length) return;
    const a = [...products];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    setShuffled(a);
  }, [products.length, currentSession]);

  const categories = useMemo(() => { const s = new Set((products || []).map(p => p.category).filter(Boolean)); return ['All', ...Array.from(s).sort()]; }, [products]);

  const filtered = useMemo(() => {
    const base = shuffled || products;
    const qLower = q.toLowerCase().trim();

    if (!qLower) {
      return base.filter(p => {
        return category === 'All' || p.category?.trim().toLowerCase() === category.trim().toLowerCase();
      });
    }

    const words = qLower.split(/\s+/).filter(w => w.length > 1);
    return base
      .filter(p => category === 'All' || p.category?.trim().toLowerCase() === category.trim().toLowerCase())
      .map(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat  = (p.category  || '').toLowerCase();
        let score = 0;
        if (name === qLower)           score += 100;
        else if (name.startsWith(qLower)) score += 80;
        else if (name.includes(qLower))   score += 60;
        if (cat.includes(qLower))         score += 40;
        if (desc.includes(qLower))        score += 20;
        for (const w of words) {
          if (name.includes(w)) score += 15;
          if (cat.includes(w))  score += 10;
          if (desc.includes(w)) score += 5;
        }
        // AI boost
        const aiPos = aiRankedIds.indexOf(p.id);
        if (aiPos !== -1) score += Math.max(30, 80 - aiPos * 8);
        return { p, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ p }) => p);
  }, [shuffled, products, category, q, aiRankedIds]);

  // AI recommendations effect
  useEffect(() => {
    if (q.trim().length < 2) {
      setAiRankedIds([]);
      setAiTopPicks([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsAiLoading(true);
      try {
        const results = await getAdvancedSearchResults(q, products);
        setAiRankedIds(results.map(r => r.productId));
        const top = results.slice(0, 3).map(r => {
          const product = products.find(p => p.id === r.productId);
          return product ? { product, score: r.relevanceScore, reason: r.matchReason } : null;
        }).filter(Boolean) as { product: Product; score: number; reason: string }[];
        setAiTopPicks(top);
      } catch {
        setAiRankedIds([]);
        setAiTopPicks([]);
      } finally {
        setIsAiLoading(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [q, products]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sort === 'Price: Low to High') return (a.price||0) - (b.price||0);
    if (sort === 'Price: High to Low') return (b.price||0) - (a.price||0);
    const ra = a.ratings?.length ? a.ratings.reduce((s: number, r: number) => s + r, 0) / a.ratings.length : 0;
    const rb = b.ratings?.length ? b.ratings.reduce((s: number, r: number) => s + r, 0) / b.ratings.length : 0;
    return rb - ra;
  }), [filtered, sort]);

  const totalBatches = Math.max(1, Math.ceil(sorted.length / BATCH));
  const visible = useMemo(() => sorted.slice(batch * BATCH, (batch + 1) * BATCH), [sorted, batch]);
  useEffect(() => { setBatch(0); }, [category, q, sort]);

  const handleAdd = async (p: Product) => {
    if (!currentUser) { navigate('/login'); return; }
    if ((p.stock || 0) <= 0) return;
    await addToCart(p);
    setAdded(prev => ({ ...prev, [p.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [p.id]: false })), 2000);
  };

  const handleImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setImgPreview(dataUrl);
      setImgSearching(true);
      const query = await identifyImageProduct(dataUrl.split(',')[1], file.type);
      if (query) setParams(prev => { const n = new URLSearchParams(prev); n.set('q', query); return n; }, { replace: true });
      setImgSearching(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const next = () => {
    if (batch >= totalBatches - 1 || switching) return;
    setSwitching(true); setBatch(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSwitching(false), 300);
  };
  const prev = () => {
    if (batch === 0 || switching) return;
    setSwitching(true); setBatch(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSwitching(false), 300);
  };

  return (
    <>
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 80 }}>

      {/* Sticky toolbar */}
      <div style={{ position: 'sticky', top: 56, zIndex: 40, background: bg, borderBottom: `1px solid ${border}`, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {/* Search row */}
        <div style={{ display: 'flex', gap: 7 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: sub, zIndex: 1 }} />
            <input
              ref={mobileSearchRef}
              type="text" value={q}
              autoComplete="off"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 300)}
              onChange={e => { setImgPreview(null); setParams(prev => { const n = new URLSearchParams(prev); e.target.value ? n.set('q', e.target.value) : n.delete('q'); return n; }, { replace: true }); }}
              placeholder="Search with AI..."
              style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 9, paddingBottom: 9, background: surface, border: `1px solid ${border}`, borderRadius: 9, fontSize: 13, outline: 'none', color: text, boxSizing: 'border-box' }}
            />
            {q && <button onClick={() => setParams(prev => { prev.delete('q'); return prev; }, { replace: true })} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: sub, cursor: 'pointer', padding: 0 }}><X size={13} /></button>}
            {/* AI Dropdown — portal bottom-sheet on mobile, fixed on desktop */}
            {isSearchFocused && (
              <AISearchDropdown
                query={q}
                anchorRef={mobileSearchRef}
                onResultsFetched={(ids) => {
                  setAiRankedIds(ids);
                }}
                onSubmit={(val) => {
                  setImgPreview(null);
                  setParams(prev => { const n = new URLSearchParams(prev); val ? n.set('q', val) : n.delete('q'); return n; }, { replace: true });
                  setIsSearchFocused(false);
                }}
                onClose={() => setIsSearchFocused(false)}
                maxHeight={320}
              />
            )}
          </div>
          <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImg} />
          <button
            onClick={() => setIsVisualModalOpen(true)}
            title="Visual Search (AI Lens)"
            style={{ width: 36, height: 36, flexShrink: 0, background: `rgba(56,189,248,0.08)`, border: `1px solid rgba(56,189,248,0.4)`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
          >
            <Camera size={15} style={{ color: '#38bdf8' }} />
          </button>

          <button onClick={() => setFilterOpen(o => !o)} style={{ width: 36, height: 36, flexShrink: 0, background: filterOpen ? `${accent}22` : surface, border: `1px solid ${filterOpen ? accent : border}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Filter size={14} style={{ color: filterOpen ? accent : sub }} /></button>
          <button onClick={() => setSortOpen(o => !o)} style={{ width: 36, height: 36, flexShrink: 0, background: sortOpen ? `${accent}22` : surface, border: `1px solid ${sortOpen ? accent : border}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><SlidersHorizontal size={14} style={{ color: sortOpen ? accent : sub }} /></button>
        </div>

        {/* Country switcher */}
        <div style={{ display: 'flex', gap: 7 }}>
          {(['pakistan', 'china'] as const).map(c => {
            const act = currentSession === c;
            const col = c === 'pakistan' ? '#16a34a' : '#dc2626';
            return <button key={c} onClick={() => setSession(c)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', borderRadius: 8, border: act ? `2px solid ${col}` : `1px solid ${border}`, background: act ? `${col}14` : surface, fontWeight: 700, fontSize: 12, color: act ? col : sub, cursor: 'pointer' }}>
              <img src={c === 'pakistan' ? '/images/pakistan.png' : '/images/china.png'} alt={c} style={{ width: 18, height: 12, objectFit: 'contain' }} />
              {c === 'pakistan' ? 'Pakistan' : 'China'}
            </button>;
          })}
        </div>

        {/* Active filter chips */}
        {(category !== 'All' || q) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {category !== 'All' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${accent}15`, border: `1px solid ${accent}40`, borderRadius: 20, padding: '3px 10px', fontSize: 11, color: accent, fontWeight: 600 }}>
                {category}
                <button onClick={() => setParams(prev => { prev.delete('category'); return prev; }, { replace: true })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: accent, display: 'flex' }}><X size={11} /></button>
              </span>
            )}
            {q && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#8b5cf6', fontWeight: 600 }}>
                "{q}"
                <button onClick={() => { setImgPreview(null); setParams(prev => { prev.delete('q'); return prev; }, { replace: true }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8b5cf6', display: 'flex' }}><X size={11} /></button>
              </span>
            )}
            <button onClick={() => setParams({})} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear all</button>
          </div>
        )}
      </div>

      {/* Filter sheet */}
      {filterOpen && (
        <div style={{ padding: '11px 14px 14px', background: surface, borderBottom: `1px solid ${border}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 9px' }}>Category</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => { setParams(prev => { const n = new URLSearchParams(prev); cat === 'All' ? n.delete('category') : n.set('category', cat); return n; }, { replace: true }); setFilterOpen(false); }} style={{ padding: '6px 13px', borderRadius: 20, border: category === cat ? `2px solid ${accent}` : `1px solid ${border}`, background: category === cat ? `${accent}18` : bg, color: category === cat ? accent : text, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort sheet */}
      {sortOpen && (
        <div style={{ padding: '11px 14px 14px', background: surface, borderBottom: `1px solid ${border}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 9px' }}>Sort by</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(['Best Sellers', 'Price: Low to High', 'Price: High to Low'] as const).map(opt => (
              <button key={opt} onClick={() => { setParams(prev => { const n = new URLSearchParams(prev); n.set('sort', opt); return n; }, { replace: true }); setSortOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', borderRadius: 9, border: `1.5px solid ${sort === opt ? accent : border}`, background: sort === opt ? `${accent}18` : bg, color: sort === opt ? accent : text, fontWeight: sort === opt ? 700 : 500, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                {opt}
                {sort === opt && <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent }} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Count */}
      <div style={{ padding: '8px 14px 0' }}>
        <p style={{ fontSize: 12, color: sub, fontWeight: 600 }}>{sorted.length} product{sorted.length !== 1 ? 's' : ''}{category !== 'All' ? ` in ${category}` : ''}</p>
      </div>

      {/* AI Top Picks — shown when search query is active */}
      {q.trim().length > 1 && (
        <div style={{ padding: '10px 14px 0' }}>
          {isAiLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', marginBottom: 4 }}>
              <Loader2 size={14} style={{ color: '#818cf8', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Searching…</span>
            </div>
          )}
          {!isAiLoading && aiTopPicks.length > 0 && (
            <div style={{ marginBottom: 14, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Sparkles size={13} style={{ color: '#818cf8' }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#818cf8' }}>
                  AI Top Picks for "{q}"
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aiTopPicks.map(({ product: p, score, reason }) => (
                  <Link key={p.id} to={`/product/${p.id}`} style={{ display: 'flex', gap: 10, alignItems: 'center', textDecoration: 'none', padding: '8px', background: surface, borderRadius: 10, border: `1px solid ${border}` }}>
                    <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: '#111' }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: '1px 4px', fontSize: 8, fontWeight: 900, color: score >= 80 ? '#4ade80' : score >= 55 ? '#38bdf8' : '#a78bfa' }}>
                        {score}%
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      {reason && <p style={{ fontSize: 10, color: '#818cf8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reason}</p>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900, color: accent, flexShrink: 0 }}>{formatPrice(p.price)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div style={{ padding: '10px 14px 0' }}>
        {isDbLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} style={{ borderRadius: 12, background: surface, height: 270 }} />)}
          </div>
        ) : visible.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, opacity: switching ? 0.4 : 1, transition: 'opacity 0.2s' }}>
            {visible.map(p => {
              const isFav = favorites.includes(p.id);
              const isAdded = added[p.id];
              const oos = (p.stock || 0) <= 0;
              return (
                <div key={p.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: oos ? 0.72 : 1, boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                  <div style={{ position: 'relative', aspectRatio: '1/1' }}>
                    <Link to={`/product/${p.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                      <ProductImageSlider images={p.images?.length ? p.images : [p.image]} name={p.name} />
                    </Link>
                    <button onClick={() => toggleFavorite(p.id)} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: isFav ? 'rgba(236,72,153,0.9)' : 'rgba(0,0,0,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                      <Heart size={14} style={{ color: '#fff', fill: isFav ? '#fff' : 'none' }} />
                    </button>
                    {oos && <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>Out of Stock</div>}
                    {p.country && (
                      <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '3px 6px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
                        <img src={p.country === 'china' ? '/images/china.png' : '/images/pakistan.png'} alt="" style={{ width: 16, height: 11, objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '11px 12px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.category}</span>
                    <Link to={`/product/${p.id}`} style={{ textDecoration: 'none' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                    </Link>
                    <p style={{ fontSize: 16, fontWeight: 900, color: text, margin: '4px 0 8px', letterSpacing: '-0.01em' }}>{formatPrice(p.price)}</p>
                    <button onClick={() => handleAdd(p)} disabled={oos} style={{ background: isAdded ? '#16a34a' : oos ? '#2a2a2a' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: oos ? sub : '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 12, fontWeight: 700, cursor: oos ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: isAdded || oos ? 'none' : '0 3px 10px rgba(99,102,241,0.35)' }}>
                      {isAdded ? <><CheckCircle2 size={13} /> Added!</> : oos ? 'Out of Stock' : <><ShoppingCart size={13} /> Add to Cart</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '55px 20px', background: surface, borderRadius: 14, border: `1.5px dashed ${border}` }}>
            <Package size={44} style={{ color: '#444', margin: '0 auto 10px', display: 'block' }} />
            <p style={{ fontWeight: 700, color: text, marginBottom: 4 }}>No products found</p>
            <p style={{ fontSize: 13, color: sub, marginBottom: 14 }}>Try a different search or category</p>
            <button onClick={() => setParams({})} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear Filters</button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalBatches > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', marginTop: 10, background: surface, borderTop: `1px solid ${border}` }}>
          <button onClick={prev} disabled={batch === 0} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background: batch === 0 ? bg : surface, color: batch === 0 ? sub : text, fontWeight: 600, fontSize: 13, cursor: batch === 0 ? 'not-allowed' : 'pointer' }}>
            <ChevronLeft size={15} /> Prev
          </button>
          <span style={{ fontSize: 12, color: sub, fontWeight: 600 }}>{batch + 1} / {totalBatches}</span>
          <button onClick={next} disabled={batch >= totalBatches - 1} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: `1px solid ${batch >= totalBatches - 1 ? border : accent}`, background: batch >= totalBatches - 1 ? bg : accent, color: batch >= totalBatches - 1 ? sub : '#fff', fontWeight: 700, fontSize: 13, cursor: batch >= totalBatches - 1 ? 'not-allowed' : 'pointer' }}>
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>

    {/* Visual Search Modal */}
    <VisualSearchModal
      isOpen={isVisualModalOpen}
      onClose={() => setIsVisualModalOpen(false)}
    />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </>);
};
