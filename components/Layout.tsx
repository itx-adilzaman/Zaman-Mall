
import React, { useState, useEffect, useRef, useMemo } from 'react';
// Fix: Use standard named imports for react-router-dom v6
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, Zap, Heart, User, LogOut, LayoutDashboard, Settings, History, MapPin, MessageSquare, Home, ShoppingBag, Info, Phone, ChevronDown, Tag, Camera } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { ZamanAI } from './ZamanAI';
import { supabase } from '../services/supabase';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDownloadLinks } from '../hooks/useDownloadLinks';
import { MobileNav } from './MobileNav';
import { MobileBottomNav } from './MobileBottomNav';
import { VisualSearchModal } from './VisualSearchModal';
import { AISearchDropdown } from './AISearchDropdown';

const Navbar: React.FC = () => {
  const { cart, products, favorites, currentUser, logout, messages, formatPrice } = useStore();
  const downloadLinks = useDownloadLinks();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAffiliateOpen, setIsAffiliateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const affiliateRef = useRef<HTMLDivElement>(null);
  const [isAppHovered, setIsAppHovered] = useState(false);
  const appHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAppMouseEnter = () => {
    if (appHoverTimeoutRef.current) {
      clearTimeout(appHoverTimeoutRef.current);
      appHoverTimeoutRef.current = null;
    }
    setIsAppHovered(true);
  };

  const handleAppMouseLeave = () => {
    appHoverTimeoutRef.current = setTimeout(() => {
      setIsAppHovered(false);
    }, 250);
  };

  const location = useLocation();
  const navigate = useNavigate();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const favCount = favorites.length;

  const unreadRepliesCount = useMemo(() => {
    if (!currentUser) return 0;
    return messages.filter(m =>
      (m.userId === currentUser.id || m.email === currentUser.email) &&
      m.reply &&
      m.replyReadByUser === false
    ).length;
  }, [messages, currentUser]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (affiliateRef.current && !affiliateRef.current.contains(event.target as Node)) {
        setIsAffiliateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (appHoverTimeoutRef.current) {
        clearTimeout(appHoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsProfileOpen(false);
    setIsAffiliateOpen(false);
    setIsAppHovered(false);
    setIsVisualSearchOpen(false);
    setSearchQuery('');
  }, [location]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Home',     path: '/'       },
    { name: 'Shop',     path: '/shop'   },
    { name: 'Zeels',    path: '/zeels'  },
    { name: 'About',    path: '/about'  },
    { name: 'Contact',  path: '/contact'},
  ];

  const isAffiliateActive =
    location.pathname === '/affiliate-brands' ||
    location.pathname === '/affiliate-products';

  const scrollToAppSection = () => {
    const el = document.getElementById('get-app-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 shadow-lg shadow-blue-600/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-110">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-gradient-shift"></div>
                  {/* Rotating ring effect */}
                  <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-yellow-400 via-blue-400 to-purple-400 bg-clip-text group-hover:animate-spin-slow"></div>
                  {/* Logo */}
                  <img src="/images/zaman-logo.png" alt="Zaman Sons Mall" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {/* Pulse effect */}
                  <div className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 animate-ping"></div>
                </div>
                <div className="flex flex-col">
                  <span className="hidden sm:block text-xl font-black tracking-tighter gradient-text uppercase leading-tight group-hover:animate-pulse">ZAMAN SONS</span>
                  <span className="hidden sm:block text-xs text-yellow-400 font-bold uppercase tracking-wider opacity-80 group-hover:opacity-100 transition-opacity group-hover:animate-pulse">MALL</span>
                </div>
              </Link>
              {/* App Download Button with Hover Popup - Desktop Only */}
              <div
                className="relative hidden sm:block group/appbtn"
                onMouseEnter={handleAppMouseEnter}
                onMouseLeave={handleAppMouseLeave}
              >
                <button
                  type="button"
                  onClick={scrollToAppSection}
                  className="relative inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-emerald-400/60 bg-gradient-to-r from-emerald-500/40 via-emerald-400/30 to-blue-500/40 text-[8px] sm:text-[10px] font-semibold tracking-[0.12em] sm:tracking-[0.18em] uppercase text-emerald-50 shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 hover:border-emerald-200 transition-all duration-300"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-white/10 via-emerald-200/15 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                  <span className="relative flex items-center justify-center w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-emerald-500/80 border border-emerald-100 shadow-[0_0_14px_rgba(16,185,129,1)] text-[9px] sm:text-[11px] font-black">
                    ↓
                  </span>
                  <span className="relative flex items-center gap-1">
                    <span className="hidden lg:inline">Zaman Mall</span>
                    <span>App</span>
                  </span>
                </button>

                {/* Hover Popup Card */}
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 pt-2.5 w-72 transition-all duration-300 ease-out z-[200] ${
                    isAppHovered
                      ? 'opacity-100 visible translate-y-0 pointer-events-auto'
                      : 'opacity-0 invisible translate-y-2 pointer-events-none group-hover/appbtn:opacity-100 group-hover/appbtn:visible group-hover/appbtn:translate-y-0 group-hover/appbtn:pointer-events-auto'
                  }`}
                >
                  {/* Invisible bridge so mouse path between button and card never loses hover */}
                  <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />

                  {/* Arrow */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#0d1424] border-t border-l border-white/10 z-10"></div>

                  <div className="relative bg-[#0d1424] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                    {/* Top gradient bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex-shrink-0 shadow-lg shadow-blue-500/30">
                          <img src="/images/zaman-logo.png" alt="Zaman Mall" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-white font-black text-sm leading-tight">Zaman Mall App</p>
                          <p className="text-emerald-400 text-[10px] font-semibold">Free Download</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-emerald-400 text-[9px] font-bold uppercase tracking-wider">Live</span>
                        </div>
                      </div>

                      {/* QR Code + Info */}
                      <div className="flex gap-3">
                        {/* QR Code */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                          <div className="w-24 h-24 bg-white rounded-xl p-1.5 shadow-lg shadow-black/30 flex items-center justify-center overflow-hidden">
                            <img
                              src="/images/app-qr-code.png"
                              alt="Zaman Mall App QR Code"
                              className="w-full h-full object-contain rounded-lg"
                            />
                          </div>
                          <p className="text-gray-500 text-[9px] text-center leading-tight">Scan to<br/>Download</p>
                        </div>

                        {/* Download Links */}
                        <div className="flex-1 flex flex-col gap-2">
                          <a
                            href={downloadLinks.android?.download_url || 'https://drive.google.com/file/d/1RREImUr7m2O_q0VI7rT3T6zIGBHGUV2Z/view?usp=sharing'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2.5 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 hover:border-green-400/40 transition-all duration-200 group/dl${downloadLinks.android?.is_active === false ? ' opacity-40 pointer-events-none' : ''}`}
                          >
                            <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover/dl:scale-110 transition-transform shadow-md shadow-green-500/30">
                              <img src="/svg/android-logo-svgrepo-com.svg" alt="Android" className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 leading-none mb-0.5">Get it on</p>
                              <p className="text-white text-xs font-bold leading-none">Android</p>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-green-400 ml-auto"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                          </a>

                          <a
                            href={downloadLinks.windows?.download_url || 'https://drive.google.com/file/d/15kyUbtcxknEn4nPg_JCOajuWR6yixEXD/view?usp=sharing'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2.5 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 hover:border-orange-400/40 transition-all duration-200 group/dl${downloadLinks.windows?.is_active === false ? ' opacity-40 pointer-events-none' : ''}`}
                          >
                            <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover/dl:scale-110 transition-transform shadow-md shadow-orange-500/30">
                              <img src="/svg/windows-svgrepo-com.svg" alt="Windows" className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 leading-none mb-0.5">Download for</p>
                              <p className="text-white text-xs font-bold leading-none">Windows</p>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-orange-400 ml-auto"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                          </a>

                          <div className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl opacity-40 cursor-not-allowed">
                            <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <img src="/svg/apple-173-svgrepo-com.svg" alt="iOS" className="w-4 h-4 opacity-50" />
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-500 leading-none mb-0.5">Coming Soon</p>
                              <p className="text-gray-500 text-xs font-bold leading-none">iOS App</p>
                            </div>
                            <span className="text-[9px] text-gray-600 ml-auto">⏳</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                        <p className="text-gray-500 text-[9px]">⭐ 4.8 &nbsp;·&nbsp; 10k+ Downloads &nbsp;·&nbsp; Free</p>
                        <span className="text-[9px] text-emerald-400 font-semibold">v1.0.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile only - no popup */}
              <button
                type="button"
                onClick={scrollToAppSection}
                className="relative sm:hidden inline-flex items-center gap-1 px-2 py-1 rounded-full border border-emerald-400/60 bg-gradient-to-r from-emerald-500/40 via-emerald-400/30 to-blue-500/40 text-[8px] font-semibold tracking-[0.12em] uppercase text-emerald-50 shadow-lg shadow-emerald-500/40 transition-all duration-300"
              >
                <span className="relative flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500/80 border border-emerald-100 shadow-[0_0_14px_rgba(16,185,129,1)] text-[9px] font-black">↓</span>
                <span>App</span>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-blue-400 ${location.pathname === link.path ? 'text-blue-400' : 'text-gray-300'}`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Affiliate dropdown — Brands / Products toggle */}
              <div className="relative" ref={affiliateRef}>
                <button
                  onClick={() => setIsAffiliateOpen(o => !o)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-blue-400 ${isAffiliateActive ? 'text-blue-400' : 'text-gray-300'}`}
                >
                  Brands
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isAffiliateOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isAffiliateOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-[#0f172a] border border-[#1e293b] rounded-2xl overflow-hidden z-[60] shadow-2xl shadow-black/60 animate-fade-in">
                    {/* Toggle pill */}
                    <div className="p-2 border-b border-[#1e293b]">
                      <div className="flex rounded-xl overflow-hidden bg-[#1e293b] p-1 gap-1">
                        <Link
                          to="/affiliate-brands"
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-200
                            ${location.pathname === '/affiliate-brands'
                              ? 'bg-yellow-500 text-black shadow-md'
                              : 'text-gray-400 hover:text-white hover:bg-[#334155]'}`}
                        >
                          <ShoppingBag size={11} />
                          Brands
                        </Link>
                        <Link
                          to="/affiliate-products"
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-200
                            ${location.pathname === '/affiliate-products'
                              ? 'bg-indigo-500 text-white shadow-md'
                              : 'text-gray-400 hover:text-white hover:bg-[#334155]'}`}
                        >
                          <Tag size={11} />
                          Products
                        </Link>
                      </div>
                    </div>
                    {/* Quick links */}
                    <div className="p-2 space-y-1">
                      <Link
                        to="/affiliate-brands"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/15 hover:text-yellow-400 rounded-xl transition-colors"
                      >
                        <ShoppingBag size={14} className="text-yellow-500" />
                        <div>
                          <p className="font-bold text-xs">Affiliate Brands</p>
                          <p className="text-[10px] text-gray-500">Top partner brands</p>
                        </div>
                      </Link>
                      <Link
                        to="/affiliate-products"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-indigo-500/15 hover:text-indigo-400 rounded-xl transition-colors"
                      >
                        <Tag size={14} className="text-indigo-400" />
                        <div>
                          <p className="font-bold text-xs">Affiliate Products</p>
                          <p className="text-[10px] text-gray-500">Handpicked top picks</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>


            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Visual Search AI Lens */}
              <button
                onClick={() => setIsVisualSearchOpen(true)}
                className="relative p-2 text-gray-300 hover:text-cyan-400 transition-all hover:bg-cyan-500/10 hover:scale-110 active:scale-95 rounded-full group/visbtn"
                title="Visual Search (Search with Image / Camera)"
                aria-label="Open Visual Search"
              >
                <Camera size={20} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#0d1424] border border-cyan-500/40 text-cyan-300 opacity-0 group-hover/visbtn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                  AI Lens
                </span>
              </button>

              <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-300 hover:text-white transition-all hover:bg-white/10 hover:scale-110 active:scale-95 rounded-full" aria-label="Open Search">
                <Search size={20} />
              </button>

              <Link to="/favorites" className={`relative p-2 text-gray-300 hover:text-white transition-all hover:bg-white/10 hover:scale-110 active:scale-95 rounded-full ${location.pathname === '/favorites' ? 'text-pink-400 bg-white/5' : ''}`}>
                <Heart size={20} className={favCount > 0 ? "fill-pink-500 text-pink-500" : ""} />
                {favCount > 0 && <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white">{favCount}</span>}
              </Link>

              <Link to="/cart" className={`relative p-2 text-gray-300 hover:text-white transition-all hover:bg-white/10 hover:scale-110 active:scale-95 rounded-full ${location.pathname === '/cart' ? 'text-blue-400 bg-white/5' : ''}`}>
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white animate-pulse">{cartCount}</span>}
              </Link>

              {/* User Profile / Auth */}
              <div className="relative" ref={profileRef}>
                {currentUser ? (
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="group/profile flex items-center gap-2 p-1 glass hover:bg-white/15 hover:scale-110 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 rounded-full transition-all duration-300 border-white/10 border relative"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden group-hover/profile:ring-2 ring-blue-400 ring-offset-2 ring-offset-[#030712] transition-all">
                      <img src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} alt={currentUser.name} className="w-full h-full object-cover" />
                    </div>
                    {unreadRepliesCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce shadow-lg ring-2 ring-black">
                        {unreadRepliesCount}
                      </span>
                    )}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="p-2 text-gray-300 hover:text-blue-400 transition-all hover:bg-white/10 hover:scale-110 active:scale-90 rounded-full"
                    title="Sign In"
                  >
                    <User size={20} />
                  </Link>
                )}

                {isProfileOpen && currentUser && (
                  <div className="absolute right-0 mt-3 w-64 glass border border-white/10 rounded-2xl overflow-hidden z-[60] shadow-2xl animate-fade-in py-2">
                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                      <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest truncate">{currentUser.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors relative">
                      <Settings size={16} /> My Profile
                      {unreadRepliesCount > 0 && (
                        <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-red-500/50"></span>
                      )}
                    </Link>
                    <Link to="/messages" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors">
                      <MessageSquare size={16} /> My Messages
                      {unreadRepliesCount > 0 && <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white">{unreadRepliesCount}</span>}
                    </Link>
                    <Link to="/addresses" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors">
                      <MapPin size={16} /> My Addresses
                    </Link>
                    <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors">
                      <History size={16} /> Order History
                    </Link>

                    <button onClick={() => { logout(); navigate('/'); }} className="w-full border-t border-white/5 mt-1 flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-300 hover:text-white transition-colors">
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden glass border-t border-white/10 animate-fade-in overflow-hidden">
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link to="/favorites" className="block px-3 py-3 text-base font-medium text-pink-400 hover:bg-pink-400/10 rounded-xl transition-colors">Wishlist</Link>

              {/* Brands / Products toggle in mobile */}
              <div className="px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Affiliate</p>
                <div className="flex rounded-xl overflow-hidden bg-white/5 p-1 gap-1">
                  <Link
                    to="/affiliate-brands"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-200
                      ${location.pathname === '/affiliate-brands'
                        ? 'bg-yellow-500 text-black shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                  >
                    <ShoppingBag size={12} />
                    Brands
                  </Link>
                  <Link
                    to="/affiliate-products"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-200
                      ${location.pathname === '/affiliate-products'
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                  >
                    <Tag size={12} />
                    Products
                  </Link>
                </div>
              </div>

              {currentUser ? (
                <>
                  <Link to="/profile" className="block px-3 py-3 text-base font-medium text-gray-300 hover:bg-white/5 rounded-xl flex items-center justify-between">
                    My Profile
                    {unreadRepliesCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadRepliesCount}</span>}
                  </Link>
                  <Link to="/addresses" className="block px-3 py-3 text-base font-medium text-gray-300 hover:bg-white/5 rounded-xl">My Addresses</Link>
                  <Link to="/orders" className="block px-3 py-3 text-base font-medium text-gray-300 hover:bg-white/5 rounded-xl">Orders</Link>
                  <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left px-3 py-3 text-base font-medium text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">Logout</button>
                </>
              ) : (
                <Link to="/login" className="block px-3 py-3 text-base font-medium text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors">Login / Register</Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Global Search Overlay */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl animate-fade-in flex flex-col items-center pt-20 px-4"
          onClick={() => setIsSearchOpen(false)}
        >
          <button
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-6 right-6 p-3 text-gray-400 hover:text-white transition-colors hover:bg-white/10 rounded-full"
          >
            <X size={28} />
          </button>

          <div
            className="w-full max-w-2xl transform transition-all scale-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative group">
              <Search
                className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors z-10"
                size={24}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="w-full bg-white/5 border-2 border-white/10 rounded-3xl py-6 pl-16 pr-16 text-xl focus:ring-4 focus:ring-blue-600/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setIsVisualSearchOpen(true);
                }}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-gray-400 hover:text-cyan-300 transition-all active:scale-95"
                title="Search with Image / Camera (AI Lens)"
              >
                <Camera size={22} />
              </button>

              {/* AI Dropdown — portal rendered, anchored to input */}
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
                maxHeight={440}
              />
            </form>

            {/* Helper tip when nothing typed yet */}
            {searchQuery.trim().length < 2 && (
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Type at least 2 characters — AI will find related products automatically
                </p>
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

const Footer: React.FC = () => {
  const downloadLinks = useDownloadLinks();
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 6000);
    }
  };

  return (
    <footer className="relative mt-20 overflow-hidden">
      {/* Top gradient border */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {/* Newsletter Banner */}
      <div className="relative bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.08)_0%,_transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Stay in the Loop</h3>
            <p className="text-gray-400 text-sm mt-1">Get exclusive deals, new arrivals & offers straight to your inbox.</p>
          </div>

          {subscribed ? (
            /* ── Success Message ── */
            <div className="flex items-center gap-4 w-full md:w-auto px-6 py-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🎉</span>
              </div>
              <div>
                <p className="text-emerald-400 font-black text-sm leading-tight">Shukriya! Aap subscribe ho gaye.</p>
                <p className="text-emerald-400/60 text-xs mt-0.5">Hum aapko exclusive deals aur offers bhejte rahenge.</p>
              </div>
            </div>
          ) : (
            /* ── Subscribe Form ── */
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 md:w-72 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-full text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-5 group w-fit">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform duration-300">
                  <img src="/images/zaman-logo.png" alt="Zaman Sons Mall" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="block text-lg font-black tracking-tight gradient-text leading-tight">ZAMAN SONS</span>
                  <span className="block text-[10px] text-yellow-400 font-bold uppercase tracking-[0.2em]">SUPER MALL</span>
                </div>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Pakistan's trusted online shopping destination — quality products, fast delivery, and unbeatable prices since 2026.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3 mt-6">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Follow Us</span>
                <div className="flex gap-2">
                  {[
                    { label: 'Facebook', href: 'https://web.facebook.com/adilagral786', color: 'hover:bg-blue-600/20 hover:border-blue-500/40 hover:text-blue-400', icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    )},
                    { label: 'Instagram', href: 'https://www.instagram.com/zamanmall.pk', color: 'hover:bg-pink-600/20 hover:border-pink-500/40 hover:text-pink-400', icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    )},
                    { label: 'WhatsApp', href: 'https://wa.me/923489054973', color: 'hover:bg-green-600/20 hover:border-green-500/40 hover:text-green-400', icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.984 0C5.368 0 0 5.368 0 11.984c0 2.105.549 4.076 1.508 5.789L.054 23.946l6.287-1.641A11.934 11.934 0 0 0 11.984 24C18.6 24 24 18.632 24 12.016 24 5.4 18.6 0 11.984 0zm0 21.818a9.83 9.83 0 0 1-5.016-1.374l-.36-.214-3.73.977.997-3.648-.234-.375A9.818 9.818 0 0 1 2.182 12c0-5.408 4.403-9.818 9.802-9.818 5.4 0 9.818 4.41 9.818 9.818 0 5.408-4.418 9.818-9.818 9.818z"/></svg>
                    )},
                    { label: 'YouTube', href: 'https://www.youtube.com/@qurankareem-az', color: 'hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-400', icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon fill="#020617" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
                    )},
                    { label: 'TikTok', href: 'https://www.tiktok.com/@zamanmall.pk', color: 'hover:bg-white/10 hover:border-white/30 hover:text-white', icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
                    )},
                  ].map(({ label, href, color, icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 transition-all duration-200 hover:scale-110 ${color}`}
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-6 space-y-2">
                <a href="mailto:malikmuhammadadilzaman@gmail.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors group">
                  <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  malikmuhammadadilzaman@gmail.com
                </a>
                <a href="https://wa.me/923489054973" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors group">
                  <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-green-500/10 transition-colors flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  </span>
                  0348-9054973
                </a>
                <a href="tel:+923345866715" className="flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors group">
                  <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-yellow-500/10 transition-colors flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.4a16 16 0 0 0 6.29 6.29l.61-.61a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </span>
                  0334-5866715
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"></span>
                Shop
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'All Products', to: '/shop' },
                  { label: 'Electronics', to: '/shop?category=Electronics' },
                  { label: 'Audio', to: '/shop?category=Audio' },
                  { label: 'Accessories', to: '/shop?category=Accessories' },
                  { label: 'Home & Living', to: '/shop?category=Home' },
                  { label: 'New Arrivals', to: '/shop' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                      <span className="w-0 h-px bg-blue-400 group-hover:w-3 transition-all duration-200 inline-block"></span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-purple-500 inline-block"></span>
                Company
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'About Us', to: '/about' },
                  { label: 'Contact Us', to: '/contact' },
                  { label: 'Zeels', to: '/zeels' },
                  { label: 'Careers', to: '/about' },
                  { label: 'Press & Media', to: '/about' },
                  { label: 'Blog', to: '/' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                      <span className="w-0 h-px bg-purple-400 group-hover:w-3 transition-all duration-200 inline-block"></span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-green-500 inline-block"></span>
                Support
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Help Center', to: '/contact' },
                  { label: 'My Orders', to: '/orders' },
                  { label: 'Track Order', to: '/orders' },
                  { label: 'Returns & Refunds', to: '/contact' },
                  { label: 'Shipping Info', to: '/contact' },
                  { label: 'FAQ', to: '/contact' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                      <span className="w-0 h-px bg-green-400 group-hover:w-3 transition-all duration-200 inline-block"></span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-14 pt-8 border-t border-white/5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
                  title: 'Secure Payments',
                  sub: '100% Protected',
                  color: 'blue',
                },
                {
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
                  title: 'Fast Delivery',
                  sub: 'Nationwide Shipping',
                  color: 'yellow',
                },
                {
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>,
                  title: 'Easy Returns',
                  sub: '7-Day Return Policy',
                  color: 'green',
                },
                {
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>,
                  title: '24/7 Support',
                  sub: 'Always Here for You',
                  color: 'purple',
                },
              ].map(({ icon, title, sub, color }) => (
                <div key={title} className={`flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-${color}-500/20 hover:bg-${color}-500/5 transition-all duration-200 group`}>
                  <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-${color}-400 flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{title}</p>
                    <p className="text-gray-500 text-xs">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* App Download Section */}
          <div id="get-app-section" className="mt-10 pt-8 border-t border-white/5">
            {/* Heading - centered */}
            <div className="text-center mb-8">
              <p className="text-xs text-blue-400 font-bold uppercase tracking-[0.3em] mb-2">📱 Available On</p>
              <h3 className="text-2xl font-black text-white tracking-tight">Download the Zaman Mall App</h3>
              <p className="text-gray-400 text-sm mt-2">Shop smarter, faster — anywhere, anytime.</p>
            </div>

            {/* Buttons - centered */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-3xl mx-auto">

              {/* Android */}
              {downloadLinks.android?.is_active && (
              <a
                href={downloadLinks.android.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center gap-4 px-6 py-4 bg-white/5 border border-green-500/20 rounded-2xl hover:bg-green-500/10 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-105 active:scale-95 group"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300">
                  <img src="/svg/android-logo-svgrepo-com.svg" alt="Android" className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Get it on</p>
                  <p className="text-white font-black text-base leading-tight">Android</p>
                  <p className="text-green-400 text-[10px] font-semibold">{downloadLinks.android.sub_label || 'Free Download ↓'}</p>
                </div>
              </a>
              )}

              {/* iOS - Coming Soon */}
              <div
                className="w-full sm:w-auto flex items-center gap-4 px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl cursor-not-allowed opacity-50 select-none"
                title="Coming Soon"
              >
                <div className="w-11 h-11 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
                  <img src="/svg/apple-173-svgrepo-com.svg" alt="iOS" className="w-6 h-6 opacity-50" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest">Coming Soon</p>
                  <p className="text-gray-500 font-black text-base leading-tight">iOS App</p>
                  <p className="text-gray-600 text-[10px] font-semibold">In Development ⏳</p>
                </div>
              </div>

              {/* Windows */}
              {downloadLinks.windows?.is_active && (
              <a
                href={downloadLinks.windows.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center gap-4 px-6 py-4 bg-white/5 border border-orange-500/20 rounded-2xl hover:bg-orange-500/10 hover:border-orange-400/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:scale-105 active:scale-95 group"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300">
                  <img src="/svg/windows-svgrepo-com.svg" alt="Windows" className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Download for</p>
                  <p className="text-white font-black text-base leading-tight">Windows</p>
                  <p className="text-orange-400 text-[10px] font-semibold">{downloadLinks.windows.sub_label || 'Desktop App ↓'}</p>
                </div>
              </a>
              )}

            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs text-center md:text-left">
              © {new Date().getFullYear()} <span className="text-gray-400 font-semibold">Zaman Sons Super Mall</span>. All rights reserved. Made with ❤️ in Pakistan.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              <Link to="/about" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
              <span className="text-white/10">|</span>
              <Link to="/about" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
              <span className="text-white/10">|</span>
              <Link to="/contact" className="hover:text-gray-300 transition-colors">Cookie Policy</Link>
              <span className="text-white/10">|</span>
              <Link to="/contact" className="hover:text-gray-300 transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Add custom animations
const style = document.createElement('style');
style.textContent = `
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes gradient-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes shimmer {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(100%) rotate(45deg); }
  }
  .animate-gradient-shift { background-size: 200% 200%; animation: gradient-shift 3s ease infinite; }
  .animate-spin-slow { animation: spin-slow 4s linear infinite; }
  .animate-gradient-flow { background-size: 200% 200%; animation: gradient-flow 4s ease infinite; }
  .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
`;
if (!document.head.querySelector('style[data-logo-animations]')) {
  style.setAttribute('data-logo-animations', 'true');
  document.head.appendChild(style);
}

// ── Welcome Popup ─────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: 'Good Morning',   emoji: '🌅' };
  if (h >= 12 && h < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (h >= 17 && h < 21) return { text: 'Good Evening',   emoji: '🌆' };
  return                         { text: 'Good Night',     emoji: '🌙' };
};

const WELCOME_MESSAGES = [
  'Zaman Sons Super Mall mein khush aamdeed! Aaj kuch naya dhoondein. 🛍️',
  'Pakistan aur China ke behtareen products — sirf aapke liye. ✨',
  'Har order ke sath quality guaranteed. Aapka bharosa, humari zimmedari. 🚀',
  'Naye arrivals aa gaye hain! Zeels aur Top Picks zaroor dekhen. 🎁',
  'Fast delivery, premium quality — Zaman Sons ka waada. 💎',
  'Aaj koi khas cheez cart mein daalein? Hamari shop ready hai! 🇵🇰',
];

const WelcomePopup: React.FC = () => {
  const [visible, setVisible] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const greeting = React.useMemo(() => getGreeting(), []);
  const msg = React.useMemo(() => WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)], []);

  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(() => setVisible(false), 350);
  };

  React.useEffect(() => {
    if (!visible) return;
    const t = setTimeout(close, 7000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[9999] flex justify-center pt-5 px-4"
      style={{
        animation: closing
          ? 'wpOut 0.35s ease forwards'
          : 'wpIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
      }}
    >
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
        style={{
          background: 'rgba(12,12,22,0.88)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        {/* Left dot accent */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {greeting.emoji}
        </div>

        {/* Divider */}
        <div className="w-px h-7 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Text */}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="text-white font-bold text-sm flex-shrink-0">{greeting.text}!</span>
          <span className="text-gray-400 text-xs leading-relaxed truncate">{msg}</span>
        </div>

        {/* Close */}
        <button onClick={close}
          className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ml-1"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#d1d5db'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes wpIn  { from { opacity:0; transform:translateY(-16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes wpOut { from { opacity:1; transform:translateY(0)     } to { opacity:0; transform:translateY(-10px) } }
      `}</style>
    </div>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Scroll progress handler
    const handleScroll = () => {
      const scrollProgress = document.getElementById('scroll-progress');
      if (scrollProgress) {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        scrollProgress.style.width = scrolled + '%';
      }
    };

    // Scroll reveal observer — only needed on desktop
    if (!isMobile) {
      const observerOptions = { root: null, threshold: 0.1, rootMargin: '0px' };
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('revealed');
        });
      }, observerOptions);

      const observeElements = () => {
        const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
        reveals.forEach(el => revealObserver.observe(el));
      };
      observeElements();
      window.addEventListener('scroll', handleScroll);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        revealObserver.disconnect();
      };
    }
    return undefined;
  }, [location.pathname, isMobile]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isZeelsPage = location.pathname === '/zeels';
  // Pages that are fullscreen on mobile — no navbar, no bottom tab
  // Note: Zeels on mobile now shows a "download app" screen (not fullscreen video)
  const isFullscreenMobile = location.pathname === '/login' || location.pathname === '/register';

  // ── MOBILE layout ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
        {/* Navbar — hidden on fullscreen pages (Zeels, Login, Register) */}
        {!isFullscreenMobile && <MobileNav />}
        {/* Page content — no padding on fullscreen pages */}
        <main style={{ paddingTop: isFullscreenMobile ? 0 : 56 }}>
          {children}
        </main>
        <ZamanAI />
        {/* Bottom tab bar — hidden on fullscreen pages */}
        {!isFullscreenMobile && <MobileBottomNav />}
      </div>
    );
  }

  // ── DESKTOP layout (unchanged) ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <WelcomePopup />
      <Navbar />
      <main className={`flex-grow ${isZeelsPage ? '' : 'pt-16 pb-20 md:pb-0'}`}>
        {children}
      </main>
      <ZamanAI />
      {!isZeelsPage && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-dark border-t border-white/10 bg-white/[0.03] backdrop-blur-xl px-1 py-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
          <BottomNav />
        </div>
      )}
      {!isZeelsPage && <Footer />}
    </div>
  );
};

const BottomNav: React.FC = () => {
  const location = useLocation();
  const tabs = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/shop', label: 'Shop', icon: ShoppingBag },
    { path: '/about', label: 'About', icon: Info },
    { path: '/contact', label: 'Contact', icon: Phone },
  ];
  const activeIndex = Math.max(0, tabs.findIndex(t => location.pathname === t.path));

  return (
    <div className="relative">
      <div className="absolute inset-x-0 -top-2 h-1 bg-gradient-to-r from-blue-500/40 via-amber-500/40 to-pink-500/40 animate-pulse"></div>
      <div className="relative flex">
        <div className="absolute top-0 left-0 h-full w-1/4 transition-transform duration-500" style={{ transform: `translateX(${activeIndex * 100}%)` }}>
          <div className="mx-1 my-0.5 h-[calc(100%-0.4rem)] rounded-2xl bg-gradient-to-r from-blue-500/20 via-amber-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 shadow-inner animate-pulse"></div>
        </div>
        {tabs.map((t, i) => {
          const Icon = t.icon;
          const isActive = activeIndex === i;
          return (
            <Link
              key={t.path}
              to={t.path}
              className={`w-1/4 py-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-400'} active:scale-95`}
            >
              <div className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-white/10 border border-white/10 shadow-lg' : 'bg-transparent'}`}>
                <Icon size={16} className={`${isActive ? 'text-white' : 'text-gray-500'} transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
