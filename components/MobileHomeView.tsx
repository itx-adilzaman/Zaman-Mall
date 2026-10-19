/**
 * MobileHomeView â€” dark minimal home for mobile.
 * All features preserved: ads, zeels, affiliate brands/products, featured products.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ShoppingCart, Heart, Play,
  ExternalLink, CheckCircle2
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useCountrySession } from '../contexts/CountrySessionContext';
import { supabase } from '../services/supabase';
import { ProductImageSlider } from './ProductImageSlider';
import { useDownloadLinks } from '../hooks/useDownloadLinks';

// â”€â”€ tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const bg      = '#0d0d0d';
const surface = '#1a1a1a';
const border  = '#2a2a2a';
const text    = '#f0f0f0';
const sub     = '#888888';
const accent  = '#6366f1';

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SecHeader: React.FC<{ title: string; badge?: string; badgeColor?: string; to?: string }> = ({ title, badge, badgeColor = accent, to }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 800, fontSize: 17, color: text }}>{title}</span>
      {badge && (
        <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor, background: `${badgeColor}20`, border: `1px solid ${badgeColor}40`, borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase' }}>
          {badge}
        </span>
      )}
    </div>
    {to && (
      <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: accent, textDecoration: 'none' }}>
        View All <ArrowRight size={13} />
      </Link>
    )}
  </div>
);


// ── Promo Banner ───────────────────────────────────────────────────────────────
const PromoBanner: React.FC = () => (
  <div style={{ margin: '0 16px', background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 14, padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, overflow: 'hidden', position: 'relative' }}>
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', filter: 'blur(25px)', pointerEvents: 'none' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, position: 'relative' }}>
      <span style={{ fontSize: 18 }}>{'\uD83C\uDF81'}</span>
      <div>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#e0e7ff', margin: 0 }}>Enjoy Exclusive Discounts!</p>
        <p style={{ fontSize: 10, color: '#a5b4fc', margin: 0, fontWeight: 500 }}>Download app for special offers</p>
      </div>
    </div>
    <button
      onClick={() => { const el = document.getElementById('mobile-app-download'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
      style={{ flexShrink: 0, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 9, padding: '7px 13px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 3px 10px rgba(99,102,241,0.4)', position: 'relative' }}
    >
      Get App {'\u2193'}
    </button>
  </div>
);

// â”€â”€ Ad Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AdBanner: React.FC = () => {
  const { ads, isDbLoading } = useStore();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => setActive(p => (p + 1) % ads.length), 5000);
    return () => clearInterval(t);
  }, [ads.length]);

  if (isDbLoading) return <div style={{ margin: '0 16px', borderRadius: 14, background: surface, height: 190 }} />;
  if (!ads.length) return null;

  return (
    <div style={{ position: 'relative', margin: '0 16px', borderRadius: 14, overflow: 'hidden' }}>
      {ads.map((ad, idx) => (
        <div key={ad.id} style={{ display: idx === active ? 'block' : 'none', position: 'relative' }}>
          {ad.videoUrl
            ? <video src={ad.videoUrl} autoPlay loop muted playsInline style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
            : <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, transparent 60%)', padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 18, margin: '0 0 10px', lineHeight: 1.2 }}>{ad.title}</h2>
            <a href={ad.link} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f59e0b', color: '#000', fontWeight: 700, fontSize: 12, padding: '6px 13px', borderRadius: 20, textDecoration: 'none', alignSelf: 'flex-start' }}>
              Shop Now <ArrowRight size={12} />
            </a>
          </div>
        </div>
      ))}
      {ads.length > 1 && (
        <div style={{ position: 'absolute', bottom: 10, right: 12, display: 'flex', gap: 4 }}>
          {ads.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              width: i === active ? 18 : 6, height: 6, borderRadius: 3,
              background: i === active ? '#f59e0b' : 'rgba(255,255,255,0.4)',
              border: 'none', padding: 0, cursor: 'pointer', transition: 'width 0.3s',
            }} />
          ))}
        </div>
      )}
    </div>
  );
};

// â”€â”€ Country Switcher â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CountrySwitcher: React.FC = () => {
  const { currentSession, setSession } = useCountrySession();
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {(['pakistan', 'china'] as const).map(c => {
        const act = currentSession === c;
        const col = c === 'pakistan' ? '#16a34a' : '#dc2626';
        return (
          <button key={c} onClick={() => setSession(c)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 0', borderRadius: 10,
            border: act ? `2px solid ${col}` : `1px solid ${border}`,
            background: act ? `${col}18` : surface,
            fontWeight: 700, fontSize: 13, color: act ? col : sub, cursor: 'pointer',
          }}>
            <img src={c === 'pakistan' ? '/images/pakistan.png' : '/images/china.png'} alt={c} style={{ width: 20, height: 14, objectFit: 'contain' }} />
            {c === 'pakistan' ? 'Pakistan' : 'China'}
          </button>
        );
      })}
    </div>
  );
};

// â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CategoryBar: React.FC = () => {
  const { products } = useStore();
  const { currentSession } = useCountrySession();
  const cats = useMemo(() => {
    const s = new Set(products.filter(p => (p.country || 'pakistan') === currentSession).map(p => p.category).filter(Boolean));
    return Array.from(s).sort().slice(0, 8);
  }, [products, currentSession]);

  const emojis: Record<string, string> = { Electronics: 'ðŸ“±', Audio: 'ðŸŽ§', Accessories: 'âŒš', Fashion: 'ðŸ‘—', Home: 'ðŸ ', Sports: 'âš½', Beauty: 'ðŸ’„', Toys: 'ðŸ§¸' };

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
      {[{ label: 'All', emoji: 'ðŸ›ï¸', path: '/shop' }, ...cats.map(c => ({ label: c, emoji: emojis[c] || 'ðŸ·ï¸', path: `/shop?category=${encodeURIComponent(c)}` }))].map(item => (
        <Link key={item.label} to={item.path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, textDecoration: 'none', minWidth: 56 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: surface, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {item.emoji}
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: sub, textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
        </Link>
      ))}
    </div>
  );
};

// ── Payment Banners ─────────────────────────────────────────────────────────────
const PaymentBanners: React.FC = () => {
  const { currentUser, orders } = useStore();
  if (!currentUser) return null;
  const my = (orders || []).filter((o: any) => o.userId === currentUser.id);
  const awaiting = my.filter((o: any) => ['easypaisa','jazzcash'].includes(o.paymentMethod) && o.paymentStatus === 'awaiting_approval');
  const approved = my.filter((o: any) => ['easypaisa','jazzcash'].includes(o.paymentMethod) && o.paymentStatus === 'approved');
  const rejected = my.filter((o: any) => ['easypaisa','jazzcash'].includes(o.paymentMethod) && o.paymentStatus === 'rejected');
  if (!awaiting.length && !approved.length && !rejected.length) return null;

  const banners = [
    ...awaiting.map((o: any) => ({
      bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)',
      icon: '\u23F3', iconBg: 'rgba(245,158,11,0.15)', textColor: '#fbbf24',
      title: 'Payment Awaiting Approval',
      sub: `Order #${(o.id||'').slice(0,8).toUpperCase()} \u2014 Admin review ho raha hai`,
    })),
    ...approved.map(() => ({
      bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.3)',
      icon: '\u2705', iconBg: 'rgba(22,163,74,0.15)', textColor: '#4ade80',
      title: '\uD83C\uDF89 Payment Approved!',
      sub: 'Aapka order ab active hai \u2014 track karein',
    })),
    ...rejected.map(() => ({
      bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)',
      icon: '\u274C', iconBg: 'rgba(239,68,68,0.15)', textColor: '#f87171',
      title: 'Payment Rejected',
      sub: 'Details ke liye tap karein \u2014 support se rabta karein',
    })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {banners.map((b, i) => (
        <Link key={i} to="/orders" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: b.bg, border: `1px solid ${b.border}`, borderRadius: 14, textDecoration: 'none' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: b.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {b.icon}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: b.textColor, margin: '0 0 2px' }}>{b.title}</p>
            <p style={{ fontSize: 11, color: sub, margin: 0 }}>{b.sub}</p>
          </div>
          <ArrowRight size={14} style={{ color: b.textColor, flexShrink: 0 }} />
        </Link>
      ))}
    </div>
  );
};

// â”€â”€ Zeels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ZP { id: string; title: string; thumbnail_url?: string; video_url: string; likes_count: number; product?: { name: string; price: number; image: string } | null; }
const ZeelsSection: React.FC = () => {
  const [zeels, setZeels] = useState<ZP[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('zeels').select('id,title,thumbnail_url,video_url,likes_count,product_id').eq('is_active', true).order('sort_order', { ascending: true }).limit(6);
      if (!data?.length) { setLoading(false); return; }
      const ids = data.filter(z => z.product_id).map(z => z.product_id as string);
      let pm: Record<string, any> = {};
      if (ids.length) { const { data: pd } = await supabase.from('products').select('id,name,price,image').in('id', ids); if (pd) pm = Object.fromEntries(pd.map((p: any) => [p.id, p])); }
      setZeels(data.map((z: any) => ({ ...z, product: z.product_id ? pm[z.product_id] ?? null : null })));
      setLoading(false);
    })();
  }, []);
  if (!loading && !zeels.length) return null;
  return (
    <div>
      <SecHeader title="Zeels" badge="New" badgeColor="#8b5cf6" to="/zeels" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {loading ? Array(6).fill(0).map((_, i) => <div key={i} style={{ borderRadius: 10, background: surface, aspectRatio: '9/16' }} />)
          : zeels.map(z => (
            <Link key={z.id} to="/zeels" style={{ borderRadius: 10, overflow: 'hidden', background: '#000', aspectRatio: '9/16', display: 'block', position: 'relative', textDecoration: 'none' }}>
              {z.thumbnail_url && <img src={z.thumbnail_url} alt={z.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={12} style={{ color: '#fff', marginLeft: 2 }} />
              </div>
              <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '2px 5px' }}>
                <Heart size={8} style={{ color: '#f87171', fill: '#f87171' }} />
                <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{z.likes_count >= 1000 ? `${(z.likes_count / 1000).toFixed(1)}k` : z.likes_count}</span>
              </div>
              {z.product && <p style={{ position: 'absolute', bottom: 5, left: 5, color: '#c4b5fd', fontSize: 9, fontWeight: 800, margin: 0 }}>Rs. {z.product.price.toLocaleString()}</p>}
            </Link>
          ))}
      </div>
    </div>
  );
};

// â”€â”€ Affiliate Brands â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface HB { id: string; name: string; logo_url: string; affiliate_url: string; }
const AffiliateBrands: React.FC = () => {
  const [brands, setBrands] = useState<HB[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('affiliate_brands').select('id,name,logo_url,affiliate_url').eq('is_active', true).order('sort_order').limit(12);
      setBrands(data || []);
      setLoading(false);
    })();
  }, []);
  if (!loading && !brands.length) return null;
  return (
    <div>
      <SecHeader title="Affiliate Brands" badge="Partners" badgeColor="#f59e0b" to="/affiliate-brands" />
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {loading ? Array(5).fill(0).map((_, i) => <div key={i} style={{ width: 76, height: 88, borderRadius: 14, background: surface, flexShrink: 0 }} />)
          : brands.map(b => (
            <button key={b.id} onClick={() => window.open(b.affiliate_url, '_blank', 'noopener,noreferrer')} style={{
              flexShrink: 0, width: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
              background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: '11px 7px', cursor: 'pointer',
            }}>
              <img src={b.logo_url} alt={b.name} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 7 }} onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/36x36/1a1a1a/888?text=${b.name[0]}`; }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: text, textAlign: 'center', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.name}</span>
            </button>
          ))}
      </div>
    </div>
  );
};

// â”€â”€ Affiliate Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface AP { id: string; name: string; price: number; image_url: string; affiliate_url: string; brand_name?: string | null; }
const AffiliateProducts: React.FC = () => {
  const [products, setProducts] = useState<AP[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('affiliate_products').select('id,name,price,image_url,affiliate_url,brand_name').eq('is_active', true).order('sort_order').limit(10);
      setProducts(data || []);
      setLoading(false);
    })();
  }, []);
  if (!loading && !products.length) return null;
  return (
    <div>
      <SecHeader title="Top Picks" badge="Affiliate" badgeColor={accent} to="/affiliate-products" />
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {loading ? Array(4).fill(0).map((_, i) => <div key={i} style={{ width: 145, height: 210, borderRadius: 14, background: surface, flexShrink: 0 }} />)
          : products.map(p => (
            <div key={p.id} style={{ flexShrink: 0, width: 145, background: surface, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/145x120/1a1a1a/888?text=P`; }} />
              <div style={{ padding: '9px 10px 11px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {p.brand_name && <span style={{ fontSize: 9, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.brand_name}</span>}
                <p style={{ fontSize: 12, fontWeight: 700, color: text, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                {p.price > 0 && <p style={{ fontSize: 13, fontWeight: 800, color: accent, margin: '2px 0 6px' }}>Rs. {p.price.toLocaleString()}</p>}
                <button onClick={() => window.open(p.affiliate_url, '_blank', 'noopener,noreferrer')} style={{
                  marginTop: 'auto', background: accent, color: '#fff', border: 'none', borderRadius: 7,
                  padding: '6px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  Order <ExternalLink size={10} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// â”€â”€ Featured Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FeaturedProducts: React.FC = () => {
  const { products: all, favorites, toggleFavorite, addToCart, currentUser, formatPrice, isDbLoading } = useStore();
  const { currentSession } = useCountrySession();
  const navigate = useNavigate();
  const products = useMemo(() => all.filter(p => (p.country || 'pakistan') === currentSession), [all, currentSession]);
  const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const featured = useMemo(() => shuffle(products.filter(p => p.featured)).slice(0, 6), [products]);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const handleAdd = async (product: any) => {
    if (!currentUser) { navigate('/login'); return; }
    await addToCart(product);
    setAdded(p => ({ ...p, [product.id]: true }));
    setTimeout(() => setAdded(p => ({ ...p, [product.id]: false })), 2000);
  };

  if (!isDbLoading && !featured.length) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontWeight: 800, fontSize: 17, color: text }}>Featured</span>
        <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: accent, textDecoration: 'none' }}>View All <ArrowRight size={13} /></Link>
      </div>
      {isDbLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {Array(4).fill(0).map((_, i) => <div key={i} style={{ borderRadius: 16, background: surface, height: 280 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {featured.map(p => {
            const isFav = favorites.includes(p.id);
            const isAdded = added[p.id];
            const oos = (p.stock || 0) <= 0;
            return (
              <div key={p.id} style={{
                background: surface, border: `1px solid ${border}`,
                borderRadius: 16, overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                opacity: oos ? 0.7 : 1,
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}>
                {/* Square image */}
                <div style={{ position: 'relative', aspectRatio: '1/1' }}>
                  <Link to={`/product/${p.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                    <ProductImageSlider images={p.images?.length ? p.images : [p.image]} name={p.name} />
                  </Link>
                  {/* Fav button */}
                  <button onClick={() => toggleFavorite(p.id)} style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 32, height: 32, borderRadius: '50%',
                    background: isFav ? 'rgba(236,72,153,0.9)' : 'rgba(0,0,0,0.6)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                  }}>
                    <Heart size={14} style={{ color: '#fff', fill: isFav ? '#fff' : 'none' }} />
                  </button>
                  {/* OOS badge */}
                  {oos && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
                      Out of Stock
                    </div>
                  )}
                  {/* Country flag only */}
                  {p.country && (
                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '3px 6px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
                      <img src={p.country === 'china' ? '/images/china.png' : '/images/pakistan.png'} alt="" style={{ width: 16, height: 11, objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '11px 12px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.category}</span>
                  <Link to={`/product/${p.id}`} style={{ textDecoration: 'none' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                  </Link>
                  <p style={{ fontSize: 16, fontWeight: 900, color: text, margin: '4px 0 8px', letterSpacing: '-0.01em' }}>{formatPrice(p.price)}</p>
                  <button onClick={() => handleAdd(p)} disabled={oos} style={{
                    background: isAdded ? '#16a34a' : oos ? '#2a2a2a' : `linear-gradient(135deg, ${accent}, #4f46e5)`,
                    color: oos ? sub : '#fff', border: 'none', borderRadius: 10,
                    padding: '9px 0', fontSize: 12, fontWeight: 700,
                    cursor: oos ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: isAdded || oos ? 'none' : '0 3px 10px rgba(99,102,241,0.35)',
                    transition: 'all 0.2s',
                  }}>
                    {isAdded ? <><CheckCircle2 size={13} /> Added!</> : oos ? 'Out of Stock' : <><ShoppingCart size={13} /> Add to Cart</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ── App Download Section (Supabase-connected, advanced UI) ────────────────────
const AppDownloadSection: React.FC = () => {
  const links = useDownloadLinks();
  const android = links.android;
  const win = links.windows;
  const ios = links.ios;

  const platforms = [
    android?.is_active ? {
      href: android.download_url,
      icon: '\uD83E\uDD16',
      label: 'Android',
      sub: android.sub_label || 'Free Download',
      version: android.version,
      bg: 'linear-gradient(135deg,#16a34a,#15803d)',
      shadow: 'rgba(22,163,74,0.4)',
      border: 'transparent',
      textColor: '#fff',
      disabled: false,
    } : null,
    win?.is_active ? {
      href: win.download_url,
      icon: '\uD83D\uDCBB',
      label: 'Windows',
      sub: win.sub_label || 'Desktop App',
      version: win.version,
      bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
      shadow: 'rgba(37,99,235,0.4)',
      border: 'transparent',
      textColor: '#fff',
      disabled: false,
    } : null,
    {
      href: ios?.download_url || '#',
      icon: '\uD83C\uDF4E',
      label: 'iOS',
      sub: ios?.sub_label || 'Coming Soon',
      version: '',
      bg: 'rgba(255,255,255,0.04)',
      shadow: 'transparent',
      border: 'rgba(255,255,255,0.1)',
      textColor: '#666',
      disabled: true,
    },
  ].filter(Boolean) as Array<{href:string;icon:string;label:string;sub:string;version:string;bg:string;shadow:string;border:string;textColor:string;disabled:boolean}>;

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      }} />
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(99,102,241,0.25)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -20, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', filter: 'blur(35px)', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'relative', padding: '22px 18px 20px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          {/* App icon */}
          <div style={{
            width: 56, height: 56, borderRadius: 16, overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <img src="/images/zaman-logo.png" alt="Zaman Mall" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>Zaman Mall App</p>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#4ade80',
                background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: 10, padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>Free</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>Shop smarter — anywhere, anytime</p>
            {/* Stars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ color: '#fbbf24', fontSize: 10 }}>&#9733;</span>
              ))}
              <span style={{ color: '#64748b', fontSize: 10, marginLeft: 3 }}>4.8 (10k+)</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

        {/* Platform buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {platforms.map(p => (
            <a
              key={p.label}
              href={p.disabled ? undefined : p.href}
              target={p.disabled ? undefined : '_blank'}
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 16px', borderRadius: 14,
                background: p.bg,
                border: p.border !== 'transparent' ? `1px solid ${p.border}` : 'none',
                boxShadow: p.shadow !== 'transparent' ? `0 4px 16px ${p.shadow}` : 'none',
                textDecoration: 'none',
                opacity: p.disabled ? 0.45 : 1,
                cursor: p.disabled ? 'not-allowed' : 'pointer',
                pointerEvents: p.disabled ? 'none' : 'auto',
              } as React.CSSProperties}
            >
              {/* Platform icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                {p.icon}
              </div>
              {/* Text */}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: p.textColor, lineHeight: 1.2 }}>
                  {p.label}
                  {p.version ? <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 6, fontWeight: 500 }}>v{p.version}</span> : null}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: p.disabled ? '#555' : 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{p.sub}</p>
              </div>
              {/* Arrow */}
              {!p.disabled && (
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>&#8595;</span>
                </div>
              )}
              {p.disabled && (
                <span style={{ fontSize: 10, color: '#555', fontWeight: 600, flexShrink: 0 }}>Soon</span>
              )}
            </a>
          ))}
        </div>

        {/* Footer note */}
        <p style={{ color: '#475569', fontSize: 11, margin: '14px 0 0', textAlign: 'center' }}>
          100% Free &nbsp;&bull;&nbsp; No subscription required
        </p>
      </div>
    </div>
  );
};
export const MobileHomeView: React.FC = () => (
  <div style={{ background: bg, minHeight: '100vh', paddingBottom: 80 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 14 }}>

      <div style={{ padding: '0 16px' }}><PaymentBanners /></div>

      {/* Promo banner — above ads */}
      <PromoBanner />

      <AdBanner />

      <div style={{ padding: '0 16px' }}><CountrySwitcher /></div>

      <div style={{ padding: '0 16px' }}><FeaturedProducts /></div>

      <div style={{ padding: '0 16px' }}><ZeelsSection /></div>

      <div style={{ padding: '0 16px' }}><AffiliateBrands /></div>

      <div style={{ padding: '0 16px' }}><AffiliateProducts /></div>

      {/* Trust badges */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([
            { icon: '\u2705', title: '100% Genuine', desc: 'Authentic products', color: '#16a34a' },
            { icon: '\uD83D\uDE80', title: 'Fast Delivery',  desc: 'Nationwide',         color: '#3b82f6' },
            { icon: '\uD83D\uDD12', title: 'Secure Payment', desc: 'Data protected',      color: '#8b5cf6' },
            { icon: '\uD83D\uDD04', title: 'Easy Returns',   desc: '7-day policy',        color: '#f59e0b' },
          ] as Array<{icon:string;title:string;desc:string;color:string}>).map(item => (
            <div key={item.title} style={{
              background: surface, border: `1px solid ${border}`,
              borderRadius: 14, padding: '14px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: `${item.color}18`, border: `1px solid ${item.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 12, color: text, margin: 0 }}>{item.title}</p>
                <p style={{ fontSize: 10, color: sub, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* App download */}
      <div id="mobile-app-download" style={{ padding: '0 16px' }}>
        <AppDownloadSection />
      </div>

    </div>
  </div>
);
