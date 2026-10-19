import React, { useState, useMemo, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, RotateCcw, MessageSquare,
  Users, Image, Smartphone, Layers, LogOut, Menu, Bell, Sun, Moon,
  Activity, Shield, Film, ShoppingBag, Tag, CreditCard, Link2, X, AlertTriangle,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  { path: '/',            label: 'Dashboard',         icon: LayoutDashboard, exact: true },
  { path: '/products',    label: 'Products',           icon: Package },
  { path: '/inventory',   label: 'Inventory',          icon: AlertTriangle,  badge: 'lowStockCount' },
  { path: '/orders',      label: 'Orders',             icon: ShoppingCart,  badge: 'pendingOrders' },
  { path: '/payments',    label: 'Payments',           icon: CreditCard,    badge: 'pendingPayments' },
  { path: '/returns',     label: 'Returns',            icon: RotateCcw,     badge: 'pendingReturns' },
  { path: '/messages',    label: 'Messages',           icon: MessageSquare, badge: 'pendingMessages' },
  { path: '/users',       label: 'Users',              icon: Users },
  { path: '/banners',     label: 'Banners',            icon: Image },
  { path: '/versions',    label: 'App Versions',       icon: Smartphone },
  { path: '/categories',         label: 'Categories',         icon: Layers },
  { path: '/zeels',              label: 'Zeels',              icon: Film },
  { path: '/affiliate-brands',   label: 'Affiliate Brands',   icon: ShoppingBag },
  { path: '/affiliate-products', label: 'Affiliate Products', icon: Tag },
  { path: '/downloads',          label: 'Download Links',     icon: Link2 },
  { path: '/notifications',      label: 'Notifications',      icon: Bell },
];

const NAV_GROUPS = [
  { label: 'Overview', items: NAV.slice(0, 1) },
  { label: 'Commerce', items: NAV.slice(1, 7) },
  { label: 'Content',  items: NAV.slice(7, 16) },
];

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-between w-14 h-7 rounded-full px-1 transition-all duration-300 border"
      style={{
        background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.12)',
        borderColor: 'rgba(245,158,11,0.25)',
      }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <Sun  size={11} className={`transition-all duration-300 ${isDark ? 'opacity-30 text-amber-400' : 'opacity-100 text-amber-500'}`} />
      <Moon size={11} className={`transition-all duration-300 ${isDark ? 'opacity-100 text-amber-400' : 'opacity-30 text-amber-500'}`} />
      <span
        className="absolute w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg transition-all duration-300 flex items-center justify-center"
        style={{
          transform: isDark ? 'translateX(28px)' : 'translateX(0px)',
          boxShadow: '0 2px 6px rgba(245,158,11,0.5)',
          left: '3px',
        }}
      >
        {isDark ? <Moon size={9} className="text-white" /> : <Sun size={9} className="text-white" />}
      </span>
    </button>
  );
}

export default function Layout() {
  const { currentUser, logout, orders, messages, products } = useAdmin();
  const { isDark } = useTheme();
  const location = useLocation();

  // Desktop: sidebar collapsed/expanded state
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: drawer open/closed
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const badges = useMemo(() => ({
    pendingOrders:   orders.filter(o => o.status === 'pending').length,
    pendingPayments: orders.filter(o =>
      (o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash') &&
      o.paymentStatus === 'awaiting_approval'
    ).length,
    pendingReturns:  orders.filter(o => o.returnRequest?.status === 'pending').length,
    pendingMessages: messages.filter(m => !m.read).length,
    lowStockCount:   products.filter(p => p.stock <= 10).length,
  }), [orders, messages, products]);

  const totalAlerts = badges.pendingOrders + badges.pendingReturns + badges.pendingMessages;

  const currentPage = useMemo(() => {
    for (const item of NAV) {
      if (item.exact
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path) && item.path !== '/'
      ) return item.label;
    }
    return 'Dashboard';
  }, [location.pathname]);

  // Shared sidebar content rendered in both desktop aside and mobile drawer
  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}
        >
          <Shield size={14} className="text-white" />
        </div>
        {/* Always show label in mobile drawer; respect collapsed on desktop */}
        <div className="overflow-hidden">
          <p className="text-xs font-bold leading-none" style={{ color: 'var(--text)' }}>Zaman Mall</p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--brand)' }}>Admin Panel</p>
        </div>
        {/* Close button only visible in mobile drawer */}
        {onNavClick && (
          <button className="btn-icon ml-auto w-8 h-8" onClick={onNavClick}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="px-2 mb-1.5 text-[9px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ path, label, icon: Icon, badge, exact }) => {
                const isActive = exact
                  ? location.pathname === path
                  : location.pathname.startsWith(path) && path !== '/';
                const count = badge ? badges[badge as keyof typeof badges] : 0;
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={onNavClick}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="flex-1 text-sm truncate">{label}</span>
                    {count > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shrink-0">
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: user + logout */}
      <div className="px-2 pb-3 pt-2 border-t space-y-1 shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div
          className="flex items-center gap-2.5 p-2.5 rounded-xl mb-1"
          style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}
        >
          <div className="avatar w-8 h-8 rounded-lg shrink-0">
            {currentUser?.avatar
              ? <img src={currentUser.avatar} alt="" />
              : <Shield size={14} style={{ color: 'var(--brand)' }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
              {currentUser?.name || 'Admin'}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--brand)' }}>
              Root Access
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="nav-item w-full"
          style={{ color: 'var(--text-subtle)' }}
        >
          <LogOut size={15} className="shrink-0" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden transition-theme" style={{ background: 'var(--bg)' }}>

      {/* ── MOBILE DRAWER OVERLAY ───────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── MOBILE DRAWER ───────────────────────────────── */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 h-full transition-transform duration-300 ease-in-out lg:hidden"
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: mobileOpen ? '0 0 40px rgba(0,0,0,0.5)' : 'none',
        }}
        aria-label="Mobile navigation"
      >
        <SidebarContent onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col h-full shrink-0 overflow-hidden transition-all duration-300 border-r"
        style={{
          width: collapsed ? '64px' : '224px',
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        aria-label="Desktop navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}
          >
            <Shield size={14} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold leading-none" style={{ color: 'var(--text)' }}>Zaman Mall</p>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--brand)' }}>Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-2 mb-1.5 text-[9px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ path, label, icon: Icon, badge, exact }) => {
                  const isActive = exact
                    ? location.pathname === path
                    : location.pathname.startsWith(path) && path !== '/';
                  const count = badge ? badges[badge as keyof typeof badges] : 0;
                  return (
                    <NavLink
                      key={path}
                      to={path}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={16} className="shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-sm">{label}</span>
                          {count > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shrink-0">
                              {count > 9 ? '9+' : count}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && count > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: user + logout */}
        <div className="px-2 pb-3 pt-2 border-t space-y-1 shrink-0" style={{ borderColor: 'var(--border)' }}>
          {!collapsed && (
            <div
              className="flex items-center gap-2.5 p-2.5 rounded-xl mb-1"
              style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}
            >
              <div className="avatar w-8 h-8 rounded-lg shrink-0">
                {currentUser?.avatar
                  ? <img src={currentUser.avatar} alt="" />
                  : <Shield size={14} style={{ color: 'var(--brand)' }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                  {currentUser?.name || 'Admin'}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--brand)' }}>
                  Root Access
                </p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`nav-item w-full ${collapsed ? 'justify-center' : ''}`}
            style={{ color: 'var(--text-subtle)' }}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header
          className="h-14 flex items-center px-4 gap-3 border-b shrink-0 z-10"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-icon lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={16} />
          </button>

          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="btn-icon hidden lg:inline-flex"
            title="Toggle sidebar"
          >
            <Menu size={16} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{currentPage}</h1>
              {totalAlerts > 0 && (
                <span
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                  style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--brand)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <Activity size={10} className="animate-pulse" />
                  {totalAlerts} pending
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium hidden md:block" style={{ color: 'var(--text-subtle)' }}>
              Zaman Sons Super Mall — Command Center
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Live status — desktop only */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold"
              style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.15)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Live
            </div>

            {/* Theme toggle — hidden on very small screens to save space */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Notifications */}
            <button className="btn-icon relative" title="Notifications">
              <Bell size={15} />
              {totalAlerts > 0 && <span className="notif-dot" />}
            </button>

            {/* Avatar */}
            <div className="avatar w-8 h-8" title={currentUser?.name}>
              {currentUser?.avatar
                ? <img src={currentUser.avatar} alt="" />
                : <Shield size={14} style={{ color: 'var(--brand)' }} />
              }
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6" style={{ background: 'var(--bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
