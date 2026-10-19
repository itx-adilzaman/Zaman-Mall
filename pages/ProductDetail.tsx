
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Star, ShieldCheck, Truck,
  RefreshCcw, Zap, User, MessageCircle, Send,
  Check, ChevronLeft, ChevronRight, Loader2,
  Award, Layers, Palette, Fingerprint, StarHalf,
  Shield, Globe, Lock, Target, Heart, BadgeCheck, Camera, X, Image as ImageIcon, Play, Pause, Volume2, VolumeX, Maximize
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { uploadToCloudinary } from '../services/cloudinary';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Mobile Product Detail ───────────────────────────────────────────────────────
const bg = '#0d0d0d'; const surface = '#1a1a1a'; const border = '#2a2a2a'; const textC = '#f0f0f0'; const sub = '#888'; const accent = '#6366f1';

const MobileProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { products, addToCart, addReview, currentUser, favorites, toggleFavorite, formatPrice } = useStore();
  const product = products.find(p => p.id === id);

  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [addedCart, setAddedCart] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const fromZeels = (location.state as any)?.fromZeels;
  const zeelIndex  = (location.state as any)?.zeelIndex;

  useEffect(() => {
    if (product?.variants) {
      const init: Record<string, string> = {};
      product.variants.forEach(v => {
        const first = v.options[0];
        init[v.type] = typeof first === 'string' ? first : (first as any).value;
      });
      setSelectedVariants(init);
    }
  }, [product]);

  if (!product) return (
    <div style={{ background: bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: textC, marginBottom: 14 }}>Product not found</p>
      <button onClick={() => navigate('/shop')} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Back to Shop</button>
    </div>
  );

  const images = product.images?.length ? product.images : [product.image];
  const avgRating = product.ratings?.length ? product.ratings.reduce((a, b) => a + b, 0) / product.ratings.length : 0;
  const isFav = favorites.includes(product.id);

  const currentPrice = (() => {
    if (!product.variants?.length) return product.price;
    for (const v of product.variants) {
      const sel = selectedVariants[v.type];
      if (!sel) continue;
      const matched = v.options.find(o => (typeof o === 'string' ? o : (o as any).value) === sel);
      if (!matched) continue;
      const cp = typeof matched === 'object' ? (matched as any).price : undefined;
      if (cp != null && cp > 0) return cp;
    }
    return product.price;
  })();

  const handleAddToCart = async () => {
    if (!currentUser) { navigate('/login'); return; }
    if ((product.stock || 0) <= 0) return;
    setIsAdding(true);
    await addToCart(product, selectedVariants, currentPrice);
    setIsAdding(false);
    setAddedCart(true);
    setTimeout(() => setAddedCart(false), 2500);
  };

  const handleShopNow = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setIsAdding(true);
    await addToCart(product, selectedVariants, currentPrice);
    setIsAdding(false);
    navigate('/cart');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || reviewRating === 0 || !reviewComment.trim()) return;
    addReview(product.id, { userName: currentUser.name, rating: reviewRating, comment: reviewComment, images: [] });
    setReviewRating(0);
    setReviewComment('');
  };

  const isOos = (product.stock || 0) <= 0;
  const isChinese = product.country === 'china';
  const isMallProduct = product.country === 'pakistan';

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 160 }}>
      {/* Back nav */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${border}` }}>
        <button onClick={() => fromZeels ? navigate('/zeels', { state: { zeelIndex } }) : navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: sub, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>
          <ArrowLeft size={17} /> {fromZeels ? 'Back to Zeels' : 'Back'}
        </button>
      </div>

      {/* Image Gallery */}
      <div style={{ position: 'relative', background: '#000' }}>
        <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
          <img src={images[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Fav button */}
          <button onClick={() => toggleFavorite(product.id)} style={{ position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Heart size={18} style={isFav ? { color: '#ec4899', fill: '#ec4899' } : { color: '#fff' }} />
          </button>
          {/* Country badge */}
          {product.country && (
            <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.65)', borderRadius: 7, padding: '3px 8px' }}>
              <img src={isChinese ? '/images/china.png' : '/images/pakistan.png'} alt="" style={{ width: 16, height: 11, objectFit: 'contain' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: isChinese ? '#f87171' : '#4ade80', textTransform: 'uppercase' }}>{product.country}</span>
            </div>
          )}
          {/* Prev/Next arrows */}
          {images.length > 1 && (
            <>
              <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setActiveImg(i => (i + 1) % images.length)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 7, padding: '10px 14px', background: surface, borderBottom: `1px solid ${border}`, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)} style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 9, overflow: 'hidden', border: `2px solid ${i === activeImg ? accent : border}`, padding: 0, cursor: 'pointer', background: 'none' }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: '16px 16px 0' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{product.category}</span>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: textC, margin: '5px 0 8px', lineHeight: 1.3 }}>{product.name}</h1>
        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3,4,5].map(s => <Star key={s} size={14} style={{ color: s <= Math.round(avgRating) ? '#f59e0b' : '#333', fill: s <= Math.round(avgRating) ? '#f59e0b' : 'none' }} />)}
          </div>
          <span style={{ fontSize: 12, color: sub }}>{avgRating.toFixed(1)} · {product.ratings?.length || 0} reviews</span>
        </div>
        {/* Price */}
        <p style={{ fontSize: 26, fontWeight: 900, color: textC, margin: '0 0 14px', letterSpacing: '-0.02em' }}>{formatPrice(currentPrice)}</p>

        {/* Stock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOos ? '#ef4444' : '#16a34a' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: isOos ? '#ef4444' : '#16a34a' }}>{isOos ? 'Out of Stock' : `${product.stock} in stock`}</span>
        </div>

        {/* Variants — deduplicate same type — ABOVE description */}
        {product.variants && product.variants.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {Array.from(new Map(product.variants.map(v => [v.type, v])).entries()).map(([type]) => {
              const allOpts = product.variants!.filter(vv => vv.type === type).flatMap(vv => vv.options);
              const seen = new Set<string>();
              const uniqueOpts = allOpts.filter((opt: any) => {
                const val = typeof opt === 'string' ? opt : opt.value;
                if (seen.has(val)) return false;
                seen.add(val);
                return true;
              });
              return (
                <div key={type} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: sub, textTransform: 'uppercase', margin: '0 0 9px' }}>
                    {type}: <span style={{ color: accent }}>{selectedVariants[type]}</span>
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {uniqueOpts.map((opt: any, i: number) => {
                      const val = typeof opt === 'string' ? opt : opt.value;
                      const optPrice = typeof opt === 'object' && opt.price > 0 ? opt.price : null;
                      const active = selectedVariants[type] === val;
                      return (
                        <button key={i} onClick={() => setSelectedVariants(p => ({ ...p, [type]: val }))} style={{
                          padding: '8px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: active ? accent : surface, color: active ? '#fff' : sub,
                          border: `1.5px solid ${active ? accent : border}`,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48,
                        }}>
                          <span>{val}</span>
                          {optPrice && <span style={{ fontSize: 10, opacity: 0.8 }}>Rs. {optPrice.toLocaleString()}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Description */}
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: '13px', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 7px' }}>Description</p>
          <p style={{ fontSize: 13, color: sub, margin: 0, lineHeight: 1.7 }}>{product.description}</p>
        </div>

        {/* Delivery info */}
        {isChinese && (
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '13px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#f87171', margin: '0 0 9px' }}>🇨🇳 China Direct — What to expect</p>
            {[['✈️','Delivery in 7–13 business days'],['📦','Flat PKR 99 shipping'],['🔒','Prepaid payment only']].map(([emoji, label]) => (
              <p key={label} style={{ fontSize: 12, color: sub, margin: '0 0 4px', display: 'flex', gap: 7, alignItems: 'center' }}><span>{emoji}</span>{label}</p>
            ))}
          </div>
        )}
        {isMallProduct && (
          <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12, padding: '13px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', margin: '0 0 9px' }}>🇵🇰 Pakistan Delivery</p>
            {[['🚚','Delivery in 3–5 days · PKR 165'],['💵','Cash on Delivery available'],['🔄','7-day easy returns']].map(([emoji, label]) => (
              <p key={label} style={{ fontSize: 12, color: sub, margin: '0 0 4px', display: 'flex', gap: 7, alignItems: 'center' }}><span>{emoji}</span>{label}</p>
            ))}
          </div>
        )}

        {/* Reviews */}
        {product.reviews && product.reviews.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: textC, margin: '0 0 12px' }}>Reviews ({product.reviews.length})</p>
            {product.reviews.slice(0, 3).map((rev: any, i: number) => (
              <div key={i} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: '12px', marginBottom: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                  <img src={rev.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.userName}`} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: textC, margin: '0 0 2px' }}>{rev.userName}</p>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} style={{ color: s <= rev.rating ? '#f59e0b' : '#333', fill: s <= rev.rating ? '#f59e0b' : 'none' }} />)}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: sub, margin: 0, lineHeight: 1.6 }}>{rev.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add review */}
        {currentUser && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: textC, margin: '0 0 12px' }}>Write a Review</p>
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setReviewRating(s)} style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Star size={24} style={{ color: s <= reviewRating ? '#f59e0b' : '#333', fill: s <= reviewRating ? '#f59e0b' : 'none' }} />
                  </button>
                ))}
              </div>
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} placeholder="Share your experience..."
                style={{ width: '100%', padding: '10px 12px', background: surface, border: `1px solid ${border}`, borderRadius: 9, fontSize: 13, color: textC, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              <button type="submit" disabled={reviewRating === 0 || !reviewComment.trim()} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 9, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: reviewRating === 0 || !reviewComment.trim() ? 0.4 : 1 }}>
                Submit Review
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Fixed bottom action bar — zIndex 55, paddingBottom accounts for mobile bottom nav (60px) */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: bg, borderTop: `1px solid ${border}`,
        padding: '10px 14px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom) + 60px)',
        display: 'flex', gap: 10, zIndex: 55,
      }}>
        <button onClick={handleAddToCart} disabled={isAdding || isOos} style={{
          flex: 1, padding: '13px 0', background: addedCart ? '#16a34a' : isOos ? '#2a2a2a' : surface,
          border: `1.5px solid ${addedCart ? '#16a34a' : isOos ? border : accent + '60'}`,
          borderRadius: 11, color: isOos ? sub : addedCart ? '#fff' : accent,
          fontWeight: 700, fontSize: 14, cursor: isOos ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}>
          {addedCart ? <><Check size={16} /> Added!</> : isAdding ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><ShoppingCart size={16} /> Add to Cart</>}
        </button>
        <button onClick={handleShopNow} disabled={isAdding || isOos} style={{
          flex: 1, padding: '13px 0',
          background: isOos ? '#2a2a2a' : 'linear-gradient(135deg,#f59e0b,#d97706)',
          border: 'none', borderRadius: 11, color: isOos ? sub : '#000',
          fontWeight: 800, fontSize: 14, cursor: isOos ? 'not-allowed' : 'pointer',
        }}>
          {isOos ? 'Out of Stock' : 'Shop Now ⚡'}
        </button>
      </div>
    </div>
  );
};

const VideoSlide: React.FC<{ src: string; isActive: boolean }> = ({ src, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (isActive && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented
          setIsPlaying(false);
        });
      }
      setIsPlaying(true);
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="w-full h-full relative group/video">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover opacity-90 group-hover/video:opacity-100 transition-opacity duration-500"
        loop
        muted={isMuted}
        playsInline
      />
      <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/40 transition-colors duration-500 flex items-center justify-center opacity-0 group-hover/video:opacity-100">
        <button
          onClick={togglePlay}
          className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-amber-500 hover:text-black hover:scale-110 hover:border-amber-500 transition-all duration-300 shadow-2xl"
        >
          {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>
      </div>
      <div className="absolute bottom-8 right-8 opacity-0 group-hover/video:opacity-100 transition-all duration-500 translate-y-4 group-hover/video:translate-y-0">
        <button
          onClick={toggleMute}
          className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-white hover:text-black transition-all"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>
    </div>
  );
};

const COLOR_MAP: Record<string, string> = {
  'Midnight Black': '#0a0a0a',
  'Starlight Silver': '#e5e7eb',
  'Deep Sea Blue': '#1e3a8a',
  'Carbon Dark': '#1f2937',
  'Ivory White': '#f9fafb',
  'Desert Sand': '#d2b48c',
  'Arctic White': '#ffffff',
  'Obsidian Black': '#000000',
  'Ceramic White': '#ffffff',
  'Slate Grey': '#4b5563',
  'Gold': '#d4af37',
  'Rose Gold': '#b76e79'
};

const RatingStars: React.FC<{ rating: number; onRate?: (rate: number) => void; size?: number }> = ({ rating, onRate, size = 16 }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`transition-all duration-500 transform ${onRate ? 'hover:scale-150 active:scale-95' : ''
            } ${(hovered || rating) >= star
              ? 'text-amber-500 fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
              : 'text-gray-800'
            }`}
        >
          <Star size={onRate ? size + 8 : size} />
        </button>
      ))}
    </div>
  );
};

const Plus: React.FC<{ size?: number, className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export const ProductDetail: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileProductDetail />;

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { products, addToCart, addReview, currentUser, favorites, toggleFavorite, formatPrice } = useStore();
  const product = products.find((p) => p.id === id);

  // Check if user came from Zeels page
  const fromZeels = (location.state as any)?.fromZeels;
  const zeelIndex = (location.state as any)?.zeelIndex;

  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showShopSuccess, setShowShopSuccess] = useState(false);
  const [showCartSuccess, setShowCartSuccess] = useState(false);
  const [showFavoriteSuccess, setShowFavoriteSuccess] = useState(false);
  const [showFavoriteRemove, setShowFavoriteRemove] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewsPopup, setShowReviewsPopup] = useState(false);
  const [selectedReviewImage, setSelectedReviewImage] = useState<string | null>(null);
  const [selectedProductImage, setSelectedProductImage] = useState<string | null>(null);
  const reviewFileInputRef = useRef<HTMLInputElement>(null);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product, products]);

  const isFav = product ? favorites.includes(product.id) : false;

  const productImages = product ? (() => {
    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    const videos = product.videos?.map((v: any) => v.videoUrl) || [];
    return [...images, ...videos];
  })() : [];

  useEffect(() => {
    if (product?.variants) {
      const initial: Record<string, string> = {};
      product.variants.forEach(v => {
        const firstOpt = v.options[0];
        initial[v.type] = typeof firstOpt === 'string' ? firstOpt : (firstOpt as any).value;
      });
      setSelectedVariants(initial);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#010409] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-8 border border-amber-500/20">
          <Fingerprint size={40} className="text-amber-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-6">Asset Missing from Registry</h2>
        <button onClick={() => navigate('/shop')} className="px-10 py-4 glass border-white/10 text-amber-500 font-black uppercase text-[10px] tracking-widest hover:bg-amber-500 hover:text-black transition-all rounded-full">
          Return to Vault
        </button>
      </div>
    );
  }

  const averageRating = product.ratings?.length
    ? product.ratings.reduce((a, b) => a + b, 0) / product.ratings.length
    : 0;

  // Resolve current price based on selected variants
  const currentPrice = (() => {
    if (!product.variants?.length) return product.price;
    for (const variant of product.variants) {
      const selectedVal = selectedVariants[variant.type];
      if (!selectedVal) continue;
      const matched = variant.options.find(o =>
        (typeof o === 'string' ? o : (o as any).value) === selectedVal
      );
      if (!matched) continue;
      const customPrice = typeof matched === 'object' ? (matched as any).price : undefined;
      if (customPrice != null && customPrice > 0) return customPrice;
    }
    return product.price;
  })();

  const handleShopNow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setIsAddingToCart(true);
    await addToCart(product, selectedVariants, currentPrice);
    setShowShopSuccess(true);
    setTimeout(() => {
      setShowShopSuccess(false);
      navigate('/cart');
    }, 1500);
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setIsAddingToCart(true);
    await addToCart(product, selectedVariants, currentPrice);
    setIsAddingToCart(false);
    setShowCartSuccess(true);
    setTimeout(() => setShowCartSuccess(false), 3000);
  };

  const nextImage = () => setActiveImage((prev) => (prev + 1) % productImages.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + productImages.length) % productImages.length);

  const handleVariantSelect = (type: string, option: string) => {
    setSelectedVariants(prev => ({ ...prev, [type]: option }));
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(async (file) => {
      try {
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(file);
        setReviewImages(prev => [...prev, cloudinaryUrl]);
      } catch (error) {
        console.error('Failed to upload review image to Cloudinary:', error);
        // Fallback to base64 if Cloudinary fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setReviewImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeReviewImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || reviewRating === 0 || !reviewComment.trim()) return;
    addReview(product.id, {
      userName: currentUser.name,
      rating: reviewRating,
      comment: reviewComment,
      images: reviewImages
    });
    setReviewRating(0);
    setReviewComment('');
    setReviewImages([]);
  };

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Check if product is already in favorites
    const wasInFavorites = isFav;
    
    await toggleFavorite(product.id);
    
    // Show appropriate animation based on previous state
    if (wasInFavorites) {
      setShowFavoriteRemove(true);
      setShowFavoriteSuccess(false);
      setTimeout(() => setShowFavoriteRemove(false), 3000);
    } else {
      setShowFavoriteSuccess(true);
      setShowFavoriteRemove(false);
      setTimeout(() => setShowFavoriteSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#010409] text-white pt-24 pb-32 relative selection:bg-amber-500 selection:text-black">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[70vw] h-[70vw] bg-amber-500/[0.03] blur-[180px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-blue-600/[0.02] blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex items-center justify-between mb-16">
          <button 
            onClick={() => {
              if (fromZeels && zeelIndex !== undefined) {
                navigate('/zeels', { state: { zeelIndex } });
              } else {
                navigate('/shop');
              }
            }}
            className="inline-flex items-center gap-3 text-gray-500 hover:text-amber-500 transition-all group font-black text-[10px] uppercase tracking-[0.4em]"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            {fromZeels ? 'Back to Zeels' : 'Back to Catalog'}
          </button>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] text-gray-700">
            Node Identity: <span className="text-white">{product.id.toUpperCase()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          {/* Asset Visualization */}
          {/* Asset Visualization */}
          <div className="space-y-12">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 via-transparent to-blue-600/10 rounded-[4rem] blur-[60px] opacity-0 group-hover:opacity-100 transition duration-1000"></div>

              <div className="relative glass-dark rounded-[4rem] overflow-hidden aspect-square border border-white/5 group shadow-[0_40px_100px_rgba(0,0,0,0.8)] bg-black">
                <div
                  className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{ transform: `translateX(-${activeImage * 100}%)` }}
                >
                  {productImages.map((media, idx) => {
                    const isVideo = media.startsWith('data:video') || media.match(/\.(mp4|webm|mov)$/i);
                    return (
                      <div key={idx} className="w-full h-full flex-shrink-0 relative group/img">
                        {isVideo ? (
                          <VideoSlide src={media} isActive={activeImage === idx} />
                        ) : (
                          <img
                            src={media}
                            alt=""
                            className="w-full h-full object-cover opacity-80 group-hover/img:scale-[1.12] group-hover/img:opacity-100 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-zoom-in"
                            onClick={() => setSelectedProductImage(media)}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                      </div>
                    );
                  })}
                </div>

                {productImages.length > 1 && (
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
                    <button onClick={prevImage} className="p-6 glass-dark rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-amber-500 hover:text-black transition-all duration-500 pointer-events-auto shadow-2xl backdrop-blur-2xl border border-white/10 active:scale-90">
                      <ChevronLeft size={28} />
                    </button>
                    <button onClick={nextImage} className="p-6 glass-dark rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-amber-500 hover:text-black transition-all duration-500 pointer-events-auto shadow-2xl backdrop-blur-2xl border border-white/10 active:scale-90">
                      <ChevronRight size={28} />
                    </button>
                  </div>
                )}

                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                  {productImages.map((_, idx) => (
                    <button key={idx} onClick={() => setActiveImage(idx)} className={`h-1.5 rounded-full transition-all duration-700 ${activeImage === idx ? 'w-16 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]' : 'w-3 bg-white/20 hover:bg-white/40'}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              {productImages.map((media, i) => {
                const isVideo = media.startsWith('data:video') || media.match(/\.(mp4|webm|mov)$/i);
                return (
                  <button key={i} onClick={() => setActiveImage(i)} className={`glass-dark rounded-[1.75rem] aspect-square overflow-hidden transition-all duration-700 relative border-2 ${activeImage === i ? 'border-amber-500 scale-95 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'border-white/5 opacity-40 hover:opacity-100 hover:border-white/20'}`}>
                    {isVideo ? (
                      <div className="w-full h-full relative">
                        <video src={media} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Play size={20} className="fill-white text-white" /></div>
                      </div>
                    ) : (
                      <img src={media} className="w-full h-full object-cover" alt="" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* China Product Key Points */}
            {product.country === 'china' && (
              <div className="mt-8 p-6 glass-dark rounded-[2rem] border border-red-500/10 relative overflow-hidden">
                {/* Subtle red glow top */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>

                <div className="flex items-center gap-3 mb-6">
                  <span className="text-lg">🇨🇳</span>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-red-400">China Direct — What to Expect</h3>
                  <div className="h-px flex-grow bg-gradient-to-r from-red-500/30 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Point 1 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-red-500/20 transition-all duration-300 group/point">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 group-hover/point:bg-red-500/20 transition-all duration-300">
                      <span className="text-lg">✈️</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-wide mb-1">Directly from China</p>
                      <p className="text-gray-400 text-xs leading-relaxed">Delivered directly from China in <span className="text-red-400 font-bold">7–13 business days</span>.</p>
                    </div>
                  </div>

                  {/* Point 2 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-all duration-300 group/point">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover/point:bg-amber-500/20 transition-all duration-300">
                      <span className="text-lg">📦</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-wide mb-1">Flat Shipping Fee</p>
                      <p className="text-gray-400 text-xs leading-relaxed">Shipping charges are <span className="text-amber-400 font-bold">PKR 99 per order</span> — no hidden costs.</p>
                    </div>
                  </div>

                  {/* Point 3 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-all duration-300 group/point">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover/point:bg-blue-500/20 transition-all duration-300">
                      <span className="text-lg">🛍️</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-wide mb-1">Better Imported Products</p>
                      <p className="text-gray-400 text-xs leading-relaxed">Access <span className="text-blue-400 font-bold">better variety, unique styles</span>, and imported products from China.</p>
                    </div>
                  </div>

                  {/* Point 4 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-green-500/20 transition-all duration-300 group/point">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 group-hover/point:bg-green-500/20 transition-all duration-300">
                      <span className="text-lg">🔒</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-wide mb-1">Prepaid Payment Only</p>
                      <p className="text-gray-400 text-xs leading-relaxed">Pay securely online using <span className="text-green-400 font-bold">card, bank transfer, or mobile wallet</span>.</p>
                    </div>
                  </div>

                  {/* Point 5 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all duration-300 group/point">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover/point:bg-purple-500/20 transition-all duration-300">
                      <span className="text-lg">📍</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-wide mb-1">Order Tracking</p>
                      <p className="text-gray-400 text-xs leading-relaxed">Track your order <span className="text-purple-400 font-bold">from dispatch to delivery</span> in real time.</p>
                    </div>
                  </div>
                </div>

                {/* Bottom glow */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
              </div>
            )}

            {/* Pakistan Product Key Points */}
            {product.country === 'pakistan' && (
              <div className="mt-8 p-6 glass-dark rounded-[2rem] border border-emerald-500/10 relative overflow-hidden">
                {/* Top line */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-lg">🇵🇰</span>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400">Pakistan Delivery — What to Expect</h3>
                  <div className="h-px flex-grow bg-gradient-to-r from-emerald-500/30 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 gap-4">

                  {/* Delivery Info */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all duration-300 group/point">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover/point:bg-emerald-500/20 transition-all duration-300">
                      <span className="text-lg">🚚</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-black text-sm uppercase tracking-wide mb-1">Delivery in 3-5 Days <span className="text-emerald-400">| Charges PKR 165</span></p>
                      <p className="text-gray-400 text-xs leading-relaxed mb-3">Aik he Catalog ke multiple items agar aap <span className="text-white font-bold">"Add to Cart"</span> kar ke aik he address per order karein ge tou un multiple items per <span className="text-emerald-400 font-bold">aik he delivery charges</span> lage ge.</p>
                      <p className="text-gray-500 text-xs leading-relaxed">Agar alag alag order lagain ge tou sab per alag alag delivery charges lagein ge.</p>

                      {/* Courier Grid */}
                      <div className="grid grid-cols-5 gap-2 mt-4">
                        {[
                          { name: 'Leopards', price: 'PKR 165' },
                          { name: 'PostEx', price: 'PKR 165' },
                          { name: 'EasyShip', price: 'PKR 165' },
                          { name: 'Tranzo', price: 'PKR 165' },
                          { name: 'Dex', price: 'PKR 165' },
                        ].map((courier, i) => (
                          <div key={i} className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/20 transition-all">
                            <p className="text-white font-black text-[10px] leading-tight mb-0.5">{courier.name}</p>
                            <p className="text-emerald-400 text-[9px] font-bold">{courier.price}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Return Policy */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-all duration-300 group/point">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover/point:bg-amber-500/20 transition-all duration-300">
                      <span className="text-lg">🔄</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-wide mb-2">Return Allowed Within <span className="text-amber-400">7 Days</span></p>
                      <p className="text-gray-400 text-xs leading-relaxed mb-2">Order ghalat, mukhtalif ya na-mukamal deliver hone ki surat mein return ki darkhast <span className="text-amber-400 font-bold">saat (7) din</span> k andar de ja sakti hai.</p>
                      <p className="text-gray-400 text-xs leading-relaxed">Return k liyay <span className="text-white font-bold">Markaz App</span> ke Order screen pe apne order k sath moujood <span className="text-amber-400 font-bold">Return button</span> click karain.</p>
                    </div>
                  </div>

                </div>

                {/* Bottom glow */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
              </div>
            )}
          </div>

          {/* Asset Configuration Terminal */}
          <div className="flex flex-col py-4">
            <div className="flex flex-wrap items-center gap-6 mb-8">
              <span className="px-5 py-2 glass-dark border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.5em] rounded-full flex items-center gap-3 shadow-lg">
                <Award size={14} className="animate-pulse" /> Certified Acquisition
              </span>
              
              {product.country && (
                <div className={`px-5 py-2 glass-dark border-[1px] rounded-full flex items-center gap-3 shadow-lg transition-all duration-500 hover:scale-105 ${product.country === 'china' ? 'border-red-500/30 text-red-500' : 'border-emerald-500/30 text-emerald-500'}`}>
                  <img src={product.country === 'china' ? "/images/china.png" : "/images/pakistan.png"} className="w-5 h-3.5 object-contain" alt={product.country} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">{product.country === 'china' ? 'China Collab' : 'Pakistan Made'}</span>
                </div>
              )}

              <div className="h-px flex-grow bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>

            <div className="flex justify-between items-start gap-4 mb-8">
              <h1 className="text-3xl md:text-5xl font-black leading-[0.85] text-white tracking-tighter uppercase">{product.name}</h1>
              <div className="relative">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-6 rounded-[2rem] glass-dark border transition-all duration-500 shadow-xl group/fav relative overflow-hidden ${isFav ? 'border-pink-500/40 text-pink-500 bg-pink-500/5' : 'border-white/5 text-gray-600 hover:border-pink-500/40 hover:text-pink-400'
                    }`}
                >
                  {/* Animated background for success state */}
                  {showFavoriteSuccess && (
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 via-rose-500/20 to-pink-500/30 animate-pulse rounded-[2rem]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute w-20 h-20 bg-pink-400/20 rounded-full animate-ping"></div>
                        <div className="absolute w-16 h-16 bg-rose-400/20 rounded-full animate-ping" style={{animationDelay: '200ms'}}></div>
                      </div>
                      {/* Heart particles */}
                      <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                        <div className="absolute top-1/4 left-1/4 text-pink-400 text-xs animate-bounce">❤️</div>
                        <div className="absolute top-3/4 right-1/4 text-rose-400 text-xs animate-bounce" style={{animationDelay: '300ms'}}>💕</div>
                        <div className="absolute top-1/2 left-3/4 text-pink-300 text-xs animate-bounce" style={{animationDelay: '600ms'}}>💖</div>
                        <div className="absolute bottom-1/4 left-1/2 text-rose-300 text-xs animate-bounce" style={{animationDelay: '900ms'}}>💗</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Remove animation */}
                  {showFavoriteRemove && (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-red-600/20 to-red-500/30 animate-pulse rounded-[2rem]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute w-20 h-20 bg-red-400/20 rounded-full animate-ping"></div>
                        <div className="absolute w-16 h-16 bg-red-600/20 rounded-full animate-ping" style={{animationDelay: '200ms'}}></div>
                      </div>
                      {/* Remove particles */}
                      <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                        <div className="absolute top-1/4 left-1/4 text-red-400 text-xs animate-bounce">💔</div>
                        <div className="absolute top-3/4 right-1/4 text-red-600 text-xs animate-bounce" style={{animationDelay: '300ms'}}>❌</div>
                        <div className="absolute top-1/2 left-3/4 text-red-300 text-xs animate-bounce" style={{animationDelay: '600ms'}}>🗑️</div>
                        <div className="absolute bottom-1/4 left-1/2 text-red-500 text-xs animate-bounce" style={{animationDelay: '900ms'}}>✖️</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Heart icon with animations */}
                  <div className="relative z-10">
                    {showFavoriteSuccess ? (
                      <div className="relative">
                        <Heart 
                          size={28} 
                          className="fill-current animate-bounce drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] transition-all duration-500" 
                        />
                        {/* Heart sparkles */}
                        <div className="absolute -top-1 -right-1 text-pink-400 text-xs animate-pulse">✨</div>
                        <div className="absolute -bottom-1 -left-1 text-rose-400 text-xs animate-pulse" style={{animationDelay: '200ms'}}>✨</div>
                        {/* Floating hearts */}
                        <div className="absolute -top-2 -right-2 text-pink-300 text-xs animate-bounce">💕</div>
                      </div>
                    ) : showFavoriteRemove ? (
                      <div className="relative">
                        <Heart 
                          size={28} 
                          className="text-red-400 animate-bounce drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] transition-all duration-500" 
                        />
                        {/* Remove sparkles */}
                        <div className="absolute -top-1 -right-1 text-red-400 text-xs animate-pulse">💔</div>
                        <div className="absolute -bottom-1 -left-1 text-red-600 text-xs animate-pulse" style={{animationDelay: '200ms'}}>❌</div>
                        {/* Remove icon */}
                        <div className="absolute -top-2 -right-2 text-red-500 text-xs animate-bounce">✖️</div>
                      </div>
                    ) : (
                      <Heart 
                        size={28} 
                        className={`${isFav ? 'fill-current' : ''} transition-all duration-300 ${isFav ? 'animate-pulse' : 'group-hover/fav:scale-110 group-hover/fav:rotate-12'}`} 
                      />
                    )}
                  </div>
                  
                  {/* Hover glow effect */}
                  <div className="absolute -inset-1 bg-pink-500/10 rounded-[2rem] blur-xl opacity-0 group-hover/fav:opacity-100 transition-opacity duration-500"></div>
                </button>
                
                {/* Success tooltip */}
                {(showFavoriteSuccess || showFavoriteRemove) && (
                  <div className="absolute -top-12 right-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-bounce shadow-lg">
                    {showFavoriteSuccess ? (isFav ? 'Loved!' : 'Added to Wishlist!') : 'Removed from Wishlist'}
                    <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-pink-500"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-12 mb-12 py-6 border-y border-white/5">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Asset Integrity</p>
                <div className="flex items-center gap-4">
                  <RatingStars rating={Math.round(averageRating)} />
                  <span className="text-xs font-black text-amber-500/60 uppercase tracking-widest">{averageRating?.toFixed(1) || "0.0"} Protocol Score</span>
                </div>
              </div>
              <div className="w-px h-12 bg-white/10 hidden md:block"></div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Vault Status</p>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                  <p className="text-sm font-black text-white uppercase tracking-widest">{product.stock} Units Available</p>
                </div>
              </div>
            </div>

            <div className="mb-14">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.6em] mb-4">Market Valuation</p>
              <div className="flex items-baseline gap-4">
                <p className="text-5xl md:text-6xl font-black tracking-tighter text-white font-display">
                  {formatPrice(currentPrice)}
                </p>
                {currentPrice !== product.price && (
                  <span className="text-gray-500 text-lg line-through font-mono">{formatPrice(product.price)}</span>
                )}
                <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest border-l border-white/10 pl-6 h-8 flex items-center">Excl. Regional Tariffs</span>
              </div>
            </div>

            <div className="p-10 glass-dark rounded-[3rem] border-white/5 mb-14 relative overflow-hidden group/desc shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover/desc:opacity-100 transition-opacity duration-700"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.05] blur-[100px] pointer-events-none transition-all duration-1000 group-hover/desc:bg-amber-500/[0.12] group-hover/desc:scale-110"></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px w-8 bg-amber-500/50"></div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500/80">Technical Specifications</h3>
                <div className="h-px flex-grow bg-gradient-to-r from-amber-500/50 to-transparent"></div>
              </div>

              <div className="space-y-6">
                {product.description.includes('\n') || product.description.includes('•') || product.description.includes('- ') ? (
                  product.description.split(/\n|•|- /).filter(line => line.trim().length > 0).map((line, index) => (
                    <div key={index} className="flex items-start gap-6 group/item relative">
                      <div className="relative mt-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] group-hover/item:scale-150 transition-all duration-500"></div>
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-20"></div>
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-gray-300 text-lg leading-relaxed font-semibold tracking-wide transition-all group-hover/item:text-white group-hover/item:translate-x-1 duration-500">
                          {line.trim()}
                        </p>
                        <div className="h-px w-0 bg-gradient-to-r from-amber-500/20 to-transparent group-hover/item:w-full transition-all duration-700"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-gray-300 text-xl leading-relaxed font-medium italic opacity-90 group-hover/desc:opacity-100 transition-all font-serif">
                      "{product.description}"
                    </p>
                    <div className="absolute -left-2 top-0 text-4xl text-amber-500/20 font-serif">"</div>
                  </div>
                )}
              </div>

              {/* Decorative corner element */}
              <div className="absolute bottom-0 right-0 p-4 opacity-20 group-hover/desc:opacity-100 transition-opacity duration-700">
                <div className="w-12 h-12 border-r-2 border-b-2 border-amber-500/30 rounded-br-2xl"></div>
              </div>
            </div>

            {/* Premium Variant Matrix */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-14 mb-20">
                {(product.variants.reduce((acc: any[], curr) => {
                  const existing = acc.find(v => v.type === curr.type);
                  if (existing) {
                    existing.options = [...new Set([...existing.options, ...curr.options])];
                  } else {
                    acc.push({ ...curr, options: [...curr.options] });
                  }
                  return acc;
                }, [])).map((v) => (
                  <div key={v.type} className="space-y-8">
                    <div className="flex justify-between items-center px-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-600 flex items-center gap-4">
                        <Target size={14} className="text-amber-500" /> {v.type} Protocol
                      </h3>
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-5 py-2 rounded-full border border-amber-500/20 shadow-md">{selectedVariants[v.type]}</span>
                    </div>

                    <div className="flex flex-wrap gap-5">
                      {v.options.map((option: any, oi: number) => {
                        const optVal = typeof option === 'string' ? option : option.value;
                        const optPrice = typeof option === 'object' && option.price > 0 ? option.price : null;
                        const isSelected = selectedVariants[v.type] === optVal;

                        if (v.type === 'Color') {
                          return (
                            <button
                              key={oi}
                              onClick={() => handleVariantSelect(v.type, optVal)}
                              className={`min-w-[8rem] px-8 py-5 rounded-[2rem] border transition-all duration-700 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 relative overflow-hidden group ${isSelected
                                ? 'bg-white text-black border-white shadow-[0_20px_50px_rgba(255,255,255,0.15)]'
                                : 'glass-dark border-white/5 text-gray-500 hover:text-white hover:border-white/20'
                                }`}
                            >
                              <span className="relative z-10">{optVal}</span>
                              {optPrice && (
                                <span className={`text-[9px] font-bold ${isSelected ? 'text-amber-600' : 'text-amber-400'}`}>
                                  Rs. {optPrice.toLocaleString()}
                                </span>
                              )}
                              {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </button>
                          );
                        }

                        return (
                          <button
                            key={oi}
                            onClick={() => handleVariantSelect(v.type, optVal)}
                            className={`min-w-[8rem] px-8 py-5 rounded-[2rem] border transition-all duration-700 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 relative overflow-hidden group ${isSelected
                              ? 'bg-white text-black border-white shadow-[0_20px_50px_rgba(255,255,255,0.15)]'
                              : 'glass-dark border-white/5 text-gray-500 hover:text-white hover:border-white/20'
                              }`}
                          >
                            <span className="relative z-10">{optVal}</span>
                            {optPrice && (
                              <span className={`text-[9px] font-bold ${isSelected ? 'text-amber-600' : 'text-amber-400'}`}>
                                Rs. {optPrice.toLocaleString()}
                              </span>
                            )}
                            {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Terminal */}
            <div className="flex flex-col sm:flex-row gap-6">
              <button
                onClick={handleShopNow}
                disabled={isAddingToCart || showShopSuccess}
                className="group relative flex-grow h-24 bg-gradient-to-r from-amber-500 to-amber-700 text-black rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.6em] transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-[0_30px_60px_rgba(245,158,11,0.3)] overflow-hidden flex items-center justify-center gap-5 disabled:opacity-50 disabled:cursor-not-allowed transform-gpu"
                style={{transformStyle: 'preserve-3d', perspective: '1000px'}}
              >
                {/* Dynamic background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Advanced shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[800ms] cubic-bezier(0.25, 0.46, 0.45, 0.94)"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-200/30 to-transparent translate-y-[100%] group-hover:translate-y-[-100%] transition-transform duration-[1000ms] cubic-bezier(0.25, 0.46, 0.45, 0.94)"></div>
                
                {/* Magnetic border effect */}
                <div className="absolute inset-0 rounded-[2.5rem] border-2 border-transparent bg-gradient-to-r from-amber-400/50 via-amber-500/50 to-amber-600/50 bg-clip-border opacity-0 group-hover:opacity-100 transition-all duration-500 scale-105"></div>
                
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-200 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-ping"></div>
                  <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-ping" style={{animationDelay: '150ms'}}></div>
                  <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-amber-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-ping" style={{animationDelay: '300ms'}}></div>
                  <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-ping" style={{animationDelay: '450ms'}}></div>
                </div>
                
                {/* 3D rotating elements */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute w-32 h-32 border-2 border-amber-400/20 rounded-full group-hover:rotate-180 transition-transform duration-[2000ms]"></div>
                  <div className="absolute w-24 h-24 border border-amber-300/20 rounded-full group-hover:-rotate-180 transition-transform duration-[2500ms]"></div>
                </div>
                
                {/* Pulse wave effect */}
                <div className="absolute inset-0 bg-amber-400/30 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-[2.5rem] group-hover:opacity-0">
                  <div className="absolute inset-0 bg-amber-400/30 scale-0 group-hover:scale-150 transition-transform duration-1000 rounded-[2.5rem] group-hover:opacity-0"></div>
                </div>
                
                {/* Button content with 3D effect */}
                <span className="relative z-10 flex items-center gap-3 transform-gpu group-hover:translate-z-10 transition-transform duration-300">
                  {showShopSuccess ? (
                    <>
                      <Check size={24} className="animate-bounce drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                      <span className="animate-pulse">Success!</span>
                    </>
                  ) : isAddingToCart ? (
                    <>
                      <Loader2 className="animate-spin drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" size={20} />
                      <span className="animate-pulse">Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="group-hover:scale-110 transition-transform duration-300">Shop Now</span>
                      <Zap size={22} className="fill-current group-hover:scale-125 group-hover:rotate-12 group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] transition-all duration-300" />
                    </>
                  )}
                </span>
                
                {/* Success overlay with particles */}
                {showShopSuccess && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 animate-pulse rounded-[2.5rem]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-40 h-40 bg-green-400/20 rounded-full animate-ping"></div>
                    </div>
                  </div>
                )}
                
                {/* Dynamic glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/30 via-amber-400/20 to-amber-500/30 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse"></div>
                
                {/* Hover shadow effect */}
                <div className="absolute inset-0 bg-black/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0"></div>
              </button>

              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || showCartSuccess}
                className="group relative flex-grow h-24 glass-dark border-white/10 hover:border-amber-500/60 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.5em] transition-all duration-300 hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-5 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transform-gpu"
                style={{transformStyle: 'preserve-3d', perspective: '1000px'}}
              >
                {/* Dynamic border gradient */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-amber-500/30 via-transparent to-amber-500/30 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-105"></div>
                <div className="absolute inset-0 rounded-[2.5rem] border-2 border-transparent bg-gradient-to-r from-amber-400/30 via-amber-500/30 to-amber-600/30 bg-clip-border opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                
                {/* Advanced particle system */}
                <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-ping"></div>
                  <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-amber-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-ping" style={{animationDelay: '100ms'}}></div>
                  <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-ping" style={{animationDelay: '200ms'}}></div>
                  <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-amber-200 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-ping" style={{animationDelay: '300ms'}}></div>
                  <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-ping" style={{animationDelay: '400ms'}}></div>
                </div>
                
                {/* Geometric patterns */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute w-36 h-36 border border-amber-400/20 rotate-45 group-hover:rotate-180 transition-transform duration-[3000ms]"></div>
                  <div className="absolute w-28 h-28 border border-amber-300/20 -rotate-45 group-hover:-rotate-180 transition-transform duration-[3500ms]"></div>
                </div>
                
                {/* Ripple wave effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-[2.5rem] opacity-0 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 scale-0 group-hover:scale-150 transition-transform duration-1000 rounded-[2.5rem] opacity-0 group-hover:opacity-0"></div>
                </div>
                
                {/* Magnetic field effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-blue-500/10 scale-0 group-hover:scale-100 transition-transform duration-800 rounded-[2.5rem] opacity-0 group-hover:opacity-100"></div>
                
                {/* Button content with 3D effect */}
                <span className="relative z-10 flex items-center gap-3 transform-gpu group-hover:translate-z-10 transition-transform duration-300">
                  {showCartSuccess ? (
                    <div className="flex items-center gap-3">
                      {/* Animated Cart Icon */}
                      <div className="relative">
                        <ShoppingCart 
                          size={22} 
                          className="animate-bounce drop-shadow-[0_0_15px_rgba(34,197,94,0.8)] transition-all duration-500" 
                        />
                        {/* Cart lid opening animation */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                        {/* Plus sign appearing */}
                        <div className="absolute -top-2 -right-2 text-green-400 text-xs font-black animate-bounce">+</div>
                      </div>
                      {/* Animated text */}
                      <span className="animate-pulse font-bold">Added to Cart!</span>
                    </div>
                  ) : isAddingToCart ? (
                    <div className="flex items-center gap-3">
                      {/* Cart with loading animation */}
                      <div className="relative">
                        <ShoppingCart 
                          size={22} 
                          className="animate-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-300" 
                        />
                        {/* Loading dots */}
                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                          <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                      </div>
                      <span className="animate-pulse">Adding...</span>
                    </div>
                  ) : (
                    <>
                      <div className="relative group/cart">
                        <ShoppingCart 
                          size={22} 
                          className="group-hover/cart:rotate-12 group-hover/cart:scale-110 group-hover/cart:drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] transition-all duration-300" 
                        />
                        {/* Cart hover indicator */}
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full opacity-0 group-hover/cart:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                      </div>
                      <span className="group-hover:scale-105 transition-transform duration-300">Add to Cart</span>
                    </>
                  )}
                </span>
                
                {/* Success overlay with particles */}
                {showCartSuccess && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/40 via-emerald-500/30 to-green-500/40 animate-pulse rounded-[2.5rem]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Multiple particle rings */}
                      <div className="absolute w-40 h-40 bg-green-400/20 rounded-full animate-ping"></div>
                      <div className="absolute w-32 h-32 bg-green-300/20 rounded-full animate-ping" style={{animationDelay: '200ms'}}></div>
                      <div className="absolute w-24 h-24 bg-emerald-400/20 rounded-full animate-ping" style={{animationDelay: '400ms'}}></div>
                    </div>
                    {/* Confetti effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
                      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '100ms'}}></div>
                      <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-green-300 rounded-full animate-bounce" style={{animationDelay: '500ms'}}></div>
                      <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-bounce" style={{animationDelay: '700ms'}}></div>
                      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '900ms'}}></div>
                    </div>
                    {/* Success checkmarks */}
                    <div className="absolute top-4 right-4">
                      <Check size={16} className="text-green-400 animate-bounce drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <Check size={12} className="text-emerald-400 animate-bounce drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" style={{animationDelay: '200ms'}} />
                    </div>
                  </div>
                )}
                
                {/* Dynamic glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                {/* Glass reflection effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]"></div>
                
                {/* Hover shadow effect */}
                <div className="absolute inset-0 bg-black/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0"></div>
              </button>
            </div>

            {/* Sovereign Benefits */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/5">
              {[
                { icon: <Lock size={16} />, label: 'Secure Hub' },
                { icon: <Truck size={16} />, label: 'Fast Dispatch' },
                { icon: <Shield size={16} />, label: 'Verified Asset' }
              ].map((ben, i) => (
                <div key={i} className="flex flex-col items-center gap-3 group cursor-default">
                  <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-amber-500/40 group-hover:text-amber-500 group-hover:scale-110 transition-all duration-500 border border-white/5">
                    {ben.icon}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-700 group-hover:text-gray-500 transition-colors">{ben.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ratings & Sentiment Terminal */}
        <section className="mt-40 space-y-16 reveal">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/5 pb-12">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Registry Sentiment</h2>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Aggregate verification scores from sovereign clients.</p>
            </div>
            <div className="glass-dark px-10 py-6 rounded-3xl border border-white/10 flex items-center gap-8 shadow-2xl">
              <div className="text-center">
                <p className="text-3xl font-black text-amber-500">{averageRating.toFixed(1)}</p>
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Protocol Score</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div>
                <RatingStars rating={Math.round(averageRating)} />
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-2">{product.ratings?.length || 0} Verifications Recorded</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Review Form */}
            <div className="lg:col-span-1 space-y-10">
              <div className="glass-dark p-10 rounded-[3rem] border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] blur-[60px] pointer-events-none"></div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                  <MessageCircle className="text-amber-500" /> Dispatch Feedback
                </h3>

                <form onSubmit={handleReviewSubmit} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] ml-4">Integrity Rating</label>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-center shadow-inner">
                      <RatingStars rating={reviewRating} onRate={setReviewRating} size={24} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] ml-4">Detailed Signal</label>
                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Technical observations..."
                      className="w-full bg-[#030712] border border-white/10 rounded-[2rem] py-6 px-8 text-sm font-medium text-white focus:border-amber-500/40 outline-none transition-all resize-none leading-relaxed h-32 shadow-inner"
                    />
                  </div>

                  {/* Visual Evidence Section */}
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] ml-4 flex items-center gap-2">
                      <Camera size={14} className="text-amber-500" /> Visual Evidence
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {reviewImages.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 group/thumb">
                          <img src={img} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeReviewImage(idx)}
                            className="absolute top-0 right-0 p-1 bg-red-600 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {reviewImages.length < 5 && (
                        <button
                          type="button"
                          onClick={() => reviewFileInputRef.current?.click()}
                          className="w-16 h-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-all"
                        >
                          <Plus size={18} />
                        </button>
                      )}
                      <input
                        type="file"
                        ref={reviewFileInputRef}
                        onChange={handleReviewImageUpload}
                        className="hidden"
                        accept="image/*"
                        multiple
                      />
                    </div>
                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest ml-4">Limit: 5 Capture Nodes</p>
                  </div>

                  <button
                    type="submit"
                    disabled={!currentUser || reviewRating === 0 || !reviewComment.trim()}
                    className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-xl hover:bg-amber-500 hover:text-white disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Transmit Protocol <Send size={16} />
                  </button>
                  {!currentUser && <p className="text-[9px] text-red-500/60 font-black uppercase tracking-widest text-center">Authentication Required for Dispatch</p>}
                </form>
              </div>
            </div>

            {/* Review List */}
            <div className="lg:col-span-2 space-y-8">
              {product.reviews && product.reviews.length > 0 ? (
                <>
                  {(showAllReviews ? product.reviews : product.reviews.slice(0, 2)).map((rev, idx) => (
                    <div key={rev.id || idx} className="glass-dark p-8 rounded-[2rem] border-white/5 animate-slide-up relative group transition-all hover:border-amber-500/20 shadow-xl overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20 group-hover:bg-amber-500 transition-all"></div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl border border-amber-500/30 overflow-hidden bg-black p-0.5 shadow-lg group-hover:scale-105 transition-transform duration-500">
                            <img
                              src={rev.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.userName}`}
                              className="w-full h-full object-cover rounded-lg"
                              alt={rev.userName}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-white uppercase tracking-tight">{rev.userName}</h4>
                              <BadgeCheck size={12} className="text-blue-400" />
                            </div>
                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] mt-1 font-mono">
                              {rev.date ? new Date(rev.date).toLocaleDateString() : 'VERIFIED'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                          <RatingStars rating={rev.rating} size={12} />
                        </div>
                      </div>

                      <p className="text-sm text-gray-300 font-medium leading-relaxed pl-4 border-l border-white/10 italic">
                        "{rev.comment}"
                      </p>

                      {rev.images && rev.images.length > 0 && (
                        <div className="flex gap-3 mt-6 pl-4">
                          {rev.images.map((img, i) => (
                            <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 group-hover:border-amber-500/30 transition-colors">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {product.reviews.length > 2 && (
                    <button
                      onClick={() => setShowReviewsPopup(true)}
                      className="w-full py-4 glass-dark border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      View All {product.reviews.length} Reviews
                    </button>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 glass-dark rounded-[4rem] border-dashed border-white/10 text-center">
                  <div className="w-24 h-24 bg-white/[0.02] rounded-full flex items-center justify-center mb-8 border border-white/5">
                    <MessageCircle size={40} className="text-gray-800 opacity-30" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-700">Sentiment Vacuum</h3>
                  <p className="text-gray-600 text-[9px] font-black uppercase tracking-[0.4em] max-w-xs mx-auto mt-4">Be the primary node to archive feedback for this asset.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-40 space-y-12">
            <div className="flex items-end justify-between border-b border-white/5 pb-8">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Related Assets</h2>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Similar classification nodes</p>
              </div>
              <Link to="/shop" className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] hover:text-white transition-colors">
                View All Categories
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="group block glass-dark p-6 rounded-[2rem] border border-white/5 hover:border-amber-500/30 transition-all hover:-translate-y-2">
                  <div className="aspect-square rounded-2xl overflow-hidden mb-6 relative">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2 truncate">{p.name}</h3>
                  <p className="text-amber-500 font-bold font-mono text-lg">Rs. {p.price.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Reviews Popup Modal */}
      {showReviewsPopup && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] glass-dark rounded-[3rem] border border-white/10 overflow-hidden animate-slide-up">
            {/* Popup Header */}
            <div className="p-8 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                  All Reviews
                </h2>
                <p className="text-gray-400 text-sm">
                  {product.reviews?.length || 0} Reviews for {product.name}
                </p>
              </div>
              <button
                onClick={() => setShowReviewsPopup(false)}
                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* Reviews List */}
            <div className="p-8 overflow-y-auto max-h-[60vh] space-y-6">
              {product.reviews?.map((rev, idx) => (
                <div key={rev.id || idx} className="glass-dark p-8 rounded-[2rem] border border-white/10 relative group transition-all hover:border-amber-500/20 shadow-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20 group-hover:bg-amber-500 transition-all"></div>

                  {/* Review Header with Profile */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      {/* Profile Picture */}
                      {rev.avatar ? (
                        <img
                          src={rev.avatar}
                          alt={rev.userName || 'User'}
                          className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-amber-500/30"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                          {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-black text-white">{rev.userName || 'Anonymous User'}</h4>
                          <BadgeCheck size={20} className="text-amber-500" />
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < (rev.rating || 0) ? 'text-amber-500 fill-current' : 'text-gray-700'}
                              />
                            ))}
                          </div>
                          <span>•</span>
                          <span>{rev.date ? new Date(rev.date).toLocaleDateString() : 'Unknown Date'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="space-y-4">
                    <p className="text-gray-300 leading-relaxed text-lg">
                      {rev.comment || 'No comment provided.'}
                    </p>

                    {/* Review Images */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {rev.images.map((img, imgIdx) => (
                          <div
                            key={imgIdx}
                            className="aspect-square rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-amber-500/50 transition-all hover:scale-105"
                            onClick={() => setSelectedReviewImage(img)}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Popup Footer */}
            <div className="p-8 border-t border-white/10">
              <div className="flex justify-between items-center">
                <p className="text-gray-400 text-sm">
                  Showing all {product.reviews?.length || 0} reviews
                </p>
                <button
                  onClick={() => setShowReviewsPopup(false)}
                  className="px-8 py-3 bg-amber-500 text-black font-black text-sm uppercase tracking-[0.4em] rounded-xl hover:bg-amber-400 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Image Gallery Modal */}
      {selectedProductImage && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="relative max-w-6xl max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setSelectedProductImage(null)}
              className="absolute -top-12 right-0 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all z-10"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Main Image */}
            <div className="relative">
              <img
                src={selectedProductImage || ''}
                alt="Product Image"
                className="max-w-full max-h-[80vh] rounded-2xl object-contain"
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => {
                  const currentIndex = productImages.indexOf(selectedProductImage || '');
                  if (currentIndex > 0) {
                    setSelectedProductImage(productImages[currentIndex - 1]);
                  }
                }}
                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>

              <button
                onClick={() => {
                  const currentIndex = productImages.indexOf(selectedProductImage || '');
                  if (currentIndex < productImages.length - 1) {
                    setSelectedProductImage(productImages[currentIndex + 1]);
                  }
                }}
                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedProductImage && product.videos && product.videos.some((v: any) => v.videoUrl === selectedProductImage) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <button
            onClick={() => setSelectedProductImage(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all z-10"
          >
            <X size={24} className="text-white" />
          </button>

          <div className="relative w-full max-w-6xl px-4">
            <video
              src={selectedProductImage}
              className="w-full max-h-[80vh] rounded-2xl object-contain"
              controls
              autoPlay
            />
            
            {/* Video Title */}
            {(() => {
              const video = product.videos?.find((v: any) => v.videoUrl === selectedProductImage);
              return video?.title && (
                <div className="mt-4 text-center">
                  <p className="text-white text-sm font-bold">{video.title}</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Review Image Gallery Modal */}
      {selectedReviewImage && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="relative max-w-6xl max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setSelectedReviewImage(null)}
              className="absolute -top-12 right-0 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all z-10"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Main Image */}
            <div className="relative">
              <img
                src={selectedReviewImage || ''}
                alt="Review Image"
                className="max-w-full max-h-[80vh] rounded-2xl object-contain"
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => {
                  // Find current image index and navigate to previous
                  const allImages = product?.reviews?.flatMap((r: any) => r.images || []) || [];
                  const currentIndex = allImages.indexOf(selectedReviewImage || '');
                  if (currentIndex > 0) {
                    setSelectedReviewImage(allImages[currentIndex - 1]);
                  }
                }}
                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>

              <button
                onClick={() => {
                  // Find current image index and navigate to next
                  const allImages = product?.reviews?.flatMap((r: any) => r.images || []) || [];
                  const currentIndex = allImages.indexOf(selectedReviewImage || '');
                  if (currentIndex < allImages.length - 1) {
                    setSelectedReviewImage(allImages[currentIndex + 1]);
                  }
                }}
                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
};

export default ProductDetail;
