import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Trash2, Power, Video, X, Upload, Loader2,
  Heart, Eye, Package, Plus, Film, AlertCircle, Search
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAlert } from '../context/AlertContext';
import { uploadVideoToCloudinary, uploadToCloudinary } from '../services/cloudinary';
import { supabase } from '../services/supabase';
import { Product } from '../types';

interface Zeel {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  product_id?: string | null;
  likes_count: number;
  views_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const emptyForm = {
  title: '',
  description: '',
  video_url: '',
  thumbnail_url: '',
  product_id: '' as string,
};

export default function Zeels() {
  const { products } = useAdmin();
  const { showAlert } = useAlert();

  const [zeels, setZeels] = useState<Zeel[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState<'video' | 'thumb' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const [previewZeel, setPreviewZeel] = useState<Zeel | null>(null);

  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  // China AND Pakistan products for Zeels product reference
  const allLinkableProducts = products.filter(p => p.country === 'china' || p.country === 'pakistan');
  const filteredProducts = allLinkableProducts.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  // ── Load zeels ──────────────────────────────────────
  const loadZeels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('zeels')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (!error && data) setZeels(data as Zeel[]);
    setLoading(false);
  };

  useEffect(() => { loadZeels(); }, []);

  // ── Upload handlers ──────────────────────────────────
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) {
      showAlert('warning', 'File Too Large', 'Max video size is 150 MB.');
      return;
    }
    setUploading('video');
    try {
      const url = await uploadVideoToCloudinary(file);
      setForm(p => ({ ...p, video_url: url }));
      showAlert('success', 'Video Uploaded');
    } catch {
      showAlert('error', 'Upload Failed', 'Could not upload video.');
    }
    setUploading(null);
    e.target.value = '';
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('thumb');
    try {
      const url = await uploadToCloudinary(file);
      setForm(p => ({ ...p, thumbnail_url: url }));
      showAlert('success', 'Thumbnail Uploaded');
    } catch {
      showAlert('error', 'Upload Failed');
    }
    setUploading(null);
    e.target.value = '';
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { showAlert('warning', 'Title Required'); return; }
    if (!form.video_url) { showAlert('warning', 'Video Required', 'Please upload a video first.'); return; }

    setSubmitting(true);
    try {
      const payload = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        video_url: form.video_url,
        thumbnail_url: form.thumbnail_url || null,
        product_id: form.product_id || null,
        likes_count: 0,
        views_count: 0,
        is_active: true,
        sort_order: zeels.length,
      };
      const { error } = await supabase.from('zeels').insert([payload]);
      if (error) throw error;
      setForm({ ...emptyForm });
      setSearchProduct('');
      await loadZeels();
      showAlert('success', 'Zeel Published!', 'Your reel is now live.');
    } catch (err: any) {
      showAlert('error', 'Failed', err?.message || 'Could not publish zeel.');
    }
    setSubmitting(false);
  };

  // ── Toggle active ─────────────────────────────────────
  const handleToggle = async (z: Zeel) => {
    const { error } = await supabase
      .from('zeels')
      .update({ is_active: !z.is_active })
      .eq('id', z.id);
    if (error) { showAlert('error', 'Failed'); return; }
    await loadZeels();
    showAlert('success', z.is_active ? 'Zeel Hidden' : 'Zeel Activated');
  };

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this Zeel permanently?')) return;
    const { error } = await supabase.from('zeels').delete().eq('id', id);
    if (error) { showAlert('error', 'Delete Failed'); return; }
    await loadZeels();
    showAlert('info', 'Deleted');
  };

  const getLinkedProduct = (pid?: string | null): Product | undefined =>
    pid ? products.find(p => p.id === pid) : undefined;

  const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Zeels',   value: zeels.length,                              icon: Film,   color: '#a78bfa' },
          { label: 'Active',         value: zeels.filter(z => z.is_active).length,     icon: Play,   color: '#4ade80' },
          { label: 'Total Likes',    value: formatCount(zeels.reduce((a, z) => a + z.likes_count, 0)), icon: Heart, color: '#f472b6' },
          { label: 'Total Views',    value: formatCount(zeels.reduce((a, z) => a + z.views_count, 0)), icon: Eye,   color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="card-premium flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: s.color + '18', border: `1px solid ${s.color}30` }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-lg font-black" style={{ color: 'var(--text)' }}>{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Upload Form ── */}
        <div className="card-premium">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)' }}>
              <Film size={14} style={{ color: '#a78bfa' }} />
            </div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Upload New Zeel</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Title */}
            <div className="space-y-1.5">
              <label className="section-title">Title *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="input-field"
                placeholder="e.g. New Arrivals from China 🔥"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="section-title">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="input-field resize-none"
                rows={2}
                placeholder="Short caption for this reel..."
              />
            </div>

            {/* Video Upload */}
            <div className="space-y-1.5">
              <label className="section-title">Video File * (max 150 MB)</label>
              <button
                type="button"
                onClick={() => videoRef.current?.click()}
                disabled={uploading === 'video'}
                className="w-full flex flex-col items-center gap-2.5 py-6 rounded-xl transition-all border-2 border-dashed hover:border-purple-500/50"
                style={{ background: 'var(--input-bg)', borderColor: form.video_url ? '#a78bfa' : 'var(--border)' }}
              >
                {uploading === 'video' ? (
                  <>
                    <Loader2 size={22} className="animate-spin" style={{ color: '#a78bfa' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--text-subtle)' }}>Uploading video...</span>
                  </>
                ) : form.video_url ? (
                  <>
                    <Video size={22} style={{ color: '#4ade80' }} />
                    <span className="text-xs font-bold text-green-400">Video Uploaded ✓</span>
                    <span className="text-[10px] font-mono truncate max-w-[200px]" style={{ color: 'var(--text-subtle)' }}>
                      {form.video_url.split('/').pop()}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={22} style={{ color: '#a78bfa' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--text-subtle)' }}>Click to upload video</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>MP4, MOV, WEBM</span>
                  </>
                )}
              </button>
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
              {form.video_url && (
                <button type="button" onClick={() => setForm(p => ({ ...p, video_url: '' }))}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1">
                  <X size={11} /> Remove video
                </button>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div className="space-y-1.5">
              <label className="section-title">Thumbnail Image (optional)</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => thumbRef.current?.click()}
                  disabled={uploading === 'thumb'}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text-subtle)' }}
                >
                  {uploading === 'thumb'
                    ? <><Loader2 size={13} className="animate-spin" /> Uploading...</>
                    : <><Upload size={13} /> Upload Thumbnail</>
                  }
                </button>
                {form.thumbnail_url && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                    <img src={form.thumbnail_url} className="w-full h-full object-cover" alt="" />
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, thumbnail_url: '' }))}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                )}
              </div>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} />
            </div>

            {/* Product Link */}
            <div className="space-y-1.5">
              <label className="section-title">Link Product (China & Pakistan — optional)</label>

              {/* Search input */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
                <input
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                  className="input-field pl-8 text-xs"
                  placeholder="Search by name..."
                />
                {searchProduct && (
                  <button type="button" onClick={() => setSearchProduct('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity">
                    <X size={12} style={{ color: 'var(--text-subtle)' }} />
                  </button>
                )}
              </div>

              {/* Selected product preview */}
              {form.product_id && (() => {
                const sel = products.find(p => p.id === form.product_id);
                return sel ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)' }}>
                    <img src={sel.image || sel.images?.[0]} alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      style={{ border: '1px solid rgba(167,139,250,0.3)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{sel.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                          style={{
                            background: sel.country === 'china' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                            color: sel.country === 'china' ? '#f87171' : '#4ade80',
                          }}>
                          {sel.country || 'pakistan'}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: '#a78bfa' }}>
                          Rs. {sel.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setForm(p => ({ ...p, product_id: '' }))}
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-red-500/20 transition-colors"
                      style={{ border: '1px solid var(--border)' }}>
                      <X size={11} style={{ color: 'var(--text-subtle)' }} />
                    </button>
                  </div>
                ) : null;
              })()}

              {/* Product list */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', maxHeight: '280px', overflowY: 'auto' }}>
                {/* None option */}
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, product_id: '' }))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b ${
                    !form.product_id ? 'bg-purple-500/10' : 'hover:bg-[var(--hover)]'
                  }`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                    <X size={12} style={{ color: 'var(--text-subtle)' }} />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>No product linked</span>
                  {!form.product_id && <span className="ml-auto text-[10px] font-bold text-purple-400">✓</span>}
                </button>

                {filteredProducts.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <AlertCircle size={22} className="mx-auto mb-2" style={{ color: 'var(--text-subtle)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>No products found</p>
                  </div>
                ) : (
                  filteredProducts.slice(0, 50).map(p => {
                    const isSelected = form.product_id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, product_id: p.id }))}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b last:border-b-0 ${
                          isSelected ? 'bg-purple-500/10' : 'hover:bg-[var(--hover)]'
                        }`}
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {/* Product image */}
                        <div className="relative shrink-0">
                          <img
                            src={p.image || p.images?.[0]}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-cover"
                            style={{ border: `1px solid ${isSelected ? 'rgba(167,139,250,0.5)' : 'var(--border)'}` }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><rect width="44" height="44" fill="%23333"/></svg>';
                            }}
                          />
                          {/* Country dot */}
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--surface)]"
                            style={{ background: p.country === 'china' ? '#ef4444' : '#10b981' }} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate leading-tight mb-1"
                            style={{ color: isSelected ? '#a78bfa' : 'var(--text)' }}>
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                              style={{
                                background: p.country === 'china' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                                color: p.country === 'china' ? '#f87171' : '#4ade80',
                              }}>
                              {p.country || '—'}
                            </span>
                            <span className="text-[10px] font-bold" style={{ color: '#a78bfa' }}>
                              Rs. {p.price?.toLocaleString() ?? '0'}
                            </span>
                            {p.stock !== undefined && (
                              <span className="text-[9px]" style={{ color: 'var(--text-subtle)' }}>
                                {p.stock} pcs
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Selected check */}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid #a78bfa' }}>
                            <span style={{ color: '#a78bfa', fontSize: 10, fontWeight: 900 }}>✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {filteredProducts.length > 50 && (
                <p className="text-[10px] text-center mt-1" style={{ color: 'var(--text-subtle)' }}>
                  Showing 50 of {filteredProducts.length} — refine your search
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !form.video_url}
              className="btn-primary w-full justify-center py-3 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? <><Loader2 size={15} className="animate-spin" /> Publishing...</>
                : <><Plus size={15} /> Publish Zeel</>
              }
            </button>
          </form>
        </div>

        {/* ── Live Preview ── */}
        <div className="flex flex-col gap-3">
          <p className="section-title">Live Preview</p>
          <div
            className="relative rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background: 'var(--hover)',
              border: '1px solid var(--border)',
              aspectRatio: '9/16',
              maxHeight: '480px',
            }}
          >
            {form.video_url ? (
              <video
                src={form.video_url}
                poster={form.thumbnail_url || undefined}
                controls
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : form.thumbnail_url ? (
              <img src={form.thumbnail_url} className="absolute inset-0 w-full h-full object-cover" alt="" />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-40">
                <Film size={40} style={{ color: 'var(--text-subtle)' }} />
                <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>Upload a video to preview</span>
              </div>
            )}

            {/* Overlay info */}
            {(form.title || form.product_id) && (
              <div className="absolute bottom-0 left-0 right-0 p-4"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                {form.title && (
                  <p className="text-white font-black text-sm mb-1">{form.title}</p>
                )}
                {form.description && (
                  <p className="text-white/70 text-xs mb-2">{form.description}</p>
                )}
                {form.product_id && (() => {
                  const prod = products.find(p => p.id === form.product_id);
                  return prod ? (
                    <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/15">
                      <img src={prod.image || prod.images?.[0]} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <div>
                        <p className="text-white text-[11px] font-bold truncate max-w-[160px]">{prod.name}</p>
                        <p className="text-purple-300 text-xs font-black">Rs. {prod.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── All Zeels List ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="section-title">All Zeels ({zeels.length})</p>
          <button onClick={loadZeels} className="btn-icon text-xs gap-1.5 px-3 py-1.5">
            <Loader2 size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--hover)', aspectRatio: '9/16' }} />
            ))}
          </div>
        ) : zeels.length === 0 ? (
          <div className="card-premium text-center py-16">
            <Film size={40} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text)' }} />
            <p className="font-bold" style={{ color: 'var(--text-subtle)' }}>No zeels yet. Upload your first reel!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {zeels.map(z => {
              const linkedProduct = getLinkedProduct(z.product_id);
              return (
                <div
                  key={z.id}
                  className="relative rounded-2xl overflow-hidden group cursor-pointer"
                  style={{
                    aspectRatio: '9/16',
                    background: '#000',
                    border: `1px solid ${z.is_active ? 'rgba(167,139,250,0.25)' : 'var(--border)'}`,
                    opacity: z.is_active ? 1 : 0.55,
                  }}
                  onClick={() => setPreviewZeel(z)}
                >
                  {/* Thumbnail or video */}
                  {z.thumbnail_url ? (
                    <img src={z.thumbnail_url} className="absolute inset-0 w-full h-full object-cover" alt={z.title} />
                  ) : (
                    <video
                      src={z.video_url}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  )}

                  {/* Dim overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />

                  {/* Play icon center on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <Play size={20} className="text-white ml-1" />
                    </div>
                  </div>

                  {/* Stats top-right */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <div className="flex items-center gap-1 bg-black/60 rounded-lg px-1.5 py-0.5">
                      <Heart size={9} className="text-pink-400" />
                      <span className="text-white text-[9px] font-bold">{formatCount(z.likes_count)}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/60 rounded-lg px-1.5 py-0.5">
                      <Eye size={9} className="text-blue-400" />
                      <span className="text-white text-[9px] font-bold">{formatCount(z.views_count)}</span>
                    </div>
                  </div>

                  {/* Product badge */}
                  {linkedProduct && (
                    <div className="absolute top-2 left-2">
                      <div className="flex items-center gap-1 bg-purple-500/80 rounded-lg px-1.5 py-0.5">
                        <Package size={9} className="text-white" />
                        <span className="text-white text-[9px] font-bold">Product</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white text-[11px] font-black leading-tight mb-1.5 line-clamp-2">{z.title}</p>
                    {/* Action buttons */}
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggle(z)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                        style={{
                          background: z.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
                          border: `1px solid ${z.is_active ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)'}`,
                          color: z.is_active ? '#4ade80' : '#94a3b8',
                        }}
                      >
                        <Power size={10} />
                        {z.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => handleDelete(z.id)}
                        className="w-8 flex items-center justify-center rounded-lg transition-all hover:bg-red-500"
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {previewZeel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setPreviewZeel(null)}
        >
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{ width: '360px', maxHeight: '85vh', background: '#000' }}
            onClick={e => e.stopPropagation()}
          >
            <video
              src={previewZeel.video_url}
              poster={previewZeel.thumbnail_url || undefined}
              controls
              autoPlay
              className="w-full"
              style={{ maxHeight: '75vh', objectFit: 'contain' }}
            />
            <div className="p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
              <p className="text-white font-black text-sm mb-1">{previewZeel.title}</p>
              {previewZeel.description && (
                <p className="text-white/60 text-xs mb-2">{previewZeel.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-subtle)' }}>
                <span className="flex items-center gap-1"><Heart size={11} className="text-pink-400" />{formatCount(previewZeel.likes_count)}</span>
                <span className="flex items-center gap-1"><Eye size={11} className="text-blue-400" />{formatCount(previewZeel.views_count)}</span>
              </div>
            </div>
            <button
              onClick={() => setPreviewZeel(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
