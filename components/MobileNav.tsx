/**
 * MobileNav — Dark minimal top navbar for mobile.
 * Dark theme: #0d0d0d background, subtle borders.
 * Drawer: nav links at top, user profile section at bottom (above logout).
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, X, Menu, Heart, LogOut,
  History, MapPin, MessageSquare, Settings, LayoutDashboard, User,
  Home, ShoppingBag, Play, Tag, Info, Phone, ChevronRight, Camera
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { VisualSearchModal } from './VisualSearchModal';
import { AISearchDropdown } from './AISearchDropdown';

// ── color tokens ───────────────────────────────────────────────────────────
const C = {
  bg:        '#0d0d0d',
  surface:   '#1a1a1a',
  border:    '#2a2a2a',
  text:      '#f0f0f0',
  subtext:   '#888',
  accent:    '#6366f1',
  accentBg:  'rgba(99,102,241,0.12)',
  danger:    '#ef4444',
  dangerBg:  'rgba(239,68,68,0.10)',
};

export const MobileNav: React.FC = () => {
  const { cart, products, favorites, currentUser, logout, messages, formatPrice } = useStore();
  const [isSearchOpen, setIsSearchOpen]   = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [isMenuOpen,   setIsMenuOpen]     = useState(false);
  const [searchQuery,  setSearchQuery]    = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return messages.filter(
      m => (m.userId === currentUser.id || m.email === currentUser.email) &&
           m.reply && m.replyReadByUser === false
    ).length;
  }, [messages, currentUser]);

  useEffect(() => {
    setIsSearchOpen(false);
    setIsVisualSearchOpen(false);
    setIsMenuOpen(false);
    setSearchQuery('');
  }, [location]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Home',               path: '/',                    Icon: Home },
    { label: 'Shop',               path: '/shop',                Icon: ShoppingBag },
    { label: 'Zeels',              path: '/zeels',               Icon: Play },
    { label: 'Affiliate Brands',   path: '/affiliate-brands',    Icon: Tag },
    { label: 'Affiliate Products', path: '/affiliate-products',  Icon: Tag },
    { label: 'About',              path: '/about',               Icon: Info },
    { label: 'Contact',            path: '/contact',             Icon: Phone },
  ];

  return (
    <>
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56 }}>
          {/* Hamburger */}
          <button onClick={() => setIsMenuOpen(o => !o)} style={{ padding: 6, color: C.text, background: 'none', border: 'none', cursor: 'pointer' }}>
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/images/zaman-logo.png" alt="Zaman Mall" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: C.text, letterSpacing: '-0.02em' }}>Zaman Mall</span>
          </Link>

          {/* Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              onClick={() => setIsVisualSearchOpen(true)}
              style={{ padding: 6, color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Visual Search (AI Lens)"
              aria-label="Visual Search"
            >
              <Camera size={20} />
            </button>
            <button onClick={() => setIsSearchOpen(true)} style={{ padding: 6, color: C.subtext, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Search size={20} />
            </button>
            <Link to="/favorites" style={{ padding: 6, color: C.subtext, position: 'relative', display: 'flex' }}>
              <Heart size={20} style={favorites.length > 0 ? { color: '#ec4899', fill: '#ec4899' } : {}} />
              {favorites.length > 0 && <Badge count={favorites.length} color="#ec4899" />}
            </Link>
            <Link to="/cart" style={{ padding: 6, color: C.subtext, position: 'relative', display: 'flex' }}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <Badge count={cartCount} color={C.accent} />}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Search Overlay ───────────────────────────────────────────── */}
      {isSearchOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column' }}
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            style={{ background: C.surface, padding: '12px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.6)', borderBottom: `1px solid ${C.border}`, position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
              {/* Input wrapper — relative so dropdown positions correctly */}
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={17} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.subtext, zIndex: 1 }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search with AI..."
                  autoComplete="off"
                  style={{
                    width: '100%', paddingLeft: 36, paddingRight: 10, paddingTop: 10, paddingBottom: 10,
                    background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10,
                    fontSize: 14, outline: 'none', color: C.text, boxSizing: 'border-box',
                  }}
                />

                {/* AI Dropdown — mobile bottom sheet via portal */}
                <AISearchDropdown
                  query={searchQuery}
                  anchorRef={searchInputRef}
                  onSubmit={(q) => {
                    navigate(`/shop?q=${encodeURIComponent(q)}`);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  onClose={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  maxHeight={360}
                />
              </div>

              <button
                type="button"
                onClick={() => { setIsSearchOpen(false); setIsVisualSearchOpen(true); }}
                style={{ padding: '8px 10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                title="Search with Image (AI Lens)"
              >
                <Camera size={18} />
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                style={{ padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.subtext, cursor: 'pointer', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Side Drawer ──────────────────────────────────────────────── */}
      {isMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex' }} onClick={() => setIsMenuOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
          <div
            style={{
              position: 'relative', width: 288, height: '100%',
              background: C.bg, borderRight: `1px solid ${C.border}`,
              overflowY: 'auto', display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/images/zaman-logo.png" alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <p style={{ fontWeight: 800, fontSize: 15, color: C.text, lineHeight: 1.2 }}>Zaman Sons</p>
                <p style={{ fontSize: 10, color: C.subtext, fontWeight: 600 }}>Super Mall</p>
              </div>
            </div>

            {/* Nav links */}
            <nav style={{ padding: '6px 0', flex: 1 }}>
              {navLinks.map(({ label, path, Icon }) => {
                const active = location.pathname === path;
                return (
                  <Link key={path} to={path} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                    fontSize: 14, fontWeight: active ? 700 : 500,
                    color: active ? C.accent : C.text,
                    background: active ? C.accentBg : 'transparent',
                    textDecoration: 'none',
                    borderLeft: active ? `3px solid ${C.accent}` : '3px solid transparent',
                  }}>
                    <Icon size={16} style={{ color: active ? C.accent : C.subtext }} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* ── Bottom: profile + logout ── */}
            {currentUser ? (
              <div style={{ borderTop: `1px solid ${C.border}`, paddingBottom: 8 }}>
                {/* User card */}
                <Link to="/profile" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                  textDecoration: 'none', borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                      alt={currentUser.name}
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.border}` }}
                    />
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute', top: -3, right: -3, width: 14, height: 14,
                        background: C.danger, borderRadius: '50%', border: `1.5px solid ${C.bg}`,
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p>
                    <p style={{ fontSize: 11, color: C.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: C.subtext, flexShrink: 0 }} />
                </Link>

                {/* Account links */}
                {[
                  { label: 'My Profile',  path: '/profile',   Icon: Settings,      badge: unreadCount },
                  { label: 'My Orders',   path: '/orders',    Icon: History,       badge: 0 },
                  { label: 'Messages',    path: '/messages',  Icon: MessageSquare, badge: unreadCount },
                  { label: 'Addresses',   path: '/addresses', Icon: MapPin,        badge: 0 },
                ].map(({ label, path, Icon, badge }) => (
                  <Link key={path} to={path} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px',
                    fontSize: 13, fontWeight: 500, color: C.text, textDecoration: 'none',
                  }}>
                    <Icon size={15} style={{ color: C.subtext }} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge > 0 && (
                      <span style={{
                        background: C.danger, color: '#fff', borderRadius: 10, fontSize: 9,
                        fontWeight: 700, padding: '1px 6px', minWidth: 16, textAlign: 'center',
                      }}>{badge}</span>
                    )}
                  </Link>
                ))}

                {/* Logout — very bottom */}
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px',
                    width: '100%', background: 'none', border: 'none',
                    fontSize: 13, fontWeight: 600, color: C.danger, cursor: 'pointer',
                    borderTop: `1px solid ${C.border}`, marginTop: 4,
                  }}
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            ) : (
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
                <Link to="/login" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', background: C.accentBg, border: `1px solid ${C.accent}40`,
                  borderRadius: 12, color: C.accent, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                }}>
                  <User size={16} /> Login / Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Search Modal */}
      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
      />
    </>
  );
};

// ── Badge helper ────────────────────────────────────────────────────────────
const Badge: React.FC<{ count: number; color: string }> = ({ count, color }) => (
  <span style={{
    position: 'absolute', top: 0, right: 0,
    minWidth: 15, height: 15, background: color, color: '#fff',
    borderRadius: 8, fontSize: 9, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
  }}>
    {count}
  </span>
);
