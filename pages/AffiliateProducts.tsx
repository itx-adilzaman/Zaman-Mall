import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, ShoppingBag, ExternalLink, Tag, X, Star,
  ChevronRight, Loader2, Package,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AffiliateBrand {
  id: string;
  name: string;
  logo_url: string;
}

interface AffiliateProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url: string;
  images: string[];
  affiliate_url: string;
  brand_id?: string | null;
  brand_name?: string | null;
  category: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const PAGE_SIZE = 12;

const fmtPrice = (price: number) =>
  price > 0 ? `Rs. ${price.toLocaleString()}` : null;

const openLink = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

// ── Category colours ──────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  Shopping: '#f59e0b', Electronics: '#3b82f6', Fashion: '#ec4899',
  Wholesale: '#8b5cf6', Groceries: '#10b981', Gadgets: '#06b6d4',
  Home: '#f97316', General: '#6b7280',
};
const catColor = (c: string) => CAT_COLORS[c] ?? '#6b7280';

// ── Desktop Product Card (original) ──────────────────────────────────────────
const ProductCardDesktop: React.FC<{
  product: AffiliateProduct;
  brandLogo?: string;
}> = ({ product, brandLogo }) => {
  const cc = catColor(product.category);
  return (
    <div className="group relative glass rounded-[3rem] border border-white/5 bg-white/[0.01] transition-all duration-500 hover:-translate-y-4 hover:border-indigo-500/20 shadow-xl overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-white/[0.01] to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      {/* Image */}
      <div className="relative m-4 rounded-[2.5rem] overflow-hidden aspect-[4/3] bg-black">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/1e293b/6366f1?text=Product'; }}
        />
        {product.is_featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/90 text-black text-[9px] font-black uppercase tracking-widest">
            <Star size={8} className="fill-current" /> Top Pick
          </div>
        )}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
          style={{ background: `${cc}CC`, color: '#fff' }}
        >
          {product.category}
        </div>
        {brandLogo && (
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-xl bg-white p-1 shadow-lg border border-black/10">
            <img src={brandLogo} alt="" className="w-full h-full object-contain" />
          </div>
        )}
        {!brandLogo && product.brand_name && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[9px] font-bold">
            {product.brand_name}
          </div>
        )}
      </div>
      {/* Content */}
      <div className="relative z-10 px-6 pb-6 pt-2 flex flex-col flex-grow">
        <h3 className="text-white font-black text-lg leading-tight tracking-tight mb-1 line-clamp-2 group-hover:text-indigo-300 transition-colors">
          {product.name}
        </h3>
        {fmtPrice(product.price) && (
          <p className="text-indigo-400 font-black text-xl mb-2 tracking-tight">{fmtPrice(product.price)}</p>
        )}
        {product.description && (
          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4">{product.description}</p>
        )}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/affiliate-product/${product.id}`}
            className="flex-1 py-3 rounded-2xl glass border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-indigo-500/10 transition-all"
          >
            Details <ChevronRight size={12} />
          </Link>
          <button
            onClick={() => openLink(product.affiliate_url)}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/25"
          >
            <ShoppingBag size={12} /> Order<ExternalLink size={9} className="opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Mobile Product Card (simple) ──────────────────────────────────────────────
const ProductCardMobile: React.FC<{
  product: AffiliateProduct;
  brandLogo?: string;
}> = ({ product, brandLogo }) => {
  const cc = catColor(product.category);
  return (
    <div className="flex gap-3 bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden">
      {/* Image */}
      <div className="relative w-24 flex-shrink-0">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          style={{ minHeight: '96px' }}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/96x96/1e293b/6366f1?text=P'; }}
        />
        {product.is_featured && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500 text-black text-[8px] font-black">
            <Star size={6} className="fill-current" /> Top
          </div>
        )}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col justify-between">
        <div>
          <p className="text-white font-bold text-sm leading-tight line-clamp-2">{product.name}</p>
          <div className="flex items-center gap-2 mt-1">
            {fmtPrice(product.price) && (
              <span className="text-indigo-400 font-black text-sm">{fmtPrice(product.price)}</span>
            )}
            <span
              className="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase"
              style={{ background: `${cc}22`, color: cc }}
            >
              {product.category}
            </span>
          </div>
          {product.brand_name && !brandLogo && (
            <p className="text-gray-500 text-xs mt-0.5">{product.brand_name}</p>
          )}
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 mt-2">
          <Link
            to={`/affiliate-product/${product.id}`}
            className="flex-1 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-400 text-[10px] font-bold text-center"
          >
            Details
          </Link>
          <button
            onClick={() => openLink(product.affiliate_url)}
            className="flex-1 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <ShoppingBag size={10} /> Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Skeletons ─────────────────────────────────────────────────────────────────
const ProductSkeletonDesktop = () => (
  <div className="glass rounded-[3rem] border border-white/5 overflow-hidden animate-pulse">
    <div className="m-4 rounded-[2.5rem] aspect-[4/3] bg-white/5" />
    <div className="px-6 pb-6 space-y-3">
      <div className="h-5 w-3/4 rounded-full bg-white/5" />
      <div className="h-4 w-1/3 rounded-full bg-white/5" />
      <div className="h-3 w-full rounded-full bg-white/5" />
      <div className="h-3 w-2/3 rounded-full bg-white/5" />
      <div className="flex gap-2 pt-2">
        <div className="flex-1 h-10 rounded-2xl bg-white/5" />
        <div className="flex-1 h-10 rounded-2xl bg-white/5" />
      </div>
    </div>
  </div>
);

const ProductSkeletonMobile = () => (
  <div className="flex gap-3 bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden animate-pulse">
    <div className="w-24 h-24 bg-white/10 flex-shrink-0" />
    <div className="flex-1 py-3 pr-3 space-y-2">
      <div className="h-4 w-3/4 rounded-full bg-white/10" />
      <div className="h-3 w-1/3 rounded-full bg-white/10" />
      <div className="flex gap-2 mt-3">
        <div className="flex-1 h-7 rounded-lg bg-white/10" />
        <div className="flex-1 h-7 rounded-lg bg-white/10" />
      </div>
    </div>
  </div>
);

// ── Loader / all-loaded ────────────────────────────────────────────────────────
const LoadMoreIndicator = () => (
  <div className="flex flex-col items-center gap-3 py-10">
    <Loader2 size={28} className="animate-spin text-indigo-500" />
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 animate-pulse">Loading more...</p>
  </div>
);

const AllLoadedBadge = ({ total }: { total: number }) => (
  <div className="flex justify-center py-10">
    <div className="flex items-center gap-2 px-6 py-3 glass border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">
      <Package size={14} /> All {total} products loaded
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export const AffiliateProducts: React.FC = () => {
  const [products, setProducts]       = useState<AffiliateProduct[]>([]);
  const [brands, setBrands]           = useState<AffiliateBrand[]>([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [page, setPage]               = useState(0);
  const [hasMore, setHasMore]         = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch]           = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [categories, setCategories]   = useState<string[]>(['All']);
  const isMobile                      = useIsMobile();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaderRef   = useRef<HTMLDivElement>(null);

  const brandLogoMap = useMemo(() =>
    Object.fromEntries(brands.map(b => [b.id, b.logo_url])), [brands]);

  // ── Fetch categories + brands once ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [{ data: catData }, { data: brandData }] = await Promise.all([
        supabase.from('affiliate_products').select('category').eq('is_active', true),
        supabase.from('affiliate_brands').select('id, name, logo_url').eq('is_active', true),
      ]);
      if (catData) {
        const cats = Array.from(new Set(catData.map((r: any) => r.category).filter(Boolean)));
        setCategories(['All', ...cats]);
      }
      setBrands(brandData || []);
    })();
  }, []);

  // ── Core fetch ────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (
    q: string, cat: string, pageNum: number, reset: boolean,
  ) => {
    if (reset) setInitialLoad(true);
    else setLoadingMore(true);
    try {
      const from = pageNum * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;
      let query = supabase
        .from('affiliate_products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .range(from, to);
      if (q.trim()) {
        query = query.or(
          `name.ilike.%${q}%,description.ilike.%${q}%,brand_name.ilike.%${q}%,category.ilike.%${q}%`
        );
      }
      if (cat !== 'All') query = query.eq('category', cat);
      const { data, count, error } = await query;
      if (error) throw error;
      const loaded = (data || []) as AffiliateProduct[];
      setTotalCount(count ?? 0);
      setProducts(prev => reset ? loaded : [...prev, ...loaded]);
      setPage(pageNum);
      setHasMore((from + loaded.length) < (count ?? 0));
    } catch (err) {
      console.error('[AffiliateProducts] fetch error:', err);
    } finally {
      setInitialLoad(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchProducts('', 'All', 0, true); }, [fetchProducts]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(search, selectedCat, 0, true);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, selectedCat, fetchProducts]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoad) {
          fetchProducts(search, selectedCat, page + 1, false);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, initialLoad, page, search, selectedCat, fetchProducts]);

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#020617] text-white pt-20 pb-24 px-4">

        {/* Header */}
        <div className="mb-5">
          <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">Top Picks</p>
          <h1 className="text-2xl font-black text-white tracking-tight">Affiliate Products</h1>
          <p className="text-gray-500 text-xs mt-1">
            {initialLoad ? 'Loading...' : `${totalCount} products`}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products, brands..."
            className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2.5 pl-9 pr-8 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/40"
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
            const cc = cat === 'All' ? '#6366f1' : catColor(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all"
                style={active
                  ? { background: `${cc}18`, color: cc, borderColor: `${cc}40` }
                  : { background: 'transparent', color: '#6b7280', borderColor: 'rgba(255,255,255,0.08)' }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {!initialLoad && (
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-3">
            {products.length}/{totalCount} loaded
          </p>
        )}

        {/* List */}
        {initialLoad ? (
          <div className="space-y-3">
            {[1,2,3,4,5,6].map(i => <ProductSkeletonMobile key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
            <Package size={36} className="mx-auto text-gray-700 mb-3" />
            <p className="text-white font-bold mb-1">No Products Found</p>
            <p className="text-gray-500 text-sm mb-4">
              {search ? `No match for "${search}"` : 'No products in this category'}
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCat('All'); }}
              className="px-5 py-2 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {products.map(product => (
                <ProductCardMobile
                  key={product.id}
                  product={product}
                  brandLogo={product.brand_id ? brandLogoMap[product.brand_id] : undefined}
                />
              ))}
            </div>
            <div ref={loaderRef}>
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <Loader2 size={22} className="animate-spin text-indigo-500" />
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <p className="text-center text-gray-600 text-xs py-6">
                  All {totalCount} products loaded
                </p>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── DESKTOP LAYOUT (original, unchanged) ───────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white pt-24 pb-32 relative overflow-hidden">
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-0 right-1/3 w-[50vw] h-[50vw] bg-indigo-500/5 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 left-0 w-[40vw] h-[40vw] bg-purple-500/5 blur-[160px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 glass border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">
              <ShoppingBag size={12} className="fill-indigo-400/30" /> Top Picks
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
              Affiliate Products
            </h1>
            <p className="text-gray-500 text-sm mt-3">
              {initialLoad ? 'Loading...' : `${totalCount} products — click Order to shop directly`}
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-full py-3.5 pl-12 pr-10 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-600"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Category pills ──────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map(cat => {
            const active = selectedCat === cat;
            const cc = cat === 'All' ? '#6366f1' : catColor(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 border"
                style={active
                  ? { background: `${cc}18`, color: cc, borderColor: `${cc}40` }
                  : { background: 'transparent', color: '#6b7280', borderColor: 'rgba(255,255,255,0.08)' }
                }
              >
                {cat !== 'All' && <Tag size={9} />}{cat}
              </button>
            );
          })}
        </div>

        {!initialLoad && (
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-8">
            {products.length}/{totalCount} loaded
          </p>
        )}

        {/* ── Grid ────────────────────────────────────────── */}
        {initialLoad ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1,2,3,4,5,6,7,8].map(i => <ProductSkeletonDesktop key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 glass rounded-[3rem] border-dashed border-white/10">
            <Package size={56} className="mx-auto text-gray-800 mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">No Products Found</h3>
            <p className="text-gray-600 mb-8">
              {search ? `No match for "${search}"` : 'No products in this category'}
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCat('All'); }}
              className="px-8 py-3 glass border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-500/10 transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map(product => (
                <ProductCardDesktop
                  key={product.id}
                  product={product}
                  brandLogo={product.brand_id ? brandLogoMap[product.brand_id] : undefined}
                />
              ))}
            </div>
            <div ref={loaderRef}>
              {loadingMore && <LoadMoreIndicator />}
              {!hasMore && products.length > 0 && <AllLoadedBadge total={totalCount} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
