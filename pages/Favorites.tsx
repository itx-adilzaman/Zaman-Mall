
import React from 'react';
import { useStore } from '../store/StoreContext';
import { Heart, ShoppingCart, Eye, Star, ArrowRight, Zap, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductImageSlider } from '../components/ProductImageSlider';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Mobile View ────────────────────────────────────────────────────────────────
const bg = '#0d0d0d'; const surface = '#1a1a1a'; const border = '#2a2a2a'; const text = '#f0f0f0'; const sub = '#888'; const accent = '#6366f1';

const MobileFavoritesView: React.FC = () => {
  const { products, favorites, toggleFavorite, addToCart, formatPrice, currentUser } = useStore();
  const navigate = useNavigate();
  const favProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${border}` }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: sub, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 6, padding: 0 }}>
          ← Back
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: text, margin: 0, letterSpacing: '-0.01em' }}>My Wishlist</h1>
        <p style={{ fontSize: 12, color: sub, margin: '3px 0 0' }}>{favProducts.length} saved item{favProducts.length !== 1 ? 's' : ''}</p>
      </div>

      {favProducts.length > 0 ? (
        <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {favProducts.map(p => {
            const avgR = p.ratings?.length ? p.ratings.reduce((a: number, b: number) => a + b, 0) / p.ratings.length : 0;
            return (
              <div key={p.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', aspectRatio: '4/3' }}>
                  <Link to={`/product/${p.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                    <ProductImageSlider images={p.images?.length ? p.images : [p.image]} name={p.name} />
                  </Link>
                  <button onClick={() => toggleFavorite(p.id)} style={{ position: 'absolute', top: 7, right: 7, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={13} style={{ color: '#ef4444' }} />
                  </button>
                  {p.country && (
                    <div style={{ position: 'absolute', bottom: 5, left: 5, background: 'rgba(0,0,0,0.65)', borderRadius: 5, padding: '2px 5px', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <img src={p.country === 'china' ? '/images/china.png' : '/images/pakistan.png'} alt="" style={{ width: 12, height: 9, objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
                <div style={{ padding: '9px 11px 11px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 10, color: sub, fontWeight: 600, textTransform: 'uppercase' }}>{p.category}</span>
                  <Link to={`/product/${p.id}`} style={{ textDecoration: 'none' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: text, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                    <span style={{ fontSize: 10, color: sub, fontWeight: 600 }}>{avgR.toFixed(1)}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: text, margin: '3px 0 7px' }}>{formatPrice(p.price)}</p>
                  <button onClick={async () => { if (!currentUser) { navigate('/login'); return; } await addToCart(p); }} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <ShoppingCart size={12} /> Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '70px 24px' }}>
          <Heart size={52} style={{ color: '#333', margin: '0 auto 14px', display: 'block' }} />
          <p style={{ fontWeight: 700, fontSize: 18, color: text, marginBottom: 6 }}>Wishlist khali hai</p>
          <p style={{ fontSize: 13, color: sub, marginBottom: 18 }}>Apne pasand ke products yahan save karein</p>
          <Link to="/shop" style={{ display: 'inline-block', background: accent, color: '#fff', padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Browse Shop</Link>
        </div>
      )}
    </div>
  );
};

export const Favorites: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileFavoritesView />;

  const { products, favorites, toggleFavorite, addToCart, formatPrice } = useStore();
  
  const favProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 reveal">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 glass border-white/10 rounded-lg text-[10px] font-black uppercase tracking-[0.4em] text-pink-500 mb-4">
             <Zap size={12} className="fill-current" /> Personalized Vault
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase">
            My <span className="gradient-text">Wishlist</span>
          </h1>
          <p className="text-gray-400 mt-4 text-lg font-medium">Saved items from Zaman Sons Mall collections.</p>
        </div>
        <Link to="/shop" className="px-8 py-4 glass border-white/10 hover:border-blue-500/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-400 flex items-center gap-3 transition-all">
          Browse More Assets <ArrowRight size={16} />
        </Link>
      </div>

      {favProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {favProducts.map(product => {
            const avgRating = product.ratings?.length 
              ? product.ratings.reduce((a, b) => a + b, 0) / product.ratings.length 
              : 0;

            return (
              <div key={product.id} className="group glass rounded-[3rem] border-white/5 bg-white/[0.01] transition-all duration-700 flex flex-col hover:-translate-y-2 shadow-2xl relative overflow-hidden">
                <div className="aspect-square relative overflow-hidden m-4 rounded-[2.25rem] bg-[#030712]">
                  <Link to={`/product/${product.id}`} className="block w-full h-full">
                    <ProductImageSlider 
                      images={product.images && product.images.length > 0 ? product.images : [product.image]} 
                      name={product.name} 
                    />
                  </Link>
                  
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-4 right-4 p-3 rounded-2xl glass bg-white/5 border-white/10 text-white transition-all z-10 hover:bg-red-500 hover:border-red-400 hover:scale-110 shadow-xl group/trash"
                    title="Remove from Vault"
                  >
                    <Trash2 size={18} className="group-hover/trash:animate-pulse" />
                  </button>

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-10">
                    <Link to={`/product/${product.id}`} className="p-4 glass text-white rounded-2xl hover:bg-white/20 transition-all hover:scale-110 border border-white/10 shadow-2xl">
                      <Eye size={20} />
                    </Link>
                    <button
                      onClick={() => addToCart(product)}
                      className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all hover:scale-110 shadow-[0_15px_30px_rgba(37,99,235,0.4)]"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>

                  {/* Country Tag */}
                  {product.country && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 z-10 animate-fade-in group-hover:translate-y-[-80px] transition-transform duration-500">
                      {product.country === 'china' ? (
                        <>
                          <img src="/images/china.png" alt="China" className="w-4 h-3 object-contain" />
                          <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">China</span>
                        </>
                      ) : (
                        <>
                          <img src="/images/pakistan.png" alt="Pakistan" className="w-4 h-3 object-contain" />
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Pakistan</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                </div>
                
                <div className="px-8 pb-8 pt-2 flex-grow flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-blue-500 text-[9px] font-black uppercase tracking-[0.4em]">{product.category}</span>
                    <div className="flex items-center gap-1.5 text-[9px] text-yellow-500 font-black bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">
                      <Star size={10} className="fill-current" />
                      <span>{avgRating?.toFixed(1) || "0.0"}</span>
                    </div>
                  </div>
                  
                  <Link to={`/product/${product.id}`} className="hover:text-blue-400 transition-colors">
                    <h3 className="text-xl font-black mb-4 leading-tight text-white truncate">{product.name}</h3>
                  </Link>
                  
                  <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Asset Value</span>
                      <span className="text-2xl font-black gradient-text tracking-tighter">{formatPrice(product.price)}</span>
                    </div>
                    <button 
                      onClick={() => toggleFavorite(product.id)}
                      className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-red-500 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={12} /> Evict
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-40 glass rounded-[5rem] border-dashed border-white/10 shadow-3xl bg-white/[0.01]">
          <Heart size={80} className="mx-auto text-gray-800 mb-8 animate-float" />
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">The Vault is Open</h3>
          <p className="text-gray-500 mb-12 max-w-sm mx-auto font-medium text-lg leading-relaxed">Secure your first high-end asset by adding it to your wishlist during your next shop session.</p>
          <Link to="/shop" className="px-16 py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] transition-all hover:bg-blue-600 hover:text-white shadow-2xl active:scale-95">
            Initialize Collection
          </Link>
        </div>
      )}
    </div>
  );
};
