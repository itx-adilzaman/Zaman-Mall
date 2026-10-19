
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Heart, Zap, Crown, Diamond, ShoppingCart, ShieldCheck, Box, Globe, Award, ChevronLeft, ChevronRight, Sparkles, Bot, ShieldAlert, Cpu, Truck, Play, Shuffle, ShoppingBag, ExternalLink, Tag, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { ProductSkeleton, AdSkeleton } from '../components/Skeleton';
import { ProductImageSlider } from '../components/ProductImageSlider';
import { useCountrySession } from '../contexts/CountrySessionContext';
import { supabase } from '../services/supabase';
import { useIsMobile } from '../hooks/useIsMobile';
import { MobileHomeView } from '../components/MobileHomeView';

// ── Zeels Preview Section ──────────────────────────────────────────────────────
interface ZeelPreview {
  id: string; title: string; thumbnail_url?: string;
  video_url: string; likes_count: number; views_count: number;
  product?: { name: string; price: number; image: string; country?: string } | null;
}

const ZeelsPreviewSection: React.FC = () => {
  const [zeels, setZeels] = useState<ZeelPreview[]>([]);
  const [displayZeels, setDisplayZeels] = useState<ZeelPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setDisplayZeels(shuffleArray(zeels));
      setIsShuffling(false);
    }, 300);
  };

  useEffect(() => {
    const load = async () => {
      const { data: zeelData } = await supabase
        .from('zeels').select('id, title, thumbnail_url, video_url, likes_count, views_count, product_id')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(6);

      if (!zeelData?.length) { setLoading(false); return; }

      const productIds = zeelData.filter(z => z.product_id).map(z => z.product_id as string);
      let productsMap: Record<string, any> = {};
      if (productIds.length > 0) {
        const { data: prodData } = await supabase
          .from('products').select('id, name, price, image, country').in('id', productIds);
        if (prodData) productsMap = Object.fromEntries(prodData.map((p: any) => [p.id, p]));
      }

      const mapped = zeelData.map((z: any) => ({
        ...z,
        product: z.product_id ? (productsMap[z.product_id] ?? null) : null,
      }));
      // Auto-shuffle on load
      const shuffled = shuffleArray(mapped);
      setZeels(mapped);
      setDisplayZeels(shuffled);
      setLoading(false);
    };
    load();
  }, []);

  const handleMouseEnter = (id: string) => {
    setHoveredId(id);
    const vid = videoRefs.current[id];
    if (vid) { vid.play().catch(() => {}); }
  };

  const handleMouseLeave = (id: string) => {
    setHoveredId(null);
    const vid = videoRefs.current[id];
    if (vid) { vid.pause(); vid.currentTime = 0; }
  };

  if (!loading && zeels.length === 0) return null;

  return (
    <section className="px-4 md:px-12 reveal">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Play size={16} className="text-purple-400 ml-0.5" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
              Zeels
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
              New
            </span>
          </div>
          <p className="text-gray-500 text-sm">Short product reels — watch, like &amp; shop</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Shuffle Button */}
          {!loading && zeels.length > 0 && (
            <button
              onClick={handleShuffle}
              disabled={isShuffling}
              className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/20 text-purple-400 text-[11px] font-black uppercase tracking-widest hover:bg-purple-500/10 hover:border-purple-400/40 transition-all duration-200 disabled:opacity-50 group"
              title="Shuffle Zeels"
            >
              <Shuffle size={13} className={`transition-transform duration-500 ${isShuffling ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span className="hidden sm:inline">Shuffle</span>
            </button>
          )}
          <Link
            to="/zeels"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-purple-500/25 text-purple-400 text-[11px] font-black uppercase tracking-widest hover:bg-purple-500/10 hover:border-purple-400/50 transition-all"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-3xl bg-white/5 animate-pulse" style={{ aspectRatio: '9/16' }} />
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 transition-opacity duration-300 ${isShuffling ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
          {displayZeels.map(zeel => (
            <Link
              key={zeel.id}
              to="/zeels"
              className="relative rounded-3xl overflow-hidden bg-black border border-white/5 hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 group"
              style={{ aspectRatio: '9/16' }}
              onMouseEnter={() => handleMouseEnter(zeel.id)}
              onMouseLeave={() => handleMouseLeave(zeel.id)}
            >
              {/* Thumbnail */}
              {zeel.thumbnail_url && (
                <img
                  src={zeel.thumbnail_url}
                  alt={zeel.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hoveredId === zeel.id ? 'opacity-0' : 'opacity-100'}`}
                />
              )}

              {/* Video (plays on hover) */}
              <video
                ref={el => { videoRefs.current[zeel.id] = el; }}
                src={zeel.video_url}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hoveredId === zeel.id ? 'opacity-100' : 'opacity-0'}`}
                loop muted playsInline preload="none"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Play icon center */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${hoveredId === zeel.id ? 'opacity-0' : 'opacity-100'}`}>
                <div className="w-10 h-10 rounded-full bg-black/50 border border-white/25 flex items-center justify-center backdrop-blur-sm">
                  <Play size={16} className="text-white ml-0.5" />
                </div>
              </div>

              {/* Likes badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                <Heart size={9} className="text-red-400 fill-red-400" />
                <span className="text-white text-[10px] font-bold">
                  {zeel.likes_count >= 1000 ? `${(zeel.likes_count/1000).toFixed(1)}k` : zeel.likes_count}
                </span>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-white text-[11px] font-bold leading-tight mb-1.5 line-clamp-2">{zeel.title}</p>
                {zeel.product && (
                  <div className="flex items-center gap-1.5">
                    <img src={zeel.product.image} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                    <p className="text-purple-300 text-[10px] font-black truncate">
                      Rs. {zeel.product.price.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

// ── Affiliate Brands Preview Section ──────────────────────────────────────────
interface HomeBrand {
  id: string;
  name: string;
  logo_url: string;
  affiliate_url: string;
  category: string;
}

const AffiliateBrandsSection: React.FC = () => {
  const [brands, setBrands] = useState<HomeBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('affiliate_brands')
        .select('id, name, logo_url, affiliate_url, category')
        .eq('is_active', true)
        .order('sort_order')
        .limit(20);
      setBrands(data || []);
      setLoading(false);
    })();
  }, []);

  if (!loading && brands.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' });
  };

  return (
    <section className="px-4 md:px-12 reveal">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
              <ShoppingBag size={16} className="text-yellow-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
              Affiliate Brands
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest">
              Partners
            </span>
          </div>
          <p className="text-gray-500 text-sm">Top partner brands — click to shop directly</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight size={16} />
          </button>
          <Link
            to="/affiliate-brands"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-yellow-500/25 text-yellow-400 text-[11px] font-black uppercase tracking-widest hover:bg-yellow-500/10 hover:border-yellow-400/50 transition-all"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-5 overflow-x-hidden">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="flex-shrink-0 w-36 h-36 rounded-[2rem] bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {brands.map(brand => (
            <button
              key={brand.id}
              onClick={() => window.open(brand.affiliate_url, '_blank', 'noopener,noreferrer')}
              className="group flex-shrink-0 w-36 flex flex-col items-center gap-3 p-4 glass rounded-[2rem] border border-white/5 hover:border-yellow-500/40 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden">
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-full h-full object-contain transition-transform duration-300"
                  onError={e => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/64x64/f59e0b/fff?text=${brand.name[0]}`;
                  }}
                />
              </div>
              <p className="text-white text-xs font-black text-center leading-tight line-clamp-2 tracking-tight">
                {brand.name}
              </p>
              <div className="flex items-center gap-1 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={10} />
                <span className="text-[9px] font-black uppercase tracking-widest">Visit</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

// ── Affiliate Products Preview Section ────────────────────────────────────────
interface HomeAffiliateProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  affiliate_url: string;
  category: string;
  is_featured: boolean;
  brand_name?: string | null;
}

const AffiliateProductsSection: React.FC = () => {
  const [products, setProducts] = useState<HomeAffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('affiliate_products')
        .select('id, name, price, image_url, affiliate_url, category, is_featured, brand_name')
        .eq('is_active', true)
        .order('sort_order')
        .limit(20);
      setProducts(data || []);
      setLoading(false);
    })();
  }, []);

  if (!loading && products.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <section className="px-4 md:px-12 reveal">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Tag size={16} className="text-indigo-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
              Top Picks
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              Affiliate
            </span>
          </div>
          <p className="text-gray-500 text-sm">Handpicked affiliate products — order directly</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight size={16} />
          </button>
          <Link
            to="/affiliate-products"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-indigo-500/25 text-indigo-400 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500/10 hover:border-indigo-400/50 transition-all"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-5 overflow-x-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex-shrink-0 w-56 rounded-[2rem] bg-white/5 animate-pulse" style={{ height: 320 }} />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, idx) => (
            <div
              key={product.id}
              className="group flex-shrink-0 w-56 relative flex flex-col overflow-hidden transition-all duration-500"
              style={{
                borderRadius: '1.75rem',
                background: 'linear-gradient(145deg, rgba(15,15,30,0.95) 0%, rgba(10,10,20,0.98) 100%)',
                border: '1px solid rgba(99,102,241,0.12)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.border = '1px solid rgba(99,102,241,0.45)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.border = '1px solid rgba(99,102,241,0.12)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
              }}
            >
              {/* Image area */}
              <div className="relative w-full overflow-hidden" style={{ height: '172px', borderRadius: '1.75rem 1.75rem 0 0' }}>
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={e => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/224x172/0f0f1a/6366f1?text=P`;
                  }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent opacity-80" />

                {/* Top badges row */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                  {product.is_featured ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                      style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#000', boxShadow: '0 2px 12px rgba(245,158,11,0.5)' }}>
                      <Star size={8} className="fill-current" /> Top Pick
                    </div>
                  ) : (
                    <div />
                  )}
                  <div className="px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider backdrop-blur-md"
                    style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }}>
                    {product.category}
                  </div>
                </div>

                {/* Brand name chip - bottom of image */}
                {product.brand_name && (
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md"
                    style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{product.brand_name}</span>
                  </div>
                )}
              </div>

              {/* Shimmer line */}
              <div className="h-px w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)' }} />

              {/* Content */}
              <div className="flex flex-col flex-grow p-4 gap-3">
                {/* Name */}
                <p className="text-white font-black text-sm leading-snug line-clamp-2 tracking-tight group-hover:text-indigo-100 transition-colors duration-300">
                  {product.name}
                </p>

                {/* Price row */}
                {product.price > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black tracking-tight"
                      style={{ background: 'linear-gradient(135deg,#818cf8,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Rs. {product.price.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px w-full" style={{ background: 'rgba(99,102,241,0.1)' }} />

                {/* Action buttons */}
                <div className="flex gap-2 mt-auto">
                  <Link
                    to={`/affiliate-product/${product.id}`}
                    className="flex-1 py-2.5 flex items-center justify-center text-[9px] font-black uppercase tracking-widest transition-all duration-200 rounded-xl"
                    style={{
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      color: '#818cf8',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.18)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.45)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)';
                    }}
                  >
                    Details
                  </Link>
                  <button
                    onClick={() => window.open(product.affiliate_url, '_blank', 'noopener,noreferrer')}
                    className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#fff',
                      boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,#818cf8,#6366f1)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(99,102,241,0.55)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,#6366f1,#4f46e5)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)';
                    }}
                  >
                    Order <ExternalLink size={9} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export const Home: React.FC = () => {
  const { products: allProducts, favorites, toggleFavorite, addToCart, ads, setIsAiOpen, currentUser, formatPrice, isDbLoading, orders } = useStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // On mobile, use the clean minimal mobile view
  if (isMobile) return <MobileHomeView />;
  
  // Local filtering for Home page based on country session
  const { currentSession } = useCountrySession();
  const products = useMemo(() => {
    return allProducts.filter(p => (p.country || 'pakistan') === currentSession);
  }, [allProducts, currentSession]);

  const featured = products.filter(p => p.featured).slice(0, 3);

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const allFeatured = products.filter(p => p.featured);
  const [displayFeatured, setDisplayFeatured] = useState(() => shuffleArray(allFeatured).slice(0, 3));
  const [isShufflingProducts, setIsShufflingProducts] = useState(false);

  useEffect(() => {
    setDisplayFeatured(shuffleArray(allFeatured).slice(0, 3));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, currentSession]);

  const handleProductShuffle = () => {
    setIsShufflingProducts(true);
    setTimeout(() => {
      setDisplayFeatured(shuffleArray(allFeatured).slice(0, 3));
      setIsShufflingProducts(false);
    }, 300);
  };

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [smoothMousePos, setSmoothMousePos] = useState({ x: 0, y: 0 });
  const [activeAd, setActiveAd] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setActiveAd(prev => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [ads.length]);

  useEffect(() => {
    let animationFrameId: number;
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const animate = () => {
      setSmoothMousePos(prev => ({
        x: lerp(prev.x, mousePos.x, 0.06),
        y: lerp(prev.y, mousePos.y, 0.06)
      }));
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [mousePos]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = heroRef.current.getBoundingClientRect();
    const x = ((clientX - left) / width) * 2 - 1;
    const y = ((clientY - top) / height) * 2 - 1;
    setMousePos({ x, y });
  };

  const handleShopNow = async (product: any) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    await addToCart(product);
    navigate('/cart');
  };

  const handleAddToCart = async (product: any) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    await addToCart(product);
  };

  const handlePrevAd = () => {
    setActiveAd(prev => (prev - 1 + ads.length) % ads.length);
  };

  const handleNextAd = () => {
    setActiveAd(prev => (prev + 1) % ads.length);
  };

  return (
    <div className="space-y-12 md:space-y-24 lg:space-y-32 animate-fade-in overflow-hidden bg-[#020617]">

      {/* ── Pending Payment Banner ─────────────────────────────────────────── */}
      {currentUser && (() => {
        const myOrders = (orders || []).filter(o => o.userId === currentUser.id);

        const awaitingApproval = myOrders.filter(
          o => (o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash') &&
               o.paymentStatus === 'awaiting_approval'
        );
        const justApproved = myOrders.filter(
          o => (o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash') &&
               o.paymentStatus === 'approved'
        );
        const rejected = myOrders.filter(
          o => (o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash') &&
               o.paymentStatus === 'rejected'
        );

        if (awaitingApproval.length === 0 && justApproved.length === 0 && rejected.length === 0) return null;

        return (
          <div className="px-4 md:px-8 pt-6 space-y-3 relative z-10">

            {/* Awaiting approval */}
            {awaitingApproval.length > 0 && (
              <Link to="/orders" className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/15 transition-all group">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-amber-400 animate-pulse" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-black text-amber-400 leading-tight">
                    {awaitingApproval.length === 1
                      ? 'Aapki 1 payment verify hone ka intezaar hai'
                      : `Aapki ${awaitingApproval.length} payments verify hone ka intezaar hain`}
                  </p>
                  <p className="text-[11px] text-amber-400/60 mt-0.5">
                    Jab Adil Zaman approve kar dein ge, order automatically place ho jaye ga — tap karein status dekhne ke liye
                  </p>
                </div>
                <ArrowRight size={16} className="text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}

            {/* Just approved */}
            {justApproved.length > 0 && (
              <Link to="/orders" className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 transition-all group">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-black text-emerald-400 leading-tight">
                    🎉 Payment approved! Aapka order ab active hai
                  </p>
                  <p className="text-[11px] text-emerald-400/60 mt-0.5">
                    Tap karein order track karne ke liye
                  </p>
                </div>
                <ArrowRight size={16} className="text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}

            {/* Rejected */}
            {rejected.length > 0 && (
              <Link to="/orders" className="flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 hover:bg-red-500/15 transition-all group">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle size={18} className="text-red-400" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-black text-red-400 leading-tight">
                    Aapki payment reject ho gayi
                  </p>
                  <p className="text-[11px] text-red-400/60 mt-0.5">
                    Tap karein details dekhne ke liye — support se rabta karein
                  </p>
                </div>
                <ArrowRight size={16} className="text-red-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        );
      })()}

      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-1/2 left-1/2 w-[120vw] h-[120vw] bg-amber-500/5 blur-[160px] rounded-full transition-transform duration-[1s] ease-out"
          style={{ transform: `translate(calc(-50% + ${smoothMousePos.x * 40}px), calc(-50% + ${smoothMousePos.y * 40}px))` }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-[60vw] h-[60vw] bg-yellow-500/10 blur-[120px] rounded-full"
          style={{ transform: `translate(calc(-50% + ${smoothMousePos.x * 120}px), calc(-50% + ${smoothMousePos.y * 120}px))` }}
        ></div>
        <div
          className="absolute top-1/3 left-1/4 w-[30vw] h-[30vw] bg-orange-600/5 blur-[100px] rounded-full animate-pulse"
          style={{ transform: `translate(calc(-50% + ${smoothMousePos.x * -80}px), calc(-50% + ${smoothMousePos.y * -80}px))` }}
        ></div>

        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-float opacity-30 blur-[1px]"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${4 + Math.random() * 6}s`,
              animationDelay: `${Math.random() * 3}s`,
              transform: `translate(${smoothMousePos.x * (i + 5)}px, ${smoothMousePos.y * (i + 5)}px)`
            }}
          />
        ))}
      </div>

      {isDbLoading ? (
        <section className="relative w-full h-[42vh] md:h-[70vh] px-4 md:px-12 pt-8 reveal">
          <AdSkeleton />
        </section>
      ) : ads.length > 0 && (
        <section className="relative w-full h-[42vh] md:h-[70vh] px-4 md:px-12 pt-8 reveal">
          <div className="relative w-full h-full rounded-[4rem] overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-yellow-500/20 bg-black">
            {ads.map((ad, idx) => (
              <div
                key={ad.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === activeAd ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}
              >
                {ad.videoUrl ? (
                  <video src={ad.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover transition-all duration-1000" />
                ) : (
                  <img src={ad.imageUrl} className="w-full h-full object-cover transition-all duration-1000" alt={ad.title} />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>

                <div className="absolute inset-0 flex items-center px-12 md:px-24">
                  <div className="max-w-2xl space-y-6">
                    <div className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 glass-dark border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase tracking-[0.5em] rounded-full">
                      <Sparkles size={12} className="animate-pulse" /> Imperial Spotlight
                    </div>
                    <h2 className="text-3xl md:text-6xl lg:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">
                      {ad.title}
                    </h2>
                    <div className="pt-6">
                      <a
                        href={ad.link}
                        className="group/btn relative hidden sm:inline-flex items-center gap-6 px-12 py-5 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-full font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:scale-105 shadow-[0_20px_40px_rgba(245,158,11,0.3)]"
                      >
                        Explore Collection <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Navigation Buttons */}
            {ads.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={handlePrevAd}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 glass-dark rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-yellow-500 hover:text-black transition-all duration-500 shadow-2xl backdrop-blur-2xl border border-white/10 active:scale-90 z-30"
                  aria-label="Previous ad"
                >
                  <ChevronLeft size={24} />
                </button>
                
                {/* Next Button */}
                <button
                  onClick={handleNextAd}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 glass-dark rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-yellow-500 hover:text-black transition-all duration-500 shadow-2xl backdrop-blur-2xl border border-white/10 active:scale-90 z-30"
                  aria-label="Next ad"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-20">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveAd(i)}
                  className={`h-1.5 rounded-full transition-all duration-700 ${activeAd === i ? 'w-16 bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : 'w-2 bg-white/10'}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-[95vh] flex items-center justify-center overflow-hidden cursor-default pt-10 md:pt-24"
      >
        {/* Premium Shopping Themed Background Animations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Premium Shopping Cart Mouse-Following Orb */}
          <div
            className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-yellow-300/20 via-amber-400/25 to-orange-400/20 blur-3xl transition-all duration-300 ease-out"
            style={{
              left: `${50 + smoothMousePos.x * 20}%`,
              top: `${50 + smoothMousePos.y * 20}%`,
              transform: 'translate(-50%, -50%)',
            }}
          ></div>

          {/* Secondary Premium Orb */}
          <div
            className="absolute w-28 h-28 rounded-full bg-gradient-to-r from-amber-200/18 via-yellow-300/20 to-orange-300/18 blur-2xl transition-all duration-400 ease-out"
            style={{
              left: `${50 + smoothMousePos.x * 15}%`,
              top: `${50 + smoothMousePos.y * 15}%`,
              transform: 'translate(-50%, -50%)',
            }}
          ></div>

          {/* Luxury Price Tag Orb */}
          <div
            className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-emerald-300/15 via-green-400/18 to-teal-300/15 blur-xl transition-all duration-500 ease-out"
            style={{
              left: `${50 + smoothMousePos.x * 10}%`,
              top: `${50 + smoothMousePos.y * 10}%`,
              transform: 'translate(-50%, -50%)',
            }}
          ></div>

          {/* Diamond Sparkle Orb */}
          <div
            className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-purple-300/12 via-pink-300/15 to-rose-300/12 blur-lg transition-all duration-600 ease-out"
            style={{
              left: `${50 + smoothMousePos.x * 6}%`,
              top: `${50 + smoothMousePos.y * 6}%`,
              transform: 'translate(-50%, -50%)',
            }}
          ></div>

          {/* Premium Floating Shopping Icons */}
          <div className="absolute top-0 left-0 w-full h-full">
            {/* Luxury Shopping Cart */}
            <div
              className="absolute w-12 h-12 text-yellow-300/40 transform-gpu"
              style={{
                top: '8%',
                left: '12%',
                transform: `translateX(${smoothMousePos.x * 35}px) translateY(${smoothMousePos.y * 35}px) rotate(${Date.now() / 70}deg)`,
                animation: 'float-luxury-cart 10s ease-in-out infinite'
              }}
            >
              <ShoppingCart size={48} className="w-full h-full drop-shadow-[0_0_20px_rgba(250,204,21,0.3)]" />
            </div>

            {/* Premium Price Tag */}
            <div
              className="absolute w-8 h-8 text-emerald-300/40 transform-gpu"
              style={{
                top: '72%',
                right: '18%',
                transform: `translateX(${smoothMousePos.x * -30}px) translateY(${smoothMousePos.y * -30}px) rotate(${Date.now() / 90}deg)`,
                animation: 'float-luxury-price 12s ease-in-out infinite'
              }}
            >
              <div className="w-full h-full border-3 border-current rounded-full relative drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-current rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute -top-1 left-1/2 w-4 h-2 border-2 border-current rounded-t-full -translate-x-1/2"></div>
              </div>
            </div>

            {/* Diamond Shopping Bag */}
            <div
              className="absolute w-10 h-10 text-purple-300/35 transform-gpu"
              style={{
                bottom: '22%',
                left: '22%',
                transform: `translateX(${smoothMousePos.x * 25}px) translateY(${smoothMousePos.y * 25}px) rotate(${Date.now() / 80}deg)`,
                animation: 'float-luxury-bag 14s ease-in-out infinite'
              }}
            >
              <div className="w-full h-full border-3 border-current rounded-t-xl relative drop-shadow-[0_0_18px_rgba(168,85,247,0.3)]">
                <div className="absolute -top-3 left-1/2 w-4 h-3 border-3 border-current rounded-full -translate-x-1/2"></div>
                <div className="absolute top-2 left-2 w-1 h-1 bg-current rounded-full"></div>
                <div className="absolute top-2 right-2 w-1 h-1 bg-current rounded-full"></div>
              </div>
            </div>

            {/* Platinum Credit Card */}
            <div
              className="absolute w-14 h-8 text-blue-200/30 transform-gpu"
              style={{
                top: '32%',
                right: '32%',
                transform: `translateX(${smoothMousePos.x * -40}px) translateY(${smoothMousePos.y * -40}px) rotate(${Date.now() / 60}deg)`,
                animation: 'float-luxury-card 11s ease-in-out infinite'
              }}
            >
              <div className="w-full h-full border-3 border-current rounded-xl relative drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <div className="absolute top-2 left-2 w-3 h-2 bg-current rounded-full"></div>
                <div className="absolute top-2 right-2 w-3 h-2 bg-current rounded-full"></div>
                <div className="absolute bottom-2 left-2 right-2 h-1 bg-current rounded"></div>
              </div>
            </div>

            {/* Luxury Gift Box */}
            <div
              className="absolute w-8 h-8 text-pink-300/35 transform-gpu"
              style={{
                bottom: '12%',
                right: '8%',
                transform: `translateX(${smoothMousePos.x * -25}px) translateY(${smoothMousePos.y * -25}px) rotate(${Date.now() / 100}deg)`,
                animation: 'float-luxury-gift 13s ease-in-out infinite'
              }}
            >
              <div className="w-full h-full border-3 border-current relative drop-shadow-[0_0_16px_rgba(236,72,153,0.3)]">
                <div className="absolute top-0 left-1/2 w-full h-1 bg-current -translate-x-1/2"></div>
                <div className="absolute top-1/2 left-0 w-1 h-full bg-current -translate-y-1/2"></div>
                <div className="absolute top-1/2 right-0 w-1 h-full bg-current -translate-y-1/2"></div>
                <div className="absolute -top-2 left-1/2 w-2 h-2 bg-current rounded-full -translate-x-1/2"></div>
              </div>
            </div>

            {/* Crown Icon */}
            <div
              className="absolute w-10 h-10 text-amber-300/40 transform-gpu"
              style={{
                top: '45%',
                left: '8%',
                transform: `translateX(${smoothMousePos.x * 20}px) translateY(${smoothMousePos.y * 20}px) rotate(${Date.now() / 120}deg)`,
                animation: 'float-luxury-crown 15s ease-in-out infinite'
              }}
            >
              <Crown size={40} className="w-full h-full drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]" />
            </div>

            {/* Diamond Icon */}
            <div
              className="absolute w-8 h-8 text-cyan-300/35 transform-gpu"
              style={{
                top: '15%',
                right: '15%',
                transform: `translateX(${smoothMousePos.x * -28}px) translateY(${smoothMousePos.y * -28}px) rotate(${Date.now() / 85}deg)`,
                animation: 'float-luxury-diamond 16s ease-in-out infinite'
              }}
            >
              <Diamond size={32} className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
            </div>

            {/* Mouse-Attractive "Adil" Text - Left Side */}
            <div
              className="absolute text-5xl font-black text-cyan-300/60 transform-gpu select-none"
              style={{
                top: '20%',
                left: '5%',
                transform: `translateX(${smoothMousePos.x * 60}px) translateY(${smoothMousePos.y * 60}px) rotate(${Date.now() / 150}deg)`,
                animation: 'float-name-adil 18s ease-in-out infinite',
                textShadow: '0 0 40px rgba(6,182,212,0.6), 0 0 60px rgba(6,182,212,0.3)',
                fontFamily: 'Georgia, serif',
                fontWeight: 'bold',
                letterSpacing: '0.05em'
              }}
            >
              Adil
            </div>

            {/* Mouse-Attractive "Ahmed" Text - Right Side */}
            <div
              className="absolute text-5xl font-black text-purple-300/60 transform-gpu select-none"
              style={{
                top: '70%',
                right: '5%',
                transform: `translateX(${smoothMousePos.x * -60}px) translateY(${smoothMousePos.y * -60}px) rotate(${Date.now() / 130}deg)`,
                animation: 'float-name-ahmed 20s ease-in-out infinite',
                textShadow: '0 0 40px rgba(168,85,247,0.6), 0 0 60px rgba(168,85,247,0.3)',
                fontFamily: 'Georgia, serif',
                fontWeight: 'bold',
                letterSpacing: '0.05em'
              }}
            >
              Ahmed
            </div>
          </div>

          {/* Premium Shopping Particle Field */}
          {[...Array(45)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-gradient-to-r from-yellow-300/40 to-amber-300/40 rounded-full"
              style={{
                left: `${(i * 5) % 100}%`,
                top: `${(i * 7) % 100}%`,
                transform: `translate(${smoothMousePos.x * (8 + i * 0.2)}px, ${smoothMousePos.y * (8 + i * 0.2)}px)`,
                animation: `particle-luxury-float ${4 + (i % 5)}s ease-in-out infinite`,
                animationDelay: `${i * 0.06}s`
              }}
            ></div>
          ))}

          {/* Diamond Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fbbf24_2px,transparent_2px),linear-gradient(to_bottom,#fbbf24_2px,transparent_2px)] bg-[size:5rem_5rem]"
            style={{
              transform: `perspective(1000px) rotateX(${smoothMousePos.y * 2}deg) rotateY(${smoothMousePos.x * 2}deg) translate(${smoothMousePos.x * -10}px, ${smoothMousePos.y * -10}px)`
            }}
          ></div>

          {/* Luxury Wave Lines */}
          <div className="absolute bottom-0 left-0 w-full h-40 overflow-hidden">
            <div
              className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-yellow-300/15 via-amber-300/10 to-transparent opacity-40"
              style={{
                transform: `perspective(1000px) rotateX(${smoothMousePos.y * 2.5}deg) translateY(${Math.sin(Date.now() / 1000) * 18}px)`,
                animation: 'luxury-wave-motion 5s ease-in-out infinite'
              }}
            ></div>
            <div
              className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-amber-200/12 via-yellow-200/8 to-transparent opacity-30"
              style={{
                transform: `perspective(1000px) rotateX(${smoothMousePos.y * 2.5}deg) translateY(${Math.sin(Date.now() / 1000 + 1) * 12}px)`,
                animation: 'luxury-wave-motion-reverse 5s ease-in-out infinite'
              }}
            ></div>
          </div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center select-none reveal">
          {/* Premium Logo Section */}
          <div className="flex flex-col items-center mb-12">
            <div className="relative group">
              {/* Mouse-following glow effect */}
              <div
                className="absolute -inset-4 w-40 h-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-yellow-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-30 blur-xl transition-all duration-700 pointer-events-none"
                style={{
                  background: `radial-gradient(100px circle at ${50 + smoothMousePos.x * 20}% ${50 + smoothMousePos.y * 20}%, rgba(250,204,21,0.3) 0%, transparent 70%)`
                }}
              ></div>

              {/* Outer glow ring - perfectly centered */}
              <div className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400 opacity-15 blur-2xl group-hover:opacity-30 transition-opacity duration-700 animate-pulse"></div>

              {/* Second glow ring - perfectly centered */}
              <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-600 animate-pulse" style={{ animationDelay: '1s' }}></div>

              {/* Outer Ring - perfectly centered */}
              <div className="absolute top-1/2 left-1/2 w-44 h-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-3 border-yellow-400/40 group-hover:border-yellow-300/60 transition-all duration-400 animate-pulse"></div>

              {/* Middle Ring - perfectly centered */}
              <div className="absolute top-1/2 left-1/2 w-36 h-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-400/30 group-hover:border-blue-300/50 transition-all duration-400 animate-pulse" style={{ animationDelay: '0.5s' }}></div>

              {/* Inner Ring - perfectly centered */}
              <div className="absolute top-1/2 left-1/2 w-28 h-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-400/20 group-hover:border-purple-300/40 transition-all duration-400 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

              {/* Logo Container - perfectly centered with mouse interaction */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-purple-700 shadow-2xl group-hover:shadow-3xl group-hover:shadow-blue-500/50 transition-all duration-500 group-hover:scale-110 cursor-pointer">
                {/* Dynamic gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 via-pink-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-50 transition-opacity duration-800 animate-gradient-flow"></div>
                {/* Rotating shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-600 animate-shimmer"></div>
                {/* Radial gradient overlay */}
                <div className="absolute inset-0 rounded-full bg-gradient-radial from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
                {/* Mouse-reactive glow */}
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(60px circle at ${50 + smoothMousePos.x * 15}% ${50 + smoothMousePos.y * 15}%, rgba(96,165,250,0.3) 0%, transparent 70%)`
                  }}
                ></div>
                {/* Logo */}
                <img src="/images/zaman-logo.png" alt="Zaman Sons Mall" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                {/* Inner glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              </div>

              {/* Enhanced Orbiting particles - more attractive */}
              <div className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {/* Top particle with trail */}
                <div className="absolute top-0 left-1/2 w-3 h-3 -translate-x-1/2">
                  <div className="w-full h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-[0_0_12px_rgba(250,204,21,0.8)] animate-orbit-top"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-yellow-300 rounded-full opacity-60 animate-orbit-top blur-sm" style={{ animationDelay: '0.05s' }}></div>
                  <div className="absolute top-0 left-0 w-6 h-6 bg-yellow-400/20 rounded-full animate-orbit-top blur-md" style={{ animationDelay: '0.1s' }}></div>
                </div>

                {/* Right particle with trail */}
                <div className="absolute right-0 top-1/2 w-3 h-3 -translate-y-1/2">
                  <div className="w-full h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full shadow-[0_0_12px_rgba(236,72,153,0.8)] animate-orbit-right"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-pink-300 rounded-full opacity-60 animate-orbit-right blur-sm" style={{ animationDelay: '0.05s' }}></div>
                  <div className="absolute top-0 left-0 w-6 h-6 bg-pink-400/20 rounded-full animate-orbit-right blur-md" style={{ animationDelay: '0.1s' }}></div>
                </div>

                {/* Bottom particle with trail */}
                <div className="absolute bottom-0 left-1/2 w-3 h-3 -translate-x-1/2">
                  <div className="w-full h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(96,165,250,0.8)] animate-orbit-bottom"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-blue-300 rounded-full opacity-60 animate-orbit-bottom blur-sm" style={{ animationDelay: '0.05s' }}></div>
                  <div className="absolute top-0 left-0 w-6 h-6 bg-blue-400/20 rounded-full animate-orbit-bottom blur-md" style={{ animationDelay: '0.1s' }}></div>
                </div>

                {/* Left particle with trail */}
                <div className="absolute left-0 top-1/2 w-3 h-3 -translate-y-1/2">
                  <div className="w-full h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-orbit-left"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-purple-300 rounded-full opacity-60 animate-orbit-left blur-sm" style={{ animationDelay: '0.05s' }}></div>
                  <div className="absolute top-0 left-0 w-6 h-6 bg-purple-400/20 rounded-full animate-orbit-left blur-md" style={{ animationDelay: '0.1s' }}></div>
                </div>

                {/* Center glow effect */}
                <div className="absolute top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400/20 via-blue-400/20 to-purple-400/20 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700 animate-pulse blur-md"></div>
              </div>
            </div>

            {/* Enhanced Brand Tagline */}
            <div className="mt-10 space-y-4 text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-gradient-flow"></div>
                <p className="text-yellow-400 text-lg font-black uppercase tracking-widest animate-fade-in group-hover:animate-pulse group-hover:text-yellow-300 transition-colors">Since 2026</p>
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-gradient-flow"></div>
              </div>
              <p className="text-gray-300 text-sm font-medium uppercase tracking-widest group-hover:text-blue-400 transition-colors">Premium Shopping Experience</p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                <span className="text-sm text-green-400 font-bold uppercase tracking-wider group-hover:animate-gradient-flow">Active Now</span>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ animationDelay: '0.5s' }}></div>
                <span className="text-sm text-blue-400 font-bold uppercase tracking-wider group-hover:animate-gradient-flow" style={{ animationDelay: '0.5s' }}>Online</span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass border-yellow-500/20 text-[11px] font-black uppercase tracking-[0.3em] text-yellow-500 mb-10 animate-float shadow-[0_0_20px_rgba(234,179,8,0.1)]">
            <Crown size={16} className="fill-current animate-pulse" /> All Things in one Place
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-9xl font-black tracking-normal mb-10 leading-none uppercase text-white drop-shadow-2xl">
            ZAMAN SONS <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-600 italic font-serif capitalize">Super Mall</span>
          </h1>
          <p className="text-sm md:text-lg text-gray-400 max-w-4xl mx-auto mb-16 leading-relaxed font-medium px-4">
            Discover premium products at unbeatable prices. Your trusted shopping destination for quality electronics, fashion, home essentials, and more. Experience the future of online shopping with Zaman Sons Mall.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-16">
            <div className="flex items-center gap-2 text-gray-400 group">
              <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <ShieldCheck size={18} className="text-green-400" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">100% Genuine</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 group">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Truck size={18} className="text-blue-400" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 group">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Award size={18} className="text-purple-400" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">Best Quality</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 group">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Crown size={18} className="text-amber-400" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">Premium Service</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <Link to="/shop" className="group relative px-20 py-8 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] transition-all hover:scale-105 flex items-center gap-4 shadow-[0_30px_60px_rgba(245,158,11,0.3)] active:scale-95 overflow-hidden">
              <span className="relative z-10">Access The Vault</span>
              <ArrowRight size={22} className="relative z-10 group-hover:translate-x-2 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── ZEELS SECTION ── */}
      <ZeelsPreviewSection />

      {/* ── AFFILIATE BRANDS SECTION ── */}
      <AffiliateBrandsSection />

      {/* ── AFFILIATE PRODUCTS SECTION ── */}
      <AffiliateProductsSection />

      <section className="max-w-7xl mx-auto px-4 reveal">
        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-12 bg-yellow-500 rounded-full"></div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-yellow-500">Curated Prestige</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">The Golden Collection</h2>
          </div>
          <div className="flex items-center gap-3 pb-2">
            {/* Shuffle Button */}
            {!isDbLoading && allFeatured.length > 0 && (
              <button
                onClick={handleProductShuffle}
                disabled={isShufflingProducts}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-[11px] font-black uppercase tracking-widest hover:bg-yellow-500/15 hover:border-yellow-400/50 transition-all duration-200 disabled:opacity-50 group"
                title="Shuffle Products"
              >
                <Shuffle size={13} className={`transition-transform duration-500 ${isShufflingProducts ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                <span>Shuffle</span>
              </button>
            )}
            <Link to="/shop" className="text-yellow-500 hover:text-white font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 group border-b-2 border-transparent hover:border-yellow-500 transition-all">
              View Full Repository <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-12 transition-all duration-300 ${isShufflingProducts ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
          {isDbLoading ? (
            <>
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </>
          ) : displayFeatured.map((product, idx) => {
            const avgRating = product.ratings?.length
              ? product.ratings.reduce((a, b) => a + b, 0) / product.ratings.length
              : 0;
            const isFav = favorites.includes(product.id);

            return (
              <div key={product.id} className={`group relative glass rounded-[4rem] border-white/5 bg-white/[0.01] transition-all duration-700 hover:-translate-y-4 reveal stagger-${idx + 1} shadow-2xl overflow-hidden hover:border-yellow-500/30`}>
                <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="aspect-[4/5] overflow-hidden relative block m-4 rounded-[3rem] bg-black">
                  <Link to={`/product/${product.id}`} className="block w-full h-full">
                    <ProductImageSlider 
                      images={product.images && product.images.length > 0 ? product.images : [product.image]} 
                      name={product.name} 
                    />
                  </Link>
                  <div className="absolute top-6 right-6 flex flex-col gap-3 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 z-10">
                    <button
                      onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
                      className={`p-4 rounded-2xl glass transition-all duration-300 hover:scale-110 shadow-2xl ${isFav ? 'bg-amber-500 border-amber-400 text-black' : 'text-white/60 hover:text-yellow-500 hover:bg-white/10'}`}
                    >
                      <Heart size={20} className={isFav ? "fill-current" : ""} />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                      className="p-4 rounded-2xl glass text-yellow-500 hover:text-black hover:bg-yellow-500 transition-all duration-300 hover:scale-110 shadow-2xl border-yellow-500/20"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-700 z-20">
                    <button
                      onClick={(e) => { e.preventDefault(); handleShopNow(product); }}
                      className="w-full py-5 rounded-[1.75rem] bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all hover:bg-yellow-400"
                    >
                      <Zap size={18} className="fill-current" /> Shop Now
                    </button>
                  </div>

                  {/* Country Tag */}
                  {product.country && (
                    <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 z-10 animate-fade-in group-hover:translate-y-[-80px] transition-transform duration-500">
                      {product.country === 'china' ? (
                        <>
                          <img src="/images/china.png" alt="China" className="w-5 h-3.5 object-contain" />
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">China</span>
                        </>
                      ) : (
                        <>
                          <img src="/images/pakistan.png" alt="Pakistan" className="w-5 h-3.5 object-contain" />
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Pakistan</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-10 pb-10 pt-4 flex flex-col flex-grow relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-yellow-600 text-[10px] font-black uppercase tracking-[0.4em]">{product.category}</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20 shadow-lg">
                      <Star size={12} className="fill-current" />
                      <span>{avgRating?.toFixed(1) || "0.0"}</span>
                    </div>
                  </div>
                  <Link to={`/product/${product.id}`} className="hover:text-yellow-500 transition-colors">
                    <h3 className="text-2xl font-black mb-3 leading-tight text-white tracking-tight">{product.name}</h3>
                  </Link>
                  <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">{formatPrice(product.price)}</span>
                    </div>
                    <Link to={`/product/${product.id}`} className="w-14 h-14 bg-white/5 hover:bg-yellow-500 hover:text-black rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-xl group/btn border border-yellow-500/10">
                      <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-32 reveal">
        <div className="flex items-center gap-3 mb-16">
          <div className="h-1 w-12 bg-amber-600 rounded-full"></div>
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500">Executive Mall Protocols</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div
            className="group relative glass rounded-[4rem] p-12 border-white/5 bg-white/[0.01] transition-all duration-700 hover:-translate-y-4 hover:border-yellow-500/40 overflow-hidden text-center"
            style={{ transform: `rotateY(${smoothMousePos.x * 5}deg) rotateX(${smoothMousePos.y * -5}deg)` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10 mb-8 w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-amber-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_20px_40px_rgba(245,158,11,0.1)]">
              <Crown size={40} className="text-amber-500 fill-amber-500/20 animate-pulse" />
            </div>
            <h3 className="relative z-10 text-2xl font-black uppercase tracking-tighter text-white mb-4">Royal <span className="text-amber-500 italic">Membership</span></h3>
            <p className="relative z-10 text-gray-400 text-sm leading-relaxed mb-10 px-4">Unlock the Sovereign Tier for exclusive early-access to rare high-fidelity curations.</p>
            <Link to="/profile" className="relative z-10 block w-full py-5 glass border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] rounded-3xl hover:bg-amber-500 hover:text-black transition-all text-center">
              Initialize Status
            </Link>
          </div>

          <div
            className="group relative glass rounded-[4rem] p-12 border-white/5 bg-white/[0.01] transition-all duration-700 hover:-translate-y-4 hover:border-blue-400/40 overflow-hidden text-center"
            style={{ transform: `rotateY(${smoothMousePos.x * 5}deg) rotateX(${smoothMousePos.y * -5}deg)` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10 mb-8 w-24 h-24 bg-blue-400/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-blue-400/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-[0_20px_40px_rgba(96,165,250,0.1)]">
              <Sparkles size={40} className="text-blue-400 animate-float" />
            </div>
            <h3 className="relative z-10 text-2xl font-black uppercase tracking-tighter text-white mb-4">Digital <span className="text-blue-400 italic">Concierge</span></h3>
            <p className="relative z-10 text-gray-400 text-sm leading-relaxed mb-10 px-4">Advanced AI monitoring providing real-time technical support for your premium mall assets.</p>
            <button
              onClick={() => setIsAiOpen(true)}
              className="relative z-10 w-full py-5 glass border-blue-400/30 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] rounded-3xl hover:bg-blue-400 hover:text-white transition-all"
            >
              Consult AI
            </button>
          </div>

          <div
            className="group relative glass rounded-[4rem] p-12 border-white/5 bg-white/[0.01] transition-all duration-700 hover:-translate-y-4 hover:border-orange-500/40 overflow-hidden text-center"
            style={{ transform: `rotateY(${smoothMousePos.x * 5}deg) rotateX(${smoothMousePos.y * -5}deg)` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10 mb-8 w-24 h-24 bg-orange-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-orange-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-[0_20px_40px_rgba(249,115,22,0.1)]">
              <Globe size={40} className="text-orange-500 animate-spin-slow" />
            </div>
            <h3 className="relative z-10 text-2xl font-black uppercase tracking-tighter text-white mb-4">Imperial <span className="text-orange-500 italic">Logistics</span></h3>
            <p className="relative z-10 text-gray-400 text-sm leading-relaxed mb-10 px-4">Satellite-tracked dispatch routing your acquisitions from global hubs to your coordinates.</p>
            <Link to="/orders" className="relative z-10 block w-full py-5 glass border-orange-500/30 text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] rounded-3xl hover:bg-orange-500 hover:text-white transition-all text-center">
              Track Routing
            </Link>
          </div>
        </div>
      </section>

      {/* Custom CSS for luxury shopping animations */}
      <style>{`
        @keyframes float-luxury-cart {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-25px) translateX(12px) rotate(20deg); }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          75% { transform: translateY(-18px) translateX(-12px) rotate(-20deg); }
        }
        @keyframes float-luxury-price {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(30px) translateX(-12px) rotate(-25deg); }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          75% { transform: translateY(25px) translateX(12px) rotate(25deg); }
        }
        @keyframes float-luxury-bag {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-35px) translateX(18px) rotate(30deg); }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          75% { transform: translateY(-30px) translateX(-18px) rotate(-30deg); }
        }
        @keyframes float-luxury-card {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-22px) translateX(-15px) rotate(15deg); }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          75% { transform: translateY(-18px) translateX(15px) rotate(-15deg); }
        }
        @keyframes float-luxury-gift {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-28px) translateX(-10px) rotate(22deg); }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          75% { transform: translateY(-23px) translateX(10px) rotate(-22deg); }
        }
        @keyframes float-luxury-crown {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-40px) translateX(15px) rotate(35deg); }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          75% { transform: translateY(-35px) translateX(-15px) rotate(-35deg); }
        }
        @keyframes float-luxury-diamond {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-32px) translateX(-20px) rotate(28deg); }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          75% { transform: translateY(-28px) translateX(20px) rotate(-28deg); }
        }
        @keyframes float-name-adil {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); opacity: 0.6; }
          25% { transform: translateY(-35px) translateX(20px) rotate(25deg) scale(1.2); opacity: 0.9; }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); opacity: 1; }
          75% { transform: translateY(-30px) translateX(-20px) rotate(-25deg) scale(0.8); opacity: 0.7; }
        }
        @keyframes float-name-ahmed {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); opacity: 0.6; }
          25% { transform: translateY(-40px) translateX(-25px) rotate(-30deg) scale(1.3); opacity: 0.9; }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); opacity: 1; }
          75% { transform: translateY(-35px) translateX(25px) rotate(30deg) scale(0.85); opacity: 0.7; }
        }
        @keyframes particle-luxury-float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          50% { transform: translateY(-15px) translateX(8px); opacity: 0.8; }
        }
        @keyframes luxury-wave-motion {
          0%, 100% { transform: perspective(1000px) rotateX(0deg) translateY(0px); }
          50% { transform: perspective(1000px) rotateX(3deg) translateY(-20px); }
        }
        @keyframes luxury-wave-motion-reverse {
          0%, 100% { transform: perspective(1000px) rotateX(0deg) translateY(0px); }
          50% { transform: perspective(1000px) rotateX(-3deg) translateY(-15px); }
        }
        @keyframes orbit-top {
          0% { transform: translateX(-50%) translateY(0) rotate(0deg) translateX(60px) rotate(0deg); }
          100% { transform: translateX(-50%) translateY(0) rotate(360deg) translateX(60px) rotate(-360deg); }
        }
        @keyframes orbit-bottom {
          0% { transform: translateX(-50%) translateY(0) rotate(180deg) translateX(60px) rotate(-180deg); }
          100% { transform: translateX(-50%) translateY(0) rotate(540deg) translateX(60px) rotate(-540deg); }
        }
        @keyframes orbit-left {
          0% { transform: translateY(-50%) translateX(0) rotate(90deg) translateY(60px) rotate(-90deg); }
          100% { transform: translateY(-50%) translateX(0) rotate(450deg) translateY(60px) rotate(-450deg); }
        }
        @keyframes orbit-right {
          0% { transform: translateY(-50%) translateX(0) rotate(270deg) translateY(60px) rotate(-270deg); }
          100% { transform: translateY(-50%) translateX(0) rotate(630deg) translateY(60px) rotate(-630deg); }
        }
        .animate-orbit-top { animation: orbit-top 4s linear infinite; }
        .animate-orbit-bottom { animation: orbit-bottom 4s linear infinite; }
        .animate-orbit-left { animation: orbit-left 4s linear infinite; }
        .animate-orbit-right { animation: orbit-right 4s linear infinite; }
      `}</style>
    </div>
  );
};
