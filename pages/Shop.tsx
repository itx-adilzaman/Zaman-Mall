
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Bot, Loader2, Star, Eye, Sparkles, Heart, X, Filter, Package, Zap, Activity, ArrowRight, Trophy, ChevronDown, ListFilter, CheckCircle2, AlertTriangle, Globe, ChevronLeft, ChevronRight, Truck, CreditCard, MapPin, Shield, Camera } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { ProductSkeleton } from '../components/Skeleton';
import { getShoppingAssistantResponse, getAdvancedSearchResults, identifyImageProduct } from '../services/gemini';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { useCountrySession } from '../contexts/CountrySessionContext';
import { ProductImageSlider } from '../components/ProductImageSlider';
import { useIsMobile } from '../hooks/useIsMobile';
import { MobileShopView } from '../components/MobileShopView';
import { VisualSearchModal } from '../components/VisualSearchModal';
import { AISearchDropdown } from '../components/AISearchDropdown';

type SortOption = 'Best Sellers' | 'Price: Low to High' | 'Price: High to Low';

const BATCH_SIZE = 20;

export const Shop: React.FC = () => {
  const { products: allProducts = [], addToCart, favorites = [], toggleFavorite, currentUser, formatPrice, isDbLoading } = useStore();
  const { currentSession, setSession: setCountrySession } = useCountrySession();
  const isMobile = useIsMobile();

  // On mobile, render the clean minimal mobile shop
  if (isMobile) return <MobileShopView />;
  
  // Local filtering for Shop page based on country session
  const products = useMemo(() => {
    return allProducts.filter(p => (p.country || 'pakistan') === currentSession);
  }, [allProducts, currentSession]);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeCategory = searchParams.get('category') || 'All';
  const activeSearch = searchParams.get('q') || '';

  const sortOptions: SortOption[] = ['Best Sellers', 'Price: Low to High', 'Price: High to Low'];
  
  // Single source of truth for sorting: URL Params
  const sortBy = useMemo(() => {
    const s = searchParams.get('sort');
    return sortOptions.includes(s as SortOption) ? (s as SortOption) : 'Best Sellers';
  }, [searchParams]);

  const handleSortChange = (option: SortOption) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('sort', option);
      return newParams;
    }, { replace: true });
    setIsSortOpen(false);
  };

  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<{ product: Product; score: number; reason: string }[]>([]);
  const [isRecLoading, setIsRecLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [addedStatus, setAddedStatus] = useState<Record<string, boolean>>({});
  const [currentBatch, setCurrentBatch] = useState(0);
  const [isBatchSwitching, setIsBatchSwitching] = useState(false);
  const [shuffledProducts, setShuffledProducts] = useState<Product[] | null>(null);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const initialSessionRef = useRef(currentSession);

  // Quick View state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewImage, setQuickViewImage] = useState(0);

  // Image Search state
  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [imageSearchPreview, setImageSearchPreview] = useState<string | null>(null);
  const imageSearchInputRef = useRef<HTMLInputElement>(null);

  const handleImageSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setImageSearchPreview(dataUrl);
      setIsImageSearching(true);

      // Extract base64 (strip the data:image/...;base64, prefix)
      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type;

      const query = await identifyImageProduct(base64, mimeType);

      if (query) {
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.set('q', query);
          return newParams;
        }, { replace: true });
      }
      setIsImageSearching(false);
    };
    reader.readAsDataURL(file);
    // Reset input so same image can be re-uploaded
    e.target.value = '';
  };

  const clearImageSearch = () => {
    setImageSearchPreview(null);
    setSearchParams(prev => { prev.delete('q'); return prev; }, { replace: true });
  };

  // Shuffle products on page load or when session changes
  useEffect(() => {
    if (products && products.length > 0) {
      const shuffleArray = (array: Product[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffled = shuffleArray(products);
      setShuffledProducts(shuffled);
    }
  }, [products, currentSession]);

  // Reload page when country session changes - REMOVED RELOAD TO PREVENT FLICKER
  useEffect(() => {
    // Session change handled by context and shuffledProducts effect
  }, [currentSession]);

  // AI search ranked IDs — used to boost relevance in filter
  const [aiRankedIds, setAiRankedIds] = useState<string[]>([]);

  const filteredProducts = useMemo(() => {
    const productsToUse = shuffledProducts || products;
    const q = activeSearch.toLowerCase().trim();

    // ── When no search query — just apply category filter ──
    if (!q) {
      return (productsToUse || []).filter(p => {
        if (!p) return false;
        return activeCategory === 'All' ||
          (p.category || '').trim().toLowerCase() === activeCategory.trim().toLowerCase();
      });
    }

    // ── With a query — score + sort by relevance ──────────
    const words = q.split(/\s+/).filter(w => w.length > 1);

    const scored = (productsToUse || [])
      .filter(p => {
        if (!p) return false;
        // category filter still applied
        return activeCategory === 'All' ||
          (p.category || '').trim().toLowerCase() === activeCategory.trim().toLowerCase();
      })
      .map(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat  = (p.category  || '').toLowerCase();

        let score = 0;

        // Exact full match bonuses
        if (name === q)           score += 100;
        else if (name.startsWith(q)) score += 80;
        else if (name.includes(q))   score += 60;
        if (cat.includes(q))         score += 40;
        if (desc.includes(q))        score += 20;

        // Per-word scoring
        for (const w of words) {
          if (name.includes(w))  score += 15;
          if (cat.includes(w))   score += 10;
          if (desc.includes(w))  score += 5;
        }

        // AI ranking boost — products the Gemini layer surfaced get promoted
        const aiPos = aiRankedIds.indexOf(p.id);
        if (aiPos !== -1) {
          // Higher boost for products ranked earlier by AI
          score += Math.max(30, 80 - aiPos * 8);
        }

        return { p, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ p }) => p);

    return scored;
  }, [shuffledProducts, products, activeCategory, activeSearch, aiRankedIds]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      
      if (sortBy === 'Price: Low to High') return priceA - priceB;
      if (sortBy === 'Price: High to Low') return priceB - priceA;
      if (sortBy === 'Best Sellers') {
        const ratingA = a.ratings?.length ? a.ratings.reduce((sum, r) => sum + r, 0) / a.ratings.length : 0;
        const ratingB = b.ratings?.length ? b.ratings.reduce((sum, r) => sum + r, 0) / b.ratings.length : 0;
        return ratingB - ratingA;
      }
      return 0;
    });
  }, [filteredProducts, sortBy]);

  const totalBatches = Math.max(1, Math.ceil(sortedProducts.length / BATCH_SIZE));
  const startIndex = currentBatch * BATCH_SIZE;
  const visibleProducts = useMemo(() => {
    return sortedProducts.slice(startIndex, startIndex + BATCH_SIZE);
  }, [sortedProducts, startIndex]);

  useEffect(() => {
    setCurrentBatch(0);
  }, [activeCategory, activeSearch, sortBy]);

  useEffect(() => {
    if (currentBatch > totalBatches - 1) {
      setCurrentBatch(Math.max(0, totalBatches - 1));
    }
  }, [currentBatch, totalBatches]);

  const handleNextBatch = () => {
    if (isBatchSwitching || currentBatch >= totalBatches - 1) return;
    setIsBatchSwitching(true);
    setCurrentBatch((prev) => prev + 1);
    setTimeout(() => setIsBatchSwitching(false), 300);
  };

  const handlePrevBatch = () => {
    if (currentBatch === 0 || isBatchSwitching) return;
    setIsBatchSwitching(true);
    setCurrentBatch((prev) => prev - 1);
    setTimeout(() => setIsBatchSwitching(false), 300);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentBatch]);

  useEffect(() => {
    const fetchRecs = async () => {
      if (activeSearch.length > 1 || activeCategory !== 'All') {
        setIsRecLoading(true);
        try {
          if (activeSearch.length > 1) {
            // Use advanced search — returns ranked IDs with scores and reasons
            const results = await getAdvancedSearchResults(activeSearch, products);
            // Store ranked IDs so filteredProducts can boost them
            setAiRankedIds(results.map(r => r.productId));
            // Top results shown as highlighted recommendations
            const topRecs = results.slice(0, 4).map(r => {
              const product = products.find(p => p.id === r.productId);
              return product ? { product, score: r.relevanceScore, reason: r.matchReason } : null;
            }).filter(Boolean) as { product: Product; score: number; reason: string }[];
            setRecommendedProducts(topRecs);
          } else {
            // Category-only filter — no text search, no AI needed
            setAiRankedIds([]);
            setRecommendedProducts([]);
          }
        } catch {
          setAiRankedIds([]);
          setRecommendedProducts([]);
        } finally {
          setIsRecLoading(false);
        }
      } else {
        setAiRankedIds([]);
        setRecommendedProducts([]);
        setIsRecLoading(false);
      }
    };
    const timer = setTimeout(fetchRecs, 600);
    return () => clearTimeout(timer);
  }, [activeSearch, activeCategory, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryChange = (cat: string) => {
    setSearchParams(prev => {
      if (cat === 'All') prev.delete('category');
      else prev.set('category', cat);
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCartWithFeedback = async (product: Product) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if ((product.stock || 0) <= 0) return;
    await addToCart(product);
    setAddedStatus(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedStatus(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleShopNow = async (product: Product) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if ((product.stock || 0) <= 0) return;
    await addToCart(product);
    navigate('/cart');
  };

  const categories = useMemo(() => {
    const uniqueCaps = new Set((products || []).map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(uniqueCaps).sort()];
  }, [products]);

  // Fetch total products count from database
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        // Using store's products length for now, can be replaced with DB query if needed
        setTotalProductsCount(products.length);
      } catch (err) {
        console.error('Error fetching total count:', err);
      }
    };
    fetchTotalCount();
  }, [products]);

  return (
    <div className="min-h-screen bg-[#020617] text-white pt-24 pb-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-0 right-1/2 w-[60vw] h-[60vw] bg-blue-600/5 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[40vw] h-[40vw] bg-purple-600/5 blur-[160px] rounded-full animate-float" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20 reveal">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 glass border-white/10 rounded-lg text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
              <Zap size={12} className="fill-current" /> Platinum Catalog
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">The Vault</h1>
          </div>

          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-6 items-center">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Text Search */}
              <div className="relative group flex-1 sm:flex-none">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-400 transition-colors z-10" size={20} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={activeSearch}
                  autoComplete="off"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 300)}
                  onChange={(e) => { setImageSearchPreview(null); setSearchParams(prev => { e.target.value ? prev.set('q', e.target.value) : prev.delete('q'); return prev; }, { replace: true }); }}
                  placeholder="Search with AI..."
                  className="w-full sm:w-72 bg-white/[0.03] border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-sm font-bold focus:ring-[12px] focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-gray-700"
                />
                {/* AI Dropdown — portal-rendered, full width, synced with page */}
                {isSearchFocused && (
                  <AISearchDropdown
                    query={activeSearch}
                    anchorRef={searchInputRef}
                    onResultsFetched={(ids) => {
                      // Immediately update ranked IDs so page grid re-sorts
                      // before the slower useEffect fires
                      setAiRankedIds(ids);
                    }}
                    onSubmit={(q) => {
                      setImageSearchPreview(null);
                      setSearchParams(prev => { q ? prev.set('q', q) : prev.delete('q'); return prev; }, { replace: true });
                      setIsSearchFocused(false);
                    }}
                    onClose={() => setIsSearchFocused(false)}
                    maxHeight={400}
                  />
                )}
              </div>

              {/* Image Search Button */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsVisualModalOpen(true)}
                  title="Search with Image / Camera (AI Lens)"
                  className="relative w-14 h-14 rounded-[1.5rem] border glass border-white/10 hover:border-cyan-500/50 hover:bg-cyan-600/10 flex items-center justify-center transition-all duration-300 shadow-lg group/cam"
                >
                  <Camera size={20} className="text-gray-400 group-hover/cam:text-cyan-400 transition-colors" />
                </button>

                {/* AI searching label */}
                {isImageSearching && (
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-blue-400 font-black uppercase tracking-widest animate-pulse whitespace-nowrap">
                    Scanning...
                  </span>
                )}
              </div>

            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="glass border border-white/10 rounded-full px-6 py-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{totalProductsCount} items</span>
              </div>
              <div className="relative w-full sm:w-auto" ref={sortRef}>
                <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`w-full sm:w-64 glass border rounded-full px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-between group ${isSortOpen ? 'border-blue-500/50 bg-white/[0.08]' : 'border-white/10 hover:border-white/20'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <ListFilter size={16} className={isSortOpen ? 'text-blue-400' : 'text-gray-500'} />
                  <span>Sort By: <span className="text-white ml-1">{sortBy}</span></span>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-500 ${isSortOpen ? 'rotate-180 text-blue-400' : 'text-gray-500'}`} />
              </button>

              <div className={`absolute right-0 top-full mt-4 w-full sm:w-64 glass-dark rounded-[2rem] border border-white/10 overflow-hidden z-[50] shadow-[0_30px_60px_rgba(0,0,0,0.8)] transition-all duration-500 origin-top ${isSortOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-none'
                }`}>
                <div className="p-2 space-y-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSortChange(option)}
                      className={`w-full px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-left transition-all flex items-center justify-between group ${sortBy === option
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      {option}
                      {sortBy === option && <Sparkles size={12} className="animate-pulse" />}
                    </button>
                  ))}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Country Session Switcher */}
        <div className="flex justify-start mb-12 reveal">
          <div className="glass border border-white/10 rounded-full p-2 flex gap-2">
            <button
              onClick={() => setCountrySession('pakistan')}
              className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${
                currentSession === 'pakistan'
                  ? 'bg-green-600 text-white shadow-xl shadow-green-600/30'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <img src="/images/pakistan.png" alt="Pakistan" className="w-6 h-6 object-contain" />
              Pakistan
            </button>
            <button
              onClick={() => setCountrySession('china')}
              className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${
                currentSession === 'china'
                  ? 'bg-red-600 text-white shadow-xl shadow-red-600/30'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <img src="/images/china.png" alt="China" className="w-6 h-6 object-contain" />
              China
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-3 space-y-12">
            <div className="reveal-left">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 mb-8 flex items-center gap-4">
                <Filter size={16} /> Filter Protocol
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 text-left flex items-center justify-between group ${activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 -translate-y-1'
                      : 'glass border-white/5 text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {cat}
                    {activeCategory === cat && <Sparkles size={14} className="animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="reveal-left stagger-2 glass p-8 rounded-[3rem] border-blue-600/20 bg-blue-600/5 group cursor-pointer hover:border-blue-600/40 transition-all">
              <Bot size={32} className="text-blue-500 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
              <h4 className="text-sm font-black uppercase tracking-widest mb-2">Consult Zaman AI</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Ask our executive curator for personalized asset recommendations.</p>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-16">

            {/* Image Search Result Banner */}
            {imageSearchPreview && !isImageSearching && activeSearch && (
              <div className="flex items-center gap-4 px-6 py-4 glass rounded-[2rem] border border-blue-500/20 bg-blue-600/5 animate-fade-in">
                <img src={imageSearchPreview} alt="searched" className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-0.5">AI Image Search</p>
                  <p className="text-sm font-bold text-white truncate">Showing results for: <span className="text-blue-300">"{activeSearch}"</span></p>
                </div>
                <button onClick={clearImageSearch} className="w-8 h-8 rounded-xl glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            )}

            {isRecLoading && (
              <div className="flex items-center justify-center py-10">
                <Activity className="animate-pulse text-blue-500" size={32} />
              </div>
            )}

            {recommendedProducts.length > 0 && !isRecLoading && (
              <div className="glass p-10 rounded-[4rem] border-blue-600/20 bg-white/[0.01] animate-fade-in shadow-3xl overflow-hidden relative reveal">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30">
                    <Trophy size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">AI Top Picks</h3>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest mt-0.5">Best matches for "{activeSearch}"</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <Sparkles size={11} className="text-indigo-400" />
                    <span className="text-indigo-400 text-[10px] font-black uppercase tracking-wider">Zaman AI</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendedProducts.map(({ product, score, reason }) => (
                    <Link key={product.id} to={`/product/${product.id}`} className="flex flex-col gap-3 p-4 glass border-white/5 rounded-[2rem] hover:bg-white/5 transition-all duration-500 hover:-translate-y-2 group">
                      <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden border border-white/10 shadow-xl">
                        <ProductImageSlider
                          images={product.images && product.images.length > 0 ? product.images : [product.image]}
                          name={product.name}
                        />
                        {/* Score badge */}
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10">
                          <span className="text-[10px] font-black" style={{ color: score >= 80 ? '#4ade80' : score >= 55 ? '#38bdf8' : '#a78bfa' }}>
                            {score}%
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white truncate group-hover:text-blue-400 transition-colors">{product.name}</h4>
                        {reason && <p className="text-[10px] text-indigo-400 font-semibold truncate mt-0.5">{reason}</p>}
                        <p className="text-base font-black gradient-text mt-1">{formatPrice(product.price || 0)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isDbLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {[...Array(6)].map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <>
                {/* Key Points Boxes — China */}
                {currentSession === 'china' && (
                  <div className="grid grid-cols-3 gap-4 reveal">
                    {[
                      { icon: '💵', label: 'Cash on Delivery', desc: 'No card needed', color: 'border-green-500/20 bg-green-500/5 hover:border-green-500/40' },
                      { icon: '🚪', label: 'Door-to-Door', desc: 'Delivered across Pakistan', color: 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40' },
                      { icon: '✅', label: 'Verified Suppliers', desc: 'Vetted China factories', color: 'border-red-500/20 bg-red-500/5 hover:border-red-500/40' },
                    ].map((pt, i) => (
                      <div key={i} className={`flex flex-col items-center text-center p-5 rounded-[2rem] border glass transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${pt.color}`}>
                        <span className="text-3xl mb-3">{pt.icon}</span>
                        <p className="text-white font-black text-[11px] uppercase tracking-wide leading-tight mb-1">{pt.label}</p>
                        <p className="text-gray-500 text-[10px] leading-snug">{pt.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Points Boxes — Pakistan */}
                {currentSession === 'pakistan' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 reveal">
                    {[
                      { icon: '💵', label: 'Cash on Delivery', desc: 'Pay when it arrives', color: 'border-green-500/20 bg-green-500/5 hover:border-green-500/40' },
                      { icon: '⚡', label: 'Fast Delivery', desc: '3-5 day shipping', color: 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40' },
                      { icon: '🔒', label: 'Secure Payment', desc: 'Your data protected', color: 'border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40' },
                      { icon: '🔄', label: 'Easy Returns', desc: '7-day return window', color: 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40' },
                    ].map((pt, i) => (
                      <div key={i} className={`flex flex-col items-center text-center p-5 rounded-[2rem] border glass transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${pt.color}`}>
                        <span className="text-3xl mb-3">{pt.icon}</span>
                        <p className="text-white font-black text-[11px] uppercase tracking-wide leading-tight mb-1">{pt.label}</p>
                        <p className="text-gray-500 text-[10px] leading-snug">{pt.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {visibleProducts.map((product, idx) => {
                  const avgRating = product.ratings?.length
                    ? product.ratings.reduce((a, b) => a + b, 0) / product.ratings.length
                    : 0;
                  const isFav = (favorites || []).includes(product.id);
                  const isAdded = addedStatus[product.id];
                  const isOutOfStock = (product.stock || 0) <= 0;

                  return (
                    <div
                      key={product.id}
                      className={`reveal stagger-${(idx % 4) + 1} group relative glass rounded-[4rem] border-white/5 bg-white/[0.01] transition-all duration-700 hover:-translate-y-4 hover:border-blue-500/20 shadow-2xl flex flex-col overflow-hidden perspective-1000 ${isOutOfStock ? 'opacity-80' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-white/[0.02] to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                      <div className="aspect-[4/5] relative overflow-hidden m-4 rounded-[3.5rem] block bg-[#030712]">
                        <Link to={`/product/${product.id}`} className="block w-full h-full">
                          <ProductImageSlider 
                            images={product.images && product.images.length > 0 ? product.images : [product.image]} 
                            name={product.name} 
                          />
                        </Link>

                        {/* Stabilized Hover Buttons */}
                        <div className="absolute top-6 right-6 flex flex-col gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-[30]">
                          <button
                            onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
                            className={`p-4 rounded-[1.25rem] glass transition-all duration-300 hover:scale-110 shadow-2xl relative z-[35] ${isFav ? 'bg-pink-600 border-pink-500 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                          >
                            <Heart size={20} className={isFav ? "fill-current" : ""} />
                          </button>
                        </div>

                        <div className={`absolute top-6 left-6 px-4 py-1.5 glass border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest z-10 backdrop-blur-2xl ${isOutOfStock ? 'text-red-400' : 'text-blue-400'}`}>
                          {isOutOfStock ? 'Out of Stock' : 'Certified Asset'}
                        </div>

                        {/* Country Tag */}
                        {product.country && (
                          <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 z-10 animate-fade-in group-hover:translate-y-[-100px] transition-transform duration-500">
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

                        <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col gap-3 translate-y-full group-hover:translate-y-0 transition-transform duration-700 z-[25]">
                          <button
                            disabled={isOutOfStock}
                            onClick={(e) => { e.preventDefault(); handleShopNow(product); }}
                            className="w-full py-4 rounded-[1.5rem] bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all hover:bg-blue-400 hover:text-white disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500"
                          >
                            {isOutOfStock ? <AlertTriangle size={16} /> : <Zap size={16} className="fill-current" />} {isOutOfStock ? 'Unavailable' : 'Shop Now'}
                          </button>
                          <button
                            disabled={isOutOfStock}
                            onClick={(e) => { e.preventDefault(); handleAddToCartWithFeedback(product); }}
                            className={`w-full py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all duration-500 group/btn disabled:opacity-50 ${isAdded
                              ? 'bg-green-600 text-white'
                              : 'glass border-white/20 text-white hover:bg-white/10'
                              }`}
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle2 size={16} className="animate-bounce" /> Added!
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={16} className="group-hover/btn:rotate-12 transition-transform" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                              </>
                            )}
                          </button>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"></div>
                      </div>

                      <div className="px-10 pb-10 pt-4 flex-grow flex flex-col relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-blue-500 text-[10px] font-black uppercase tracking-0.4em px-2 py-0.5 border-l-2 border-blue-600">{product.category}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-yellow-500 font-black bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20 shadow-lg backdrop-blur-md">
                            <Star size={12} className="fill-current" />
                            <span>{avgRating?.toFixed(1) || "0.0"}</span>
                          </div>
                        </div>

                        <Link to={`/product/${product.id}`} className="hover:text-blue-400 transition-colors">
                          <h3 className="text-2xl font-black mb-3 leading-tight text-white tracking-tight group-hover:translate-x-1 transition-transform">{product.name}</h3>
                        </Link>

                        <p className="text-gray-500 text-sm line-clamp-2 mb-8 leading-relaxed font-medium flex-grow opacity-80 group-hover:opacity-100 transition-opacity">{product.description}</p>

                        <div className="flex justify-between items-center mt-auto pt-8 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Market Value</span>
                            <span className="text-3xl font-black gradient-text tracking-tighter">{formatPrice(product.price || 0)}</span>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); setQuickViewProduct(product); setQuickViewImage(0); }}
                            className="w-14 h-14 glass hover:bg-blue-600 text-gray-400 hover:text-white rounded-[1.5rem] flex items-center justify-center transition-all duration-500 border border-white/5 hover:border-blue-500/40 shadow-xl group/eye"
                            title="Quick View"
                          >
                            <Eye size={22} className="group-hover/eye:scale-125 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

                {/* Batch Navigation */}
                <div className="flex items-center justify-between mt-12 glass p-6 rounded-[2rem] border-white/10">
                  <button
                    onClick={handlePrevBatch}
                    disabled={currentBatch === 0 || isBatchSwitching}
                    className="px-8 py-4 rounded-[1.5rem] glass border-white/10 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-4">
                    {isBatchSwitching ? (
                      <>
                        <Loader2 className="animate-spin text-blue-500" size={20} />
                        <span className="text-gray-500 text-xs font-medium">Loading batch...</span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                        Page {Math.min(currentBatch + 1, totalBatches)} / {totalBatches}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleNextBatch}
                    disabled={currentBatch >= totalBatches - 1 || isBatchSwitching}
                    className="px-8 py-4 rounded-[1.5rem] bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 shadow-xl shadow-blue-600/30"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-40 glass rounded-[4rem] border-dashed border-white/10 shadow-3xl bg-white/[0.01] reveal">
                <Package size={80} className="mx-auto text-gray-800 mb-8 animate-float" />
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Curation Incomplete</h3>
                <p className="text-gray-500 max-w-sm mx-auto font-medium">Our curators haven't designated any assets matching your current filters.</p>
                <button
                  onClick={() => setSearchParams({})}
                  className="mt-8 px-10 py-4 glass border-white/10 hover:border-blue-500/30 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-white hover:bg-blue-600 transition-all rounded-full"
                >
                  Clear Selection Protocol
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick View Sidebar ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity duration-500 ${quickViewProduct ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setQuickViewProduct(null)}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-[100] transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${quickViewProduct ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {quickViewProduct && (() => {
          const qp = quickViewProduct;
          const qImages = qp.images && qp.images.length > 0 ? qp.images : [qp.image];
          const qAvgRating = qp.ratings?.length
            ? qp.ratings.reduce((a, b) => a + b, 0) / qp.ratings.length
            : 0;
          const isChinaProduct = qp.country === 'china';

          const chinaPoints = [
            { icon: '✈️', label: 'Direct from China', desc: 'Delivered in 7–13 business days', color: 'border-red-500/30 bg-red-500/5' },
            { icon: '📦', label: 'Flat PKR 99 Shipping', desc: 'One flat fee per order', color: 'border-amber-500/30 bg-amber-500/5' },
            { icon: '🔒', label: 'Prepaid Only', desc: 'Card, bank or mobile wallet', color: 'border-green-500/30 bg-green-500/5' },
          ];
          const pakistanPoints = [
            { icon: '🚚', label: 'Cash on Delivery', desc: 'Pay when you receive', color: 'border-green-500/30 bg-green-500/5' },
            { icon: '⚡', label: 'Fast Delivery', desc: '2–5 business days nationwide', color: 'border-blue-500/30 bg-blue-500/5' },
            { icon: '🔄', label: 'Easy Returns', desc: 'Hassle-free return policy', color: 'border-purple-500/30 bg-purple-500/5' },
          ];
          const points = isChinaProduct ? chinaPoints : pakistanPoints;

          return (
            <div className="h-full bg-[#0a0f1a] border-l border-white/10 flex flex-col overflow-hidden shadow-[−40px_0_80px_rgba(0,0,0,0.8)]">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Eye size={18} className="text-blue-400" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Quick View</span>
                  {/* Country badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${isChinaProduct ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'}`}>
                    <img
                      src={isChinaProduct ? '/images/china.png' : '/images/pakistan.png'}
                      alt={qp.country}
                      className="w-4 h-3 object-contain"
                    />
                    {isChinaProduct ? 'Zaman Mall China' : 'Zaman Mall Pakistan'}
                  </div>
                </div>
                <button
                  onClick={() => setQuickViewProduct(null)}
                  className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">

                {/* Image Slider */}
                <div className="relative aspect-square bg-black flex-shrink-0 group/qimg">
                  <img
                    src={qImages[quickViewImage]}
                    alt={qp.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Prev / Next */}
                  {qImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setQuickViewImage(i => (i - 1 + qImages.length) % qImages.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-white opacity-100 hover:bg-white/20 transition-all"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setQuickViewImage(i => (i + 1) % qImages.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-white opacity-100 hover:bg-white/20 transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}

                  {/* Dot indicators */}
                  {qImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {qImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setQuickViewImage(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${quickViewImage === i ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Thumbnail strip */}
                  {qImages.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 flex gap-2 px-4 pb-3 pt-8 bg-gradient-to-t from-black/80 to-transparent overflow-x-auto">
                      {qImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setQuickViewImage(i)}
                          className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-300 ${quickViewImage === i ? 'border-blue-400 scale-95' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="px-6 py-5 space-y-5">

                  {/* Name + Stock */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="text-xl font-black text-white leading-tight tracking-tight">{qp.name}</h2>
                      <div className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${(qp.stock || 0) > 0 ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-red-500/30 text-red-400 bg-red-500/5'}`}>
                        {(qp.stock || 0) > 0 ? `${qp.stock} in stock` : 'Out of Stock'}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} className={s <= Math.round(qAvgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-700'} />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold">{qAvgRating.toFixed(1)} · {qp.ratings?.length || 0} reviews</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="py-4 border-y border-white/5">
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Price</p>
                    <p className="text-4xl font-black tracking-tighter text-white">{formatPrice(qp.price || 0)}</p>
                    <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1.5">
                      <span className="text-amber-400">*</span> Final price depends on the variant you choose.
                    </p>
                  </div>

                  {/* 3 Key Points */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">Why Buy?</p>
                    <div className="grid grid-cols-3 gap-3">
                      {points.map((pt, i) => (
                        <div key={i} className={`flex flex-col items-center text-center p-3 rounded-2xl border ${pt.color} transition-all duration-300 hover:scale-105`}>
                          <span className="text-2xl mb-2">{pt.icon}</span>
                          <p className="text-white font-black text-[10px] uppercase tracking-wide leading-tight mb-1">{pt.label}</p>
                          <p className="text-gray-500 text-[9px] leading-tight">{pt.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pb-6">
                    <Link
                      to={`/product/${qp.id}`}
                      onClick={() => setQuickViewProduct(null)}
                      className="w-full py-4 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-blue-500 hover:text-white transition-all shadow-xl"
                    >
                      View Full Details <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Visual Search AI Modal */}
      <VisualSearchModal
        isOpen={isVisualModalOpen}
        onClose={() => setIsVisualModalOpen(false)}
      />
    </div>
  );
};
