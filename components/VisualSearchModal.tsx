import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Upload, X, Sparkles, RefreshCw, Loader2, ArrowRight,
  ShoppingCart, Check, Zap, ImageIcon, AlertCircle, FlipHorizontal,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { Product } from '../types';
import { analyzeImageForVisualSearch, VisualAnalysisResult } from '../services/gemini';
import { matchProductsWithVisualAnalysis, extractClientSideFeatures, ScoredProduct } from '../services/visualSearchMatcher';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({ isOpen, onClose, onSelectProduct }) => {
  const { products = [], addToCart, currentUser, formatPrice } = useStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState<VisualAnalysisResult | null>(null);
  const [matchedResults, setMatchedResults] = useState<ScoredProduct[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ─── Camera helpers ─── */
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      } catch {
        setCameraError('Camera access denied. Please upload an image instead.');
      }
    }
  };

  const toggleCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) { stopCamera(); resetScan(); }
  }, [isOpen]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  const resetScan = () => {
    setImagePreview(null);
    setIsScanning(false);
    setAnalysisResult(null);
    setMatchedResults([]);
    setScanStatus('');
  };

  /* ─── Core image processing ─── */
  const processImage = async (dataUrl: string, fileOrBlob: Blob) => {
    setImagePreview(dataUrl);
    setIsScanning(true);
    setScanStatus('Initializing Zaman Vision AI...');
    stopCamera();
    try {
      const base64Data = dataUrl.split(',')[1];
      const mimeType = fileOrBlob.type || 'image/jpeg';
      setScanStatus('Analyzing visual patterns & features...');
      const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
      const productNames = products.map(p => p.name).filter(Boolean);
      let analysis = await analyzeImageForVisualSearch(base64Data, mimeType, uniqueCategories, productNames);
      if (!analysis?.detectedItem) {
        setScanStatus('Applying smart catalog recognition...');
        analysis = await extractClientSideFeatures(fileOrBlob);
      }
      setScanStatus('Searching Zaman Mall catalog...');
      setAnalysisResult(analysis);
      setMatchedResults(matchProductsWithVisualAnalysis(products, analysis));
    } catch {
      const fb = await extractClientSideFeatures(fileOrBlob);
      setAnalysisResult(fb);
      setMatchedResults(matchProductsWithVisualAnalysis(products, fb));
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => processImage(ev.target?.result as string, file);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => processImage(ev.target?.result as string, file);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fn = (e: ClipboardEvent) => {
      if (!isOpen || imagePreview) return;
      for (const item of Array.from(e.clipboardData?.items ?? [])) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = ev => processImage(ev.target?.result as string, file);
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', fn);
    return () => window.removeEventListener('paste', fn);
  }, [isOpen, imagePreview, products]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(v, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    canvas.toBlob(blob => { if (blob) processImage(dataUrl, blob); }, 'image/jpeg', 0.9);
  };

  const handleQuickAdd = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) { onClose(); navigate('/login'); return; }
    await addToCart(product);
    setAddedItems(p => ({ ...p, [product.id]: true }));
    setTimeout(() => setAddedItems(p => ({ ...p, [product.id]: false })), 2000);
  };

  const handleProductClick = (product: Product) => {
    onSelectProduct?.(product);
    onClose();
    navigate(`/product/${product.id}`);
  };

  const handleViewAllInShop = () => {
    const q = analysisResult?.searchQuery || analysisResult?.detectedItem || '';
    onClose();
    navigate(`/shop?q=${encodeURIComponent(q)}`);
  };

  if (!isOpen) return null;

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center sm:p-4 bg-black/85 backdrop-blur-lg"
      onClick={onClose}
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative w-full sm:max-w-lg md:max-w-xl flex flex-col bg-[#0b101d] border border-white/10 overflow-hidden"
        style={{
          borderRadius: '20px 20px 0 0',
          /* sm and up: rounded all corners */
          maxHeight: '96dvh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Handle (mobile only) ── */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-white/20" />
        </div>

        {/* ── Top ambient glow ── */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-indigo-500 pointer-events-none" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0d1424]/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white flex-shrink-0">
              <Sparkles size={15} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                Zaman Visual Search
                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  AI
                </span>
              </h3>
              <p className="text-gray-500 text-[10px] hidden sm:block">Find products by photo or camera</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90 flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="p-3 sm:p-5 space-y-3">

            {/* ── Mode Tabs ── */}
            {!imagePreview && (
              <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/10 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-bold text-xs transition-all ${
                    activeTab === 'upload' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Upload size={13} /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-bold text-xs transition-all ${
                    activeTab === 'camera' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Camera size={13} /> Camera
                </button>
              </div>
            )}

            {/* ── VIEW 1: Upload ── */}
            {!imagePreview && activeTab === 'upload' && (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${
                  isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-white/15 hover:border-blue-500/40 bg-white/[0.02]'
                }`}
                style={{ minHeight: 200, padding: '28px 16px' }}
              >
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-all duration-300 mb-3">
                  <ImageIcon size={26} />
                </div>
                <p className="text-white font-bold text-sm text-center mb-1">Tap to choose a photo</p>
                <p className="text-gray-500 text-xs text-center mb-3">
                  or drag & drop · <span className="text-blue-400">paste (Ctrl+V)</span>
                </p>
                <div className="flex items-center gap-2 text-[9px] text-gray-600 uppercase tracking-widest font-bold">
                  <span>PNG</span>·<span>JPG</span>·<span>WEBP</span>
                </div>
              </div>
            )}

            {/* ── VIEW 2: Camera ── */}
            {!imagePreview && activeTab === 'camera' && (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 flex flex-col items-center justify-center" style={{ aspectRatio: '4/3' }}>
                {cameraError ? (
                  <div className="p-5 text-center">
                    <AlertCircle size={32} className="text-amber-400 mx-auto mb-2" />
                    <p className="text-gray-300 text-sm font-semibold mb-3">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                    >
                      Upload Instead
                    </button>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {/* Reticle */}
                    <div className="absolute inset-6 pointer-events-none border border-white/20 rounded-2xl">
                      <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
                      <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
                      <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-2 border-r-2 border-cyan-400 rounded-br" />
                    </div>
                    {/* Controls */}
                    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6">
                      <button
                        type="button"
                        onClick={toggleCamera}
                        className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <FlipHorizontal size={17} />
                      </button>
                      {/* Shutter */}
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="w-16 h-16 rounded-full bg-white border-4 border-blue-500 shadow-xl shadow-blue-500/40 flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500" />
                      </button>
                      <div className="w-10 h-10" />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── VIEW 3: Scan Results ── */}
            {imagePreview && (
              <div className="space-y-3">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <p className="text-white text-xs font-black uppercase tracking-wider">Scan Target</p>
                  </div>
                  <button
                    onClick={resetScan}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all active:scale-95"
                  >
                    <RefreshCw size={11} /> New Scan
                  </button>
                </div>

                {/* Preview image */}
                <div className="relative w-full overflow-hidden rounded-xl border border-white/15 bg-black/40 flex items-center justify-center" style={{ height: 160 }}>
                  <img src={imagePreview} alt="Scan" className="w-full h-full object-contain" />
                  {isScanning && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(34,211,238,1)] animate-vs-laser" />
                      <div className="absolute inset-0 bg-cyan-500/5" />
                    </div>
                  )}
                </div>

                {/* Scanning status */}
                {isScanning && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                    <Loader2 size={18} className="text-cyan-400 animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-white text-xs font-bold">{scanStatus}</p>
                      <p className="text-gray-400 text-[10px]">Matching with store inventory...</p>
                    </div>
                  </div>
                )}

                {/* AI detection card */}
                {!isScanning && analysisResult && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest font-black text-gray-500">Detected</p>
                        <h4 className="text-white font-extrabold text-sm capitalize">{analysisResult.detectedItem}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                          {analysisResult.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 uppercase">
                          {analysisResult.confidence}
                        </span>
                      </div>
                    </div>
                    {analysisResult.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.keywords.slice(0, 10).map((kw, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 border border-white/10 text-gray-300">#{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Results section */}
                {!isScanning && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400">
                        Matches ({matchedResults.length})
                      </p>
                      {matchedResults.length > 0 && (
                        <button
                          onClick={handleViewAllInShop}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          View in Shop <ArrowRight size={11} />
                        </button>
                      )}
                    </div>

                    {matchedResults.length > 0 ? (
                      /* Single-column on mobile, 2-col on sm+ */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ maxHeight: 340, overflowY: 'auto' }}>
                        {matchedResults.map(({ product, matchPercentage, matchedAttributes }) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="flex gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer active:scale-[0.98]"
                          >
                            {/* Thumb */}
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[8px] font-black uppercase">
                                {matchPercentage}%
                              </div>
                            </div>
                            {/* Info */}
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                              <div>
                                <h5 className="text-white text-xs font-bold truncate">{product.name}</h5>
                                <p className="text-gray-500 text-[9px] uppercase font-semibold">{product.category}</p>
                                {matchedAttributes.length > 0 && (
                                  <p className="text-emerald-400 text-[9px] truncate mt-0.5">✓ {matchedAttributes.slice(0,3).join(', ')}</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/5">
                                <span className="text-white font-black text-xs">{formatPrice(product.price)}</span>
                                <button
                                  type="button"
                                  onClick={e => handleQuickAdd(product, e)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                                    addedItems[product.id] ? 'bg-emerald-500 text-black' : 'bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-white'
                                  }`}
                                >
                                  {addedItems[product.id] ? <Check size={11} /> : <ShoppingCart size={11} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 text-center rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                        <Zap size={22} className="text-amber-400 mx-auto" />
                        <p className="text-white text-sm font-bold">No match for "{analysisResult?.detectedItem}"</p>
                        <p className="text-gray-400 text-xs">Try a different angle or better lighting.</p>
                        <div className="flex flex-wrap justify-center gap-2 pt-1">
                          <button onClick={() => { onClose(); navigate('/shop'); }} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Browse Shop</button>
                          <button onClick={resetScan} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-bold">Try Again</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-3 border-t border-white/10 bg-[#0d1424]/90 flex items-center justify-between flex-shrink-0">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Sparkles size={11} className="text-cyan-400" /> Zaman Vision AI
          </span>
          {imagePreview && !isScanning && (
            <button onClick={handleViewAllInShop} className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 transition-colors">
              Shop All <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes vsLaser {
          0%   { top: 0%;  opacity: .8; }
          50%  { top: 96%; opacity: 1;  }
          100% { top: 0%;  opacity: .8; }
        }
        .animate-vs-laser {
          position: absolute;
          animation: vsLaser 2.2s ease-in-out infinite;
        }
        /* rounded corners on sm+ */
        @media (min-width: 640px) {
          .vsm-modal { border-radius: 24px !important; }
        }
      `}</style>
    </div>
  );
};
