import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Star, ExternalLink, ShoppingCart, ChevronLeft, ChevronRight,
  Share2, Tag, ArrowLeft, Loader2,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useIsMobile } from '../hooks/useIsMobile';

interface AffiliateProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  images: string[];
  affiliate_url: string;
  brand_id?: string;
  brand_name?: string;
  category: string;
  is_featured: boolean;
  sort_order: number;
}

interface AffiliateBrand {
  id: string;
  name: string;
  name_urdu?: string;
  logo_url: string;
  affiliate_url: string;
  description?: string;
}

const fmtPrice = (p: number) => p > 0 ? `Rs. ${p.toLocaleString()}` : null;
const openLink = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

export const AffiliateProductDetail: React.FC = () => {
  const { id }    = useParams<{ id: string }>();
  const isMobile  = useIsMobile();
  const [product, setProduct] = useState<AffiliateProduct | null>(null);
  const [brand,   setBrand]   = useState<AffiliateBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx,  setImgIdx]  = useState(0);
  const [related, setRelated] = useState<AffiliateProduct[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('affiliate_products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setProduct(data);
        if (data.brand_id) {
          const { data: b } = await supabase
            .from('affiliate_brands')
            .select('*')
            .eq('id', data.brand_id)
            .maybeSingle();
          if (b) setBrand(b);
        }
        const { data: rel } = await supabase
          .from('affiliate_products')
          .select('*')
          .eq('is_active', true)
          .eq('category', data.category)
          .neq('id', id)
          .order('sort_order')
          .limit(4);
        setRelated(rel || []);
      }
      setLoading(false);
    })();
  }, [id]);

  const images = product
    ? [product.image_url, ...(product.images || []).filter(i => i !== product.image_url)].filter(Boolean)
    : [];

  const handleShare = async () => {
    if (!product) return;
    const text = `${product.name}\n${fmtPrice(product.price) || ''}\n\nOrder: ${product.affiliate_url}`.trim();
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text, url: product.affiliate_url }); }
      catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Link copied!');
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 size={36} className="text-indigo-400 animate-spin" />
    </div>
  );

  // ── Not found ────────────────────────────────────────────────────────────
  if (!product) return (
    <div className="min-h-screen bg-[#020617] text-white pt-24 flex flex-col items-center justify-center px-4">
      <ShoppingCart size={64} className="text-gray-700 mb-6" />
      <h2 className="text-3xl font-black mb-3">Product nahi mila</h2>
      <p className="text-gray-500 mb-8">Ye product available nahi hai ya remove ho gaya hai.</p>
      <Link
        to="/affiliate-products"
        className="px-8 py-4 bg-indigo-600 text-white rounded-full font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all"
      >
        Back to Products
      </Link>
    </div>
  );

  // ── MOBILE UI ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#020617] text-white pb-28">

        {/* Image section */}
        <div className="relative bg-black" style={{ paddingTop: '60px' }}>
          <img
            src={images[imgIdx] || product.image_url}
            alt={product.name}
            className="w-full object-cover"
            style={{ maxHeight: '280px', objectFit: 'cover' }}
            onError={e => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/400x280/1a1a2e/6366f1?text=${product.name[0]}`;
            }}
          />

          {/* Back button */}
          <Link
            to="/affiliate-products"
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white"
          >
            <ArrowLeft size={16} />
          </Link>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white"
          >
            <Share2 size={15} />
          </button>

          {/* Featured badge */}
          {product.is_featured && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500 text-black text-[9px] font-black uppercase">
              <Star size={8} className="fill-current" /> Top Pick
            </div>
          )}

          {/* Image nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setImgIdx(i => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <ChevronRight size={16} />
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${imgIdx === i ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-[#0a0f1e] scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  imgIdx === i ? 'border-indigo-400' : 'border-white/10 opacity-50'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="px-4 pt-4 space-y-4">

          {/* Category + name + price */}
          <div>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider mb-2"
              style={{ background: '#6366f118', color: '#818cf8', border: '1px solid #6366f130' }}
            >
              <Tag size={8} /> {product.category}
            </span>
            <h1 className="text-xl font-black text-white leading-tight">{product.name}</h1>
            {fmtPrice(product.price) && (
              <p className="text-indigo-400 font-black text-2xl mt-1">{fmtPrice(product.price)}</p>
            )}
          </div>

          {/* Brand */}
          {(brand || product.brand_name) && (
            <button
              onClick={() => brand?.affiliate_url && openLink(brand.affiliate_url)}
              className="w-full flex items-center gap-3 bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-left"
            >
              {brand?.logo_url ? (
                <div className="w-10 h-10 rounded-lg bg-white p-1 flex-shrink-0">
                  <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart size={16} className="text-indigo-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{brand?.name ?? product.brand_name}</p>
                {brand?.name_urdu && <p className="text-gray-500 text-xs">{brand.name_urdu}</p>}
                {!brand?.name_urdu && <p className="text-gray-500 text-xs">Official Brand Partner</p>}
              </div>
              {brand?.affiliate_url && <ExternalLink size={14} className="text-gray-500 flex-shrink-0" />}
            </button>
          )}

          {/* Description */}
          {product.description && (
            <div className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Description</p>
              <p className="text-gray-300 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Product details table */}
          <div className="bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest px-4 py-3 border-b border-white/10">
              Product Details
            </p>
            {[
              { label: 'Category', value: product.category },
              { label: 'Brand',    value: brand?.name ?? product.brand_name ?? '—' },
              { label: 'Price',    value: fmtPrice(product.price) ?? 'See on site' },
              { label: 'Type',     value: 'Affiliate Product' },
              ...(product.is_featured ? [{ label: 'Status', value: '⭐ Top Pick' }] : []),
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex items-center justify-between px-4 py-2.5 ${i < arr.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <span className="text-gray-500 text-sm">{row.label}</span>
                <span className="text-white font-bold text-sm">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div>
              <p className="text-white font-black text-base mb-3">Related Products</p>
              <div className="grid grid-cols-2 gap-3">
                {related.map(rp => (
                  <Link
                    key={rp.id}
                    to={`/affiliate-product/${rp.id}`}
                    className="bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden"
                  >
                    <div className="aspect-square overflow-hidden bg-black">
                      <img
                        src={rp.image_url}
                        alt={rp.name}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            `https://placehold.co/200x200/1a1a2e/6366f1?text=${rp.name[0]}`;
                        }}
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-white font-bold text-xs line-clamp-2 leading-snug">{rp.name}</p>
                      {fmtPrice(rp.price) && (
                        <p className="text-indigo-400 font-black text-sm mt-0.5">{fmtPrice(rp.price)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#020617] border-t border-white/10 px-4 py-3 z-50">
          <button
            onClick={() => openLink(product.affiliate_url)}
            className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2"
          >
            <ShoppingCart size={17} className="fill-current" />
            Order Now
            <ExternalLink size={13} className="opacity-75" />
          </button>
          {brand?.affiliate_url && (
            <button
              onClick={() => openLink(brand.affiliate_url)}
              className="w-full mt-2 py-2.5 rounded-xl border border-white/10 text-gray-400 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              Visit {brand.name}
              <ExternalLink size={11} className="opacity-60" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── DESKTOP UI (original, unchanged) ────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white pt-24 pb-24 relative overflow-hidden">
      {/* Bg glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[40vw] h-[40vw] bg-indigo-600/5 blur-[140px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-10 text-xs font-bold uppercase tracking-widest text-gray-500">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to="/affiliate-products" className="hover:text-white transition-colors">Affiliate Products</Link>
          <span>/</span>
          <span className="text-gray-400 truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">

          {/* ── LEFT: Images ─────────────────────────────── */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-[4rem] overflow-hidden bg-black group">
              <img
                src={images[imgIdx] || product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    `https://placehold.co/600x600/1a1a2e/6366f1?text=${product.name[0]}`;
                }}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setImgIdx(i => (i + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              {product.is_featured && (
                <div className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/90 text-black text-[10px] font-black uppercase tracking-widest">
                  <Star size={11} className="fill-current" /> Top Pick
                </div>
              )}
              <div className="absolute top-5 right-5 px-3 py-1.5 rounded-full bg-indigo-600/80 backdrop-blur-sm text-[10px] font-black text-white uppercase tracking-widest">
                {product.category}
              </div>
              {images.length > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${imgIdx === i ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all duration-300
                               ${imgIdx === i ? 'border-indigo-400 scale-95' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info ──────────────────────────────── */}
          <div className="flex flex-col space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-4 py-1.5 glass border border-indigo-500/20 rounded-full">
                <Tag size={12} className="text-indigo-400" />
                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{product.category}</span>
              </div>
              <button
                onClick={handleShare}
                className="w-10 h-10 glass border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Share2 size={16} />
              </button>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-white mb-4">
                {product.name}
              </h1>
              {fmtPrice(product.price) && (
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400">
                    {fmtPrice(product.price)}
                  </span>
                  <div className="px-3 py-1 glass border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                    Affiliate Price
                  </div>
                </div>
              )}
            </div>

            {(brand || product.brand_name) && (
              <button
                onClick={() => brand?.affiliate_url && openLink(brand.affiliate_url)}
                className={`flex items-center gap-4 p-5 glass border border-white/10 rounded-[2rem]
                           transition-all duration-300
                           ${brand?.affiliate_url ? 'hover:border-amber-500/30 hover:bg-amber-500/5 cursor-pointer' : 'cursor-default'}`}
              >
                {brand?.logo_url ? (
                  <div className="w-14 h-14 rounded-2xl bg-white p-2 flex-shrink-0 shadow-lg">
                    <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={22} className="text-indigo-400" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="text-white font-black text-base">{brand?.name ?? product.brand_name}</p>
                  {brand?.name_urdu && <p className="text-gray-500 text-sm">{brand.name_urdu}</p>}
                  {brand?.description && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{brand.description}</p>
                  )}
                  {!brand?.description && <p className="text-gray-500 text-xs mt-0.5">Official Brand Partner</p>}
                </div>
                {brand?.affiliate_url && <ExternalLink size={16} className="text-gray-500 flex-shrink-0" />}
              </button>
            )}

            {product.description && (
              <div className="p-6 glass border border-white/10 rounded-[2rem]">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 mb-4">Description</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="p-6 glass border border-white/10 rounded-[2rem] space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500">Product Details</h3>
              {[
                { label: 'Category', value: product.category },
                { label: 'Brand',    value: brand?.name ?? product.brand_name ?? '—' },
                { label: 'Price',    value: fmtPrice(product.price) ?? 'See on site' },
                { label: 'Type',     value: 'Affiliate Product' },
                ...(product.is_featured ? [{ label: 'Status', value: '⭐ Top Pick' }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="text-gray-500 text-sm">{row.label}</span>
                  <span className="text-white font-bold text-sm">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => openLink(product.affiliate_url)}
                className="w-full py-6 rounded-[2rem] bg-indigo-600 text-white text-[11px] font-black
                           uppercase tracking-[0.4em] flex items-center justify-center gap-3
                           hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-2xl shadow-indigo-600/30"
              >
                <ShoppingCart size={20} className="fill-current" />
                Order Now
                <ExternalLink size={14} className="opacity-75" />
              </button>
              {brand?.affiliate_url && (
                <button
                  onClick={() => openLink(brand.affiliate_url)}
                  className="w-full py-4 rounded-[1.75rem] glass border border-white/10 text-gray-400
                             text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2
                             hover:text-white hover:border-white/20 transition-all"
                >
                  {brand.name} ki website visit karein
                  <ExternalLink size={12} className="opacity-60" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="reveal">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-1 w-12 bg-indigo-500 rounded-full" />
              <h2 className="text-2xl font-black uppercase tracking-tighter">Related Products</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map(rp => (
                <Link
                  key={rp.id}
                  to={`/affiliate-product/${rp.id}`}
                  className="group glass rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-indigo-500/20 hover:-translate-y-2 transition-all duration-500"
                >
                  <div className="aspect-square overflow-hidden bg-black">
                    <img
                      src={rp.image_url}
                      alt={rp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          `https://placehold.co/300x300/1a1a2e/6366f1?text=${rp.name[0]}`;
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-white font-bold text-sm line-clamp-2 mb-1">{rp.name}</p>
                    {fmtPrice(rp.price) && (
                      <p className="text-indigo-400 font-black text-base">{fmtPrice(rp.price)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
