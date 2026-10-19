import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Loader2, TrendingUp, ArrowRight, Search } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { getAdvancedSearchResults, AdvancedSearchResult } from '../services/gemini';

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */
export interface AISearchDropdownProps {
  query: string;
  onSubmit: (q: string) => void;
  onClose?: () => void;
  anchorRef?: React.RefObject<HTMLInputElement>;
  maxHeight?: number;
  onResultsFetched?: (rankedIds: string[]) => void;
}

/* ─── Debounce hook ─── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Relevance colour ─── */
function scoreColor(score: number): string {
  if (score >= 80) return '#4ade80';
  if (score >= 55) return '#38bdf8';
  return '#a78bfa';
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export const AISearchDropdown: React.FC<AISearchDropdownProps> = ({
  query,
  onSubmit,
  onClose,
  anchorRef,
  maxHeight = 400,
  onResultsFetched,
}) => {
  const { products = [], formatPrice } = useStore();
  const navigate = useNavigate();

  const [aiResults, setAiResults] = useState<AdvancedSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  /* ── Fixed position anchored to input ── */
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const updatePos = useCallback(() => {
    if (!anchorRef?.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(280, r.width),
    });
  }, [anchorRef]);

  useEffect(() => {
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [updatePos]);

  const debouncedQuery = useDebounce(query, 350);

  /* ── Fetch AI results ── */
  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setAiResults([]);
      setLastQuery('');
      onResultsFetched?.([]);
      return;
    }
    if (q === lastQuery) return;
    setIsLoading(true);
    try {
      const results = await getAdvancedSearchResults(q, products);
      setAiResults(results);
      setLastQuery(q);
      onResultsFetched?.(results.map(r => r.productId));
    } catch {
      setAiResults([]);
      onResultsFetched?.([]);
    } finally {
      setIsLoading(false);
    }
  }, [products, lastQuery, onResultsFetched]);

  useEffect(() => {
    fetchResults(debouncedQuery);
    setActiveIdx(-1);
  }, [debouncedQuery]);

  /* ── Resolve product objects ── */
  const resultProducts = aiResults
    .map(r => {
      const p = products.find(prod => prod.id === r.productId);
      if (!p) return null;
      return { product: p, score: r.relevanceScore, reason: r.matchReason };
    })
    .filter(Boolean) as { product: (typeof products)[0]; score: number; reason: string }[];

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!resultProducts.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, resultProducts.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, -1));
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault();
        navigate(`/product/${resultProducts[activeIdx].product.id}`);
        onClose?.();
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [resultProducts, activeIdx, navigate, onClose]);

  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (query.trim().length < 2 && !isLoading) return null;

  const showEmpty = query.trim().length >= 2 && !isLoading && resultProducts.length === 0;

  const bg     = 'rgba(8,12,24,0.98)';
  const border = 'rgba(255,255,255,0.09)';

  /* ── Dropdown position style ── */
  const dropStyle: React.CSSProperties = pos
    ? {
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
      }
    : {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        zIndex: 9999,
      };

  const panel = (
    <div
      style={{
        ...dropStyle,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow: 'hidden',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 14px 7px',
        borderBottom: `1px solid ${border}`,
        background: 'rgba(255,255,255,0.015)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLoading
            ? <Loader2 size={12} style={{ color: '#38bdf8', animation: 'zdrop-spin 1s linear infinite' }} />
            : <Sparkles size={12} style={{ color: '#818cf8' }} />
          }
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818cf8' }}>
            {isLoading ? 'AI Searching…' : `Zaman AI · ${resultProducts.length} result${resultProducts.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        {resultProducts.length > 0 && (
          <button
            onClick={() => { onSubmit(query); onClose?.(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#38bdf8', padding: 0 }}
          >
            View all <ArrowRight size={10} />
          </button>
        )}
      </div>

      {/* ── Loading shimmer ── */}
      {isLoading && (
        <div style={{ padding: '8px 12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0' }}>
              <div style={{ width: 42, height: 42, borderRadius: 9, background: 'rgba(255,255,255,0.06)', flexShrink: 0, animation: 'zdrop-pulse 1.4s ease-in-out infinite' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.07)', marginBottom: 6, width: `${50 + i * 14}%`, animation: 'zdrop-pulse 1.4s ease-in-out infinite' }} />
                <div style={{ height: 8, borderRadius: 5, background: 'rgba(255,255,255,0.05)', width: '35%', animation: 'zdrop-pulse 1.4s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Results list ── */}
      {!isLoading && resultProducts.length > 0 && (
        <div ref={listRef} style={{ maxHeight, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {resultProducts.map(({ product, score, reason }, idx) => {
            const isActive = idx === activeIdx;
            return (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                data-idx={idx}
                onClick={() => onClose?.()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '9px 14px',
                  background: isActive ? 'rgba(59,130,246,0.14)' : 'transparent',
                  textDecoration: 'none',
                  borderBottom: `1px solid rgba(255,255,255,0.04)`,
                  transition: 'background 0.1s',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(-1)}
                onTouchStart={() => setActiveIdx(idx)}
              >
                {/* Thumbnail */}
                <div style={{
                  position: 'relative', width: 46, height: 46, flexShrink: 0,
                  borderRadius: 9, overflow: 'hidden', background: '#0d1117',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div style={{
                    position: 'absolute', bottom: 2, right: 2,
                    background: 'rgba(0,0,0,0.82)', borderRadius: 4,
                    padding: '1px 4px', fontSize: 8, fontWeight: 900,
                    color: scoreColor(score), lineHeight: 1.6,
                  }}>
                    {score}%
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 700, color: '#f1f5f9',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    lineHeight: 1.3, marginBottom: 2,
                  }}>
                    {product.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                      {product.category}
                    </span>
                    {reason && (
                      <>
                        <span style={{ fontSize: 10, color: '#2d3748' }}>·</span>
                        <span style={{
                          fontSize: 10, color: '#818cf8', fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: 140,
                        }}>
                          {reason}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Price */}
                <span style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8', flexShrink: 0 }}>
                  {formatPrice(product.price)}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {showEmpty && (
        <div style={{ padding: '20px 14px', textAlign: 'center' }}>
          <Search size={24} style={{ color: '#334155', margin: '0 auto 8px', display: 'block' }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
            No results for "{query}"
          </p>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
            Try different words or an Urdu term
          </p>
          <button
            onClick={() => { navigate('/shop'); onClose?.(); }}
            style={{
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 700,
              color: '#60a5fa', cursor: 'pointer',
            }}
          >
            Browse all products
          </button>
        </div>
      )}

      {/* ── Footer hint (desktop only) ── */}
      {resultProducts.length > 0 && !isLoading && (
        <div style={{
          borderTop: `1px solid ${border}`,
          padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,255,255,0.01)',
        }}>
          <TrendingUp size={10} style={{ color: '#2d3748' }} />
          <span style={{ fontSize: 10, color: '#2d3748', fontWeight: 600 }}>
            ↑↓ navigate · Enter to open · Esc to close
          </span>
        </div>
      )}

      <style>{`
        @keyframes zdrop-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes zdrop-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(panel, document.body);
};

export type { AdvancedSearchResult };
export default AISearchDropdown;
