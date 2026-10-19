import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Share2, Volume2, VolumeX, ChevronUp, ChevronDown, Play, Pause, Eye, Package, X, ArrowRight, ShoppingCart, ChevronLeft, ChevronRight, ShieldCheck, Truck, Star } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useStore } from '../store/StoreContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDownloadLinks } from '../hooks/useDownloadLinks';

interface ZeelProduct {
  id: string; name: string; description?: string;
  price: number; image: string; images?: string[];
  country?: string; category?: string; stock?: number;
}
interface Zeel {
  id: string; title: string; description?: string;
  video_url: string; thumbnail_url?: string;
  product_id?: string | null;
  likes_count: number; views_count: number;
  is_active: boolean; created_at: string;
  product?: ZeelProduct | null;
  userLiked?: boolean;
  currentIndex?: number; // Track which zeel is being viewed
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Single Zeel Card ─────────────────────────────────────────────────────────
const ZeelCard: React.FC<{
  zeel: Zeel;
  isActive: boolean;
  onLike: (id: string) => void;
  onShare: (zeel: Zeel) => void;
  onViewProduct: (zeel: Zeel) => void;
}> = ({ zeel, isActive, onLike, onShare, onViewProduct }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef<number>(0);

  // Play/pause based on isActive
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
      vid.currentTime = 0;
    }
  }, [isActive]);

  // Update progress bar
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const updateProgress = () => {
      if (vid.duration) {
        setProgress((vid.currentTime / vid.duration) * 100);
      }
    };

    vid.addEventListener('timeupdate', updateProgress);
    return () => vid.removeEventListener('timeupdate', updateProgress);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, []);

  const handleLike = () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
    onLike(zeel.id);
  };

  const togglePause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (paused) { vid.play().catch(() => {}); setPaused(false); }
    else { vid.pause(); setPaused(true); }
  };

  // Double tap to like
  const handleVideoClick = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected!
      e.preventDefault();
      if (!zeel.userLiked) {
        handleLike();
      }
      // Show heart animation
      setDoubleTapHeart(true);
      setTimeout(() => setDoubleTapHeart(false), 1000);
      lastTapTime.current = 0; // Reset
    } else {
      // Single tap - toggle pause
      lastTapTime.current = now;
      setTimeout(() => {
        if (lastTapTime.current === now) {
          // It was a single tap
          togglePause();
        }
      }, 300);
    }
  };

  // Long press handlers
  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowQuickMenu(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleNotInterested = () => {
    setShowQuickMenu(false);
    // Add your logic here
    alert('Marked as not interested');
  };

  const handleReport = () => {
    setShowQuickMenu(false);
    // Add your logic here
    alert('Report submitted');
  };

  const handleSave = () => {
    setShowQuickMenu(false);
    // Add your logic here
    alert('Saved to bookmarks');
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden select-none"
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Thumbnail behind video (blurred) */}
      {zeel.thumbnail_url && (
        <img
          src={zeel.thumbnail_url}
          alt={zeel.title}
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30"
          draggable={false}
        />
      )}

      {/* Video - maintain aspect ratio */}
      <video
        ref={videoRef}
        src={zeel.video_url}
        className="absolute inset-0 m-auto max-w-full max-h-full object-contain cursor-pointer"
        style={{ width: 'auto', height: 'auto' }}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        onClick={handleVideoClick}
        onTouchEnd={handleVideoClick}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onPlaying={() => setBuffering(false)}
      />

      {/* Progress Bar at Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100 shadow-lg shadow-purple-500/50"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Gradient overlays for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

      {/* Double Tap Heart Animation */}
      {doubleTapHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="relative">
            {/* Outer ripple effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full bg-red-500/30 animate-ping" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center" style={{ animationDelay: '100ms' }}>
              <div className="w-32 h-32 rounded-full bg-red-400/40 animate-ping" />
            </div>
            
            {/* Main heart */}
            <div className="relative animate-doubleTapHeart">
              <Heart 
                size={120} 
                className="text-red-500 fill-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" 
                strokeWidth={1.5}
              />
              
              {/* Sparkles around heart */}
              <div className="absolute -top-4 -left-4 w-6 h-6 bg-white rounded-full animate-sparkle opacity-0" style={{ animationDelay: '100ms' }} />
              <div className="absolute -top-4 -right-4 w-4 h-4 bg-yellow-300 rounded-full animate-sparkle opacity-0" style={{ animationDelay: '200ms' }} />
              <div className="absolute -bottom-4 -left-6 w-5 h-5 bg-pink-300 rounded-full animate-sparkle opacity-0" style={{ animationDelay: '150ms' }} />
              <div className="absolute -bottom-4 -right-6 w-4 h-4 bg-red-300 rounded-full animate-sparkle opacity-0" style={{ animationDelay: '250ms' }} />
              <div className="absolute top-0 -left-8 w-3 h-3 bg-white rounded-full animate-sparkle opacity-0" style={{ animationDelay: '50ms' }} />
              <div className="absolute top-0 -right-8 w-3 h-3 bg-pink-400 rounded-full animate-sparkle opacity-0" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* Buffering spinner */}
      {buffering && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* Paused overlay */}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/60 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm">
            <Play size={28} className="text-white ml-1" />
          </div>
        </div>
      )}

      {/* ── Right action bar ── */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5 z-10">
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 group"
          aria-label="Like"
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            zeel.userLiked
              ? 'bg-red-500/30 border-2 border-red-400 scale-110'
              : 'bg-black/60 border-2 border-white/20 group-hover:border-red-400 group-hover:bg-red-500/20'
          } ${likeAnim ? 'scale-125' : ''}`}>
            <Heart
              size={22}
              className={`transition-all duration-200 ${zeel.userLiked ? 'text-red-400 fill-red-400' : 'text-white group-hover:text-red-400'}`}
            />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow-lg">{formatCount(zeel.likes_count)}</span>
        </button>

        {/* Share */}
        <button
          onClick={() => onShare(zeel)}
          className="flex flex-col items-center gap-1 group"
          aria-label="Share"
        >
          <div className="w-11 h-11 rounded-full bg-black/60 border-2 border-white/20 flex items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-500/20 transition-all duration-200">
            <Share2 size={20} className="text-white group-hover:text-blue-400 transition-colors" />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow-lg">Share</span>
        </button>

        {/* Views */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/60 border-2 border-white/10 flex items-center justify-center">
            <Eye size={20} className="text-white/70" />
          </div>
          <span className="text-white/70 text-[11px] font-bold drop-shadow-lg">{formatCount(zeel.views_count)}</span>
        </div>

        {/* Mute toggle with sound visualization */}
        <button
          onClick={() => setMuted(m => !m)}
          className="relative w-11 h-11 rounded-full bg-black/60 border-2 border-white/20 flex items-center justify-center hover:border-white/50 transition-all duration-200 overflow-hidden group"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {/* Sound waves animation */}
          {!muted && (
            <div className="absolute inset-0 flex items-center justify-center gap-0.5">
              <div className="w-0.5 bg-white/30 rounded-full animate-soundWave" style={{ height: '30%', animationDelay: '0ms' }} />
              <div className="w-0.5 bg-white/30 rounded-full animate-soundWave" style={{ height: '50%', animationDelay: '150ms' }} />
              <div className="w-0.5 bg-white/30 rounded-full animate-soundWave" style={{ height: '40%', animationDelay: '300ms' }} />
            </div>
          )}
          <div className="relative z-10">
            {muted
              ? <VolumeX size={20} className="text-white/80" />
              : <Volume2 size={20} className="text-white" />
            }
          </div>
        </button>
      </div>

      {/* Quick Action Menu */}
      {showQuickMenu && (
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center"
          onClick={() => setShowQuickMenu(false)}
        >
          <div 
            className="bg-gradient-to-br from-[#0d0d1a] to-[#1a1a2e] border border-white/10 rounded-3xl p-2 shadow-2xl transform scale-100 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              {/* Share */}
              <button
                onClick={() => { onShare(zeel); setShowQuickMenu(false); }}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/30 transition-all">
                  <Share2 size={18} className="text-blue-400" />
                </div>
                <span className="text-white font-bold text-sm">Share</span>
              </button>

              {/* Save */}
              <button
                onClick={handleSave}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                  <Package size={18} className="text-purple-400" />
                </div>
                <span className="text-white font-bold text-sm">Save</span>
              </button>

              {/* Not Interested */}
              <button
                onClick={handleNotInterested}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/30 transition-all">
                  <Eye size={18} className="text-orange-400" />
                </div>
                <span className="text-white font-bold text-sm">Not Interested</span>
              </button>

              {/* Report */}
              <button
                onClick={handleReport}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center group-hover:bg-red-500/30 transition-all">
                  <X size={18} className="text-red-400" />
                </div>
                <span className="text-white font-bold text-sm">Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom info ── */}
      <div className="absolute bottom-4 left-4 right-20 z-10">
        <h3 className="text-white font-black text-base leading-snug mb-1 drop-shadow-lg line-clamp-2">
          {zeel.title}
        </h3>
        {zeel.description && (
          <p className="text-white/70 text-sm leading-snug mb-3 line-clamp-2">{zeel.description}</p>
        )}

        {/* Product card */}
        {zeel.product && (
          <button
            onClick={() => onViewProduct(zeel)}
            className="w-full flex items-center gap-3 bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-2.5 hover:border-purple-400/50 hover:bg-black/70 transition-all duration-200 group text-left"
          >
            <img
              src={zeel.product.image || zeel.product.images?.[0]}
              alt={zeel.product.name}
              className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {zeel.product.country === 'china' && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    🇨🇳 China
                  </span>
                )}
                {zeel.product.country === 'pakistan' && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                    🇵🇰 Pakistan
                  </span>
                )}
              </div>
              <p className="text-white text-xs font-bold truncate">{zeel.product.name}</p>
              <p className="text-purple-300 text-sm font-black">Rs. {zeel.product.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 bg-purple-500/20 border border-purple-400/30 rounded-lg px-2 py-1.5 group-hover:bg-purple-500/40 transition-colors shrink-0">
              <ShoppingCart size={12} className="text-purple-300" />
              <span className="text-purple-300 text-[10px] font-bold">View</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Product Detail Modal ─────────────────────────────────────────────────────
const ProductModal: React.FC<{
  zeel: Zeel | null;
  onClose: () => void;
  onAddToCart: (product: ZeelProduct) => void;
}> = ({ zeel, onClose, onAddToCart }) => {
  const navigate = useNavigate();
  const [imageIndex, setImageIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  
  if (!zeel?.product) return null;
  const p = zeel.product;
  const allImages = p.images && p.images.length > 0 ? p.images : [p.image];

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleAddToCart = () => {
    onAddToCart(p);
    handleClose();
  };

  const handleViewDetails = () => {
    handleClose();
    setTimeout(() => {
      navigate(`/product/${p.id}`, { state: { fromZeels: true, zeelIndex: zeel.currentIndex } });
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      
      {/* Modal Container */}
      <div
        className={`relative w-full sm:max-w-2xl bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 ${
          isClosing ? 'translate-y-full sm:translate-y-0 sm:scale-95 opacity-0' : 'translate-y-0 sm:scale-100 opacity-100'
        }`}
        style={{ maxHeight: 'calc(100vh - 80px)' }} // Account for navbar height
        onClick={e => e.stopPropagation()}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Drag Handle (mobile) */}
        <div className="sm:hidden w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-2 relative z-10" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 border border-white/10 hover:border-white/30 flex items-center justify-center transition-all duration-300 group"
        >
          <X size={20} className="text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className="overflow-y-auto relative z-10" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {/* Image Gallery */}
          <div className="relative px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="relative h-64 sm:h-80 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50">
              {/* Image Slider */}
              <div className="relative h-full w-full flex items-center justify-center">
                <img
                  src={allImages[imageIndex]}
                  alt={p.name}
                  className="max-w-full max-h-full object-contain transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a]/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Image Navigation */}
              {allImages.length > 1 && (
                <>
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <button
                      onClick={() => setImageIndex(i => (i - 1 + allImages.length) % allImages.length)}
                      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 hover:scale-110 transition-all duration-300"
                    >
                      <ChevronLeft size={20} className="text-white" />
                    </button>
                    <button
                      onClick={() => setImageIndex(i => (i + 1) % allImages.length)}
                      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 hover:scale-110 transition-all duration-300"
                    >
                      <ChevronRight size={20} className="text-white" />
                    </button>
                  </div>
                  
                  {/* Image Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setImageIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === imageIndex ? 'w-8 bg-purple-500' : 'w-1.5 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Stock Badge */}
              {(p.stock ?? 0) > 0 && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 text-xs font-bold flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    In Stock
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="px-6 sm:px-8 pb-8 -mt-6 relative">
            {/* Country & Category Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {p.country === 'china' && (
                <div className="px-3 py-1.5 rounded-full bg-red-500/10 backdrop-blur-md border border-red-500/30 flex items-center gap-2">
                  <span className="text-sm">🇨🇳</span>
                  <span className="text-red-400 text-xs font-bold uppercase tracking-wide">China</span>
                </div>
              )}
              {p.country === 'pakistan' && (
                <div className="px-3 py-1.5 rounded-full bg-green-500/10 backdrop-blur-md border border-green-500/30 flex items-center gap-2">
                  <span className="text-sm">🇵🇰</span>
                  <span className="text-green-400 text-xs font-bold uppercase tracking-wide">Pakistan</span>
                </div>
              )}
              {p.category && (
                <div className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{p.category}</span>
                </div>
              )}
            </div>

            {/* Product Name */}
            <h2 className="text-white text-2xl sm:text-3xl font-black mb-3 leading-tight tracking-tight">
              {p.name}
            </h2>

            {/* Price with animated background */}
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                <div className="relative px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 backdrop-blur-sm">
                  <span className="text-purple-300 text-3xl font-black tracking-tight">
                    Rs. {p.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {p.description && (
              <div className="mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-gray-300 text-sm leading-relaxed">{p.description}</p>
              </div>
            )}

            {/* Thumbnail Images */}
            {allImages.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                  .flex.gap-2.overflow-x-auto::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      idx === imageIndex 
                        ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/50' 
                        : 'border-white/10 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 group relative overflow-hidden py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/50"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="relative flex items-center justify-center gap-3">
                  <ShoppingCart size={20} className="text-white" />
                  <span className="text-white font-black text-base uppercase tracking-wide">Add to Cart</span>
                </div>
              </button>

              <button
                onClick={handleViewDetails}
                className="sm:w-auto px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95 group"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-white font-black text-base uppercase tracking-wide">Full Details</span>
                  <ArrowRight size={20} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <ShieldCheck size={20} className="text-green-400 mb-1.5" />
                <span className="text-white text-xs font-bold">Secure</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <Truck size={20} className="text-blue-400 mb-1.5" />
                <span className="text-white text-xs font-bold">Fast Ship</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <Star size={20} className="text-amber-400 mb-1.5" />
                <span className="text-white text-xs font-bold">Quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Zeels Page ──────────────────────────────────────────────────────────
export const Zeels: React.FC = () => {
  const { currentUser, addToCart } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  // ⚠️ Must be declared here (not after conditionals) — Rules of Hooks
  const isMobile = useIsMobile();

  // ── Mobile: Show download/desktop prompt instead of video feed ──────────────
  if (isMobile) {
    const ZeelsMobilePrompt: React.FC = () => {
      const dlLinks = useDownloadLinks();
      const androidUrl = dlLinks.android?.is_active ? dlLinks.android.download_url : 'https://drive.google.com/file/d/1RREImUr7m2O_q0VI7rT3T6zIGBHGUV2Z/view?usp=sharing';
      const siteUrl = 'https://zamanmall.netlify.app/#/zeels';

      return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', paddingBottom: 80, position: 'relative' }}>
          {/* Back */}
          <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid #2a2a2a', borderRadius: 20, padding: '7px 14px', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ← Back
          </button>

          {/* Icon */}
          <div style={{ width: 90, height: 90, borderRadius: 28, background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(99,102,241,0.2))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 44 }}>
            🎬
          </div>

          <h1 style={{ fontWeight: 900, fontSize: 26, color: '#f0f0f0', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Zeels</h1>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, margin: '0 0 32px', maxWidth: 280 }}>
            Short product reels are best experienced on a bigger screen or in the Zaman Mall app.
          </p>

          {/* Download App — dynamic */}
          <a href={androidUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', maxWidth: 300, padding: '14px 20px', background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', marginBottom: 12, boxShadow: '0 4px 20px rgba(22,163,74,0.3)' }}>
            <span style={{ fontSize: 20 }}>📱</span>
            Download the App
          </a>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 300, margin: '4px 0 12px' }}>
            <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
            <span style={{ fontSize: 12, color: '#444', fontWeight: 600 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
          </div>

          {/* Open on Desktop */}
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', maxWidth: 300, padding: '13px 20px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14, color: '#a5b4fc', fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 28 }}>
            <span style={{ fontSize: 18 }}>🖥️</span>
            Continue on Desktop
          </a>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%', maxWidth: 300 }}>
            {[['▶️','Watch short product reels'],['❤️','Like and share favorites'],['🛒','Shop directly from reels']].map(([e, t]) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12 }}>
                <span style={{ fontSize: 18 }}>{e}</span>
                <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };
    return <ZeelsMobilePrompt />;
  }

  const [zeels, setZeels] = useState<Zeel[]>([]);
  const [loading, setLoading] = useState(true);
  // Restore active index from location state if returning from product page
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    // First check location state (coming back from product detail)
    const stateIndex = (location.state as any)?.zeelIndex;
    if (stateIndex !== undefined) return stateIndex;
    
    // Otherwise check sessionStorage (page reload or navigation)
    const saved = sessionStorage.getItem('zeelsActiveIndex');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [productModal, setProductModal] = useState<Zeel | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // ── Load ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      
      // Check if we have cached zeels order in sessionStorage
      const cachedZeelsOrder = sessionStorage.getItem('zeelsOrder');
      
      const { data: zeelData } = await supabase
        .from('zeels').select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!zeelData?.length) { setLoading(false); return; }

      const productIds = zeelData.filter(z => z.product_id).map(z => z.product_id as string);
      let productsMap: Record<string, ZeelProduct> = {};
      if (productIds.length > 0) {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, name, description, price, image, images, country, category, stock')
          .in('id', productIds);
        if (prodData) productsMap = Object.fromEntries(prodData.map((p: any) => [p.id, p]));
      }

      let likedSet = new Set<string>();
      if (currentUser?.id) {
        const { data: likeData } = await supabase
          .from('zeel_likes').select('zeel_id').eq('user_id', currentUser.id);
        if (likeData) likeData.forEach((l: any) => likedSet.add(l.zeel_id));
      }

      const processedZeels = zeelData.map((z: any) => ({
        ...z,
        product: z.product_id ? (productsMap[z.product_id] ?? null) : null,
        userLiked: likedSet.has(z.id),
      }));

      let finalZeels: Zeel[];

      // If we have cached order, restore it
      if (cachedZeelsOrder) {
        try {
          const cachedIds: string[] = JSON.parse(cachedZeelsOrder);
          // Reorder based on cached IDs
          const zeelsMap = new Map(processedZeels.map(z => [z.id, z]));
          finalZeels = cachedIds
            .map(id => zeelsMap.get(id))
            .filter((z): z is Zeel => z !== undefined);
          
          // Add any new zeels that weren't in cache
          const cachedIdSet = new Set(cachedIds);
          const newZeels = processedZeels.filter(z => !cachedIdSet.has(z.id));
          finalZeels = [...finalZeels, ...newZeels];
        } catch {
          // If parsing fails, shuffle as usual
          finalZeels = [...processedZeels].sort(() => Math.random() - 0.5);
          sessionStorage.setItem('zeelsOrder', JSON.stringify(finalZeels.map(z => z.id)));
        }
      } else {
        // First time: shuffle and cache the order
        finalZeels = [...processedZeels].sort(() => Math.random() - 0.5);
        sessionStorage.setItem('zeelsOrder', JSON.stringify(finalZeels.map(z => z.id)));
      }
      
      setZeels(finalZeels);
      setLoading(false);
    };
    load();
  }, [currentUser?.id]);

  // Save active index whenever it changes
  useEffect(() => {
    sessionStorage.setItem('zeelsActiveIndex', activeIndex.toString());
  }, [activeIndex]);

  // ── Increment view count ──────────────────────────────
  useEffect(() => {
    const zeel = zeels[activeIndex];
    if (!zeel) return;
    supabase.from('zeels')
      .update({ views_count: (zeel.views_count ?? 0) + 1 })
      .eq('id', zeel.id)
      .then(() => {}).catch(() => {});
  }, [activeIndex]);

  // ── Keyboard navigation ───────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, zeels.length]);

  // ── Scroll wheel navigation ───────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrolling.current) return;
      isScrolling.current = true;
      if (e.deltaY > 0) goNext();
      else goPrev();
      setTimeout(() => { isScrolling.current = false; }, 700);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [activeIndex, zeels.length]);

  // ── Touch swipe ───────────────────────────────────────
  const touchStart = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) { if (diff > 0) goNext(); else goPrev(); }
  };

  const goNext = useCallback(() => {
    setActiveIndex(i => {
      const newIndex = Math.min(i + 1, zeels.length - 1);
      sessionStorage.setItem('zeelsActiveIndex', newIndex.toString());
      return newIndex;
    });
  }, [zeels.length]);

  const goPrev = useCallback(() => {
    setActiveIndex(i => {
      const newIndex = Math.max(i - 1, 0);
      sessionStorage.setItem('zeelsActiveIndex', newIndex.toString());
      return newIndex;
    });
  }, []);

  // ── Like ──────────────────────────────────────────────
  const handleLike = useCallback(async (zeelId: string) => {
    if (!currentUser?.id) { navigate('/login'); return; }
    const zeel = zeels.find(z => z.id === zeelId);
    if (!zeel) return;
    const nowLiked = !zeel.userLiked;
    setZeels(prev => prev.map(z => z.id !== zeelId ? z : {
      ...z, userLiked: nowLiked,
      likes_count: nowLiked ? z.likes_count + 1 : Math.max(0, z.likes_count - 1),
    }));
    try {
      if (nowLiked) {
        await supabase.from('zeel_likes').insert({ zeel_id: zeelId, user_id: currentUser.id });
        await supabase.from('zeels').update({ likes_count: (zeel.likes_count ?? 0) + 1 }).eq('id', zeelId);
      } else {
        await supabase.from('zeel_likes').delete().eq('zeel_id', zeelId).eq('user_id', currentUser.id);
        await supabase.from('zeels').update({ likes_count: Math.max(0, (zeel.likes_count ?? 1) - 1) }).eq('id', zeelId);
      }
    } catch {
      setZeels(prev => prev.map(z => z.id !== zeelId ? z : { ...z, userLiked: !nowLiked, likes_count: zeel.likes_count }));
    }
  }, [currentUser?.id, zeels, navigate]);

  // ── Share ─────────────────────────────────────────────
  const handleShare = useCallback(async (zeel: Zeel) => {
    const text = `${zeel.title}${zeel.product ? ` — ${zeel.product.name} | Rs. ${zeel.product.price.toLocaleString()}` : ''} | Zaman Mall`;
    if (navigator.share) {
      await navigator.share({ title: zeel.title, text, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      alert('Link copied to clipboard!');
    }
  }, []);

  // ── Add to cart ───────────────────────────────────────
  const handleAddToCart = useCallback(async (product: ZeelProduct) => {
    if (!currentUser) { navigate('/login'); return; }
    await addToCart(product as any);
  }, [currentUser, addToCart, navigate]);

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading Zeels...</p>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────
  if (zeels.length === 0) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Play size={28} className="text-purple-400 ml-1" />
        </div>
        <h2 className="text-white text-xl font-black">No Zeels yet</h2>
        <p className="text-gray-400 text-sm">Short product reels will appear here. Check back soon!</p>
      </div>
    );
  }

  // ── Main feed (desktop only — mobile shows download screen above) ──────────
  const topOffset = '64px';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden" style={{ top: topOffset }}>
      {/* Feed container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slides — translate based on activeIndex */}
        <div
          className="w-full transition-transform duration-500 ease-in-out"
          style={{
            height: `${zeels.length * 100}%`,
            transform: `translateY(-${(activeIndex / zeels.length) * 100}%)`,
          }}
        >
          {zeels.map((zeel, index) => (
            <div
              key={zeel.id}
              style={{ height: `${100 / zeels.length}%` }}
              className="w-full"
            >
              <ZeelCard
                zeel={zeel}
                isActive={index === activeIndex}
                onLike={handleLike}
                onShare={handleShare}
                onViewProduct={setProductModal}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Nav arrows (desktop) — centered vertically, clear of action bar ── */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20 hidden md:flex"
        style={{ marginTop: '-80px' }}> {/* shift up to avoid like button overlap */}
        <button
          onClick={goPrev}
          disabled={activeIndex === 0}
          className="w-10 h-10 rounded-full bg-black/70 border border-white/25 flex items-center justify-center hover:border-white/60 hover:bg-black/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg"
          aria-label="Previous"
        >
          <ChevronUp size={20} className="text-white" />
        </button>
        <button
          onClick={goNext}
          disabled={activeIndex === zeels.length - 1}
          className="w-10 h-10 rounded-full bg-black/70 border border-white/25 flex items-center justify-center hover:border-white/60 hover:bg-black/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg"
          aria-label="Next"
        >
          <ChevronDown size={20} className="text-white" />
        </button>
      </div>

      {/* ── Scroll dots (side) ── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
        {zeels.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveIndex(i);
              sessionStorage.setItem('zeelsActiveIndex', i.toString());
            }}
            className={`rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'w-1.5 h-6 bg-purple-400'
                : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Go to zeel ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Counter top-right ── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
        <span className="text-purple-400 text-xs font-black">{activeIndex + 1}</span>
        <span className="text-white/30 text-xs">/</span>
        <span className="text-white/60 text-xs font-bold">{zeels.length}</span>
      </div>

      {/* Product modal */}
      <ProductModal
        zeel={productModal ? { ...productModal, currentIndex: activeIndex } : null}
        onClose={() => setProductModal(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};
