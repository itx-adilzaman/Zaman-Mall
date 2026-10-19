import React, { useState, useRef, useMemo } from 'react';
import {
  Plus, Trash2, Edit, X, Upload, Layers, Video, Bot, Loader2,
  Package, Search, Star, ChevronDown,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAlert } from '../context/AlertContext';
import { uploadToCloudinary, uploadVideoToCloudinary } from '../services/cloudinary';
import { generateProductDescription } from '../services/gemini';
import { Product, ProductVariant, ProductVideo } from '../types';

const empty: Partial<Product> = {
  name: '', category: 'Electronics', price: 0, stock: 0,
  description: '', image: '', images: [], featured: false, variants: [], country: 'pakistan',
};

export default function Products() {
  const { products, addProduct, updateProduct, removeProduct, formatPrice } = useAdmin();
  const { showAlert } = useAlert();

  const [search,   setSearch]   = useState('');
  const [country,  setCountry]  = useState<'all' | 'pakistan' | 'china'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState<Partial<Product>>(empty);
  const [gallery,  setGallery]  = useState<string[]>([]);
  const [videos,   setVideos]   = useState<ProductVideo[]>([]);
  const [variants, setVariants] = useState<{ type: string; options: { value: string; price: string }[] }[]>([]);
  const [aiLoad,   setAiLoad]   = useState(false);
  const [vidLoad,  setVidLoad]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => products.filter(p => {
    const ms = search.toLowerCase();
    const matchesSearch = !ms || p.name.toLowerCase().includes(ms) || p.category.toLowerCase().includes(ms);
    const matchesCountry =
      country === 'all' ||
      (country === 'pakistan' && (p.country === 'pakistan' || !p.country || p.country === '')) ||
      (country === 'china' && p.country === 'china');
    return matchesSearch && matchesCountry;
  }), [products, search, country]);

  const reset = () => {
    setIsAdding(false); setEditId(null); setGallery([]); setVideos([]); setVariants([]); setForm(empty);
  };

  const handleImg = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const files = e.target.files; if (!files?.length) return;
    for (const f of Array.from(files)) {
      try {
        const url = await uploadToCloudinary(f);
        if (isGallery) setGallery(p => [...p, url]); else setForm(p => ({ ...p, image: url }));
      } catch {
        const r = new FileReader();
        r.onloadend = () => {
          if (isGallery) setGallery(p => [...p, r.result as string]);
          else setForm(p => ({ ...p, image: r.result as string }));
        };
        r.readAsDataURL(f);
      }
    }
  };

  const handleVid = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files?.length) return;
    setVidLoad(true);
    for (const f of Array.from(files)) {
      try {
        const url = await uploadVideoToCloudinary(f);
        setVideos(p => [...p, { videoUrl: url, title: f.name.replace(/\.[^/.]+$/, ''), sortOrder: p.length }]);
      } catch { showAlert('error', 'Upload Failed'); }
    }
    setVidLoad(false);
    if (vidRef.current) vidRef.current.value = '';
  };

  const handleAI = async () => {
    if (!form.name) return;
    setAiLoad(true);
    const d = await generateProductDescription(form.name);
    setForm(p => ({ ...p, description: d }));
    setAiLoad(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const pvs: ProductVariant[] = variants
        .filter(v => v.options.some(o => o.value.trim()))
        .map(v => ({
          type: v.type,
          options: v.options
            .filter(o => o.value.trim())
            .map(o => {
              const price = parseFloat(o.price);
              return (!isNaN(price) && price > 0)
                ? { value: o.value.trim(), price }
                : o.value.trim();
            }),
        }));
      const data = { ...form as Product, images: gallery, videos, variants: pvs };
      if (editId) { await updateProduct({ ...data, id: editId }); showAlert('success', 'Product Updated'); }
      else { await addProduct({ ...data, id: crypto.randomUUID() }); showAlert('success', 'Product Added'); }
      reset();
    } catch (err: any) { showAlert('error', 'Save Failed', err?.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (p: Product) => {
    setEditId(p.id); setForm(p); setGallery(p.images || []); setVideos(p.videos || []);
    setVariants(p.variants?.map(v => ({
      type: v.type,
      options: v.options.map(o =>
        typeof o === 'string'
          ? { value: o, price: '' }
          : { value: (o as any).value, price: (o as any).price != null ? String((o as any).price) : '' }
      ),
    })) || []);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await removeProduct(id); showAlert('success', 'Deleted', `${name} removed.`); }
    catch { showAlert('error', 'Delete Failed'); }
  };

  // ── Product table / card section ────────────────────────────────────
  const ProductSection = ({
    items, label, color,
  }: { items: Product[]; label: string; color: string }) => (
    <div className="card !p-0 overflow-hidden">
      {/* Section header */}
      <div
        className="px-4 sm:px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-2"
        style={{ borderColor: 'var(--border)', background: color + '08' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {label}
            <span className="text-xs font-normal ml-2" style={{ color: 'var(--text-subtle)' }}>
              ({items.length} products)
            </span>
          </p>
        </div>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-subtle)' }}>
          Stock: {items.reduce((a, p) => a + (p.stock || 0), 0)} units
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-xs" style={{ color: 'var(--text-subtle)' }}>
          No {label.toLowerCase()} found
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="table-desktop overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>{['Product', 'Category', 'Stock', 'Price', 'Rating', ''].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {items.map(p => {
                  const avg = p.ratings?.length
                    ? p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length
                    : 0;
                  return (
                    <tr key={p.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar w-11 h-11">
                            <img src={p.image} alt={p.name} className="object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.name}</p>
                              {p.featured && <Star size={11} className="text-amber-400 fill-amber-400" />}
                            </div>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
                              style={{ background: color + '12', color }}>
                              {p.country || 'pakistan'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.category}</span></td>
                      <td>
                        <span className={`text-xs font-semibold ${p.stock <= 5 ? 'text-red-400 animate-pulse' : ''}`}
                          style={{ color: p.stock > 5 ? 'var(--text-muted)' : undefined }}>
                          {p.stock} units
                        </span>
                      </td>
                      <td>
                        <span className="font-bold font-mono-num text-sm" style={{ color: 'var(--brand)' }}>
                          {formatPrice(p.price)}
                        </span>
                      </td>
                      <td>
                        {avg > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            <span className="text-xs font-semibold font-mono-num" style={{ color: 'var(--text-muted)' }}>
                              {avg.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        {/* Always visible on mobile, hover-only on desktop */}
                        <div className="flex items-center gap-1.5 justify-end touch-actions md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(p)} className="btn-icon w-8 h-8 hover:!text-blue-400">
                            <Edit size={13} />
                          </button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="btn-icon w-8 h-8 hover:!text-red-400">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="cards-mobile divide-y" style={{ borderColor: 'var(--border)' }}>
            {items.map(p => {
              const avg = p.ratings?.length
                ? p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length
                : 0;
              return (
                <div key={p.id} className="p-4 flex items-center gap-3"
                  style={{ background: 'var(--card)' }}>
                  {/* Image */}
                  <div className="avatar w-14 h-14 shrink-0">
                    <img src={p.image} alt={p.name} className="object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
                      {p.featured && <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
                        style={{ background: color + '12', color }}>
                        {p.country || 'pakistan'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{p.category}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="font-bold font-mono-num text-sm" style={{ color: 'var(--brand)' }}>
                        {formatPrice(p.price)}
                      </span>
                      <span className={`text-xs font-semibold ${p.stock <= 5 ? 'text-red-400' : ''}`}
                        style={{ color: p.stock > 5 ? 'var(--text-subtle)' : undefined }}>
                        {p.stock} units
                      </span>
                      {avg > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-semibold font-mono-num"
                          style={{ color: 'var(--text-muted)' }}>
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          {avg.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions — always visible on mobile */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => handleEdit(p)} className="btn-icon w-9 h-9 hover:!text-blue-400"
                      aria-label="Edit product">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="btn-icon w-9 h-9 hover:!text-red-400"
                      aria-label="Delete product">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header controls ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…" className="input-field pl-9 py-2.5 text-sm" />
        </div>

        {/* Country filter */}
        <div className="flex gap-1 p-1 rounded-xl shrink-0" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {(['all', 'pakistan', 'china'] as const).map(c => (
            <button key={c} onClick={() => setCountry(c)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
              style={{
                background: country === c ? 'rgba(245,158,11,0.12)' : 'transparent',
                color: country === c ? 'var(--brand)' : 'var(--text-subtle)',
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Count badge — hidden on xs */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--brand)' }}>
          <Package size={12} />
          {products.length} total
        </div>

        <button onClick={() => setIsAdding(true)} className="btn-primary ml-auto shrink-0">
          <Plus size={14} />
          <span className="hidden xs:inline">Add Product</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>

      {/* ── Add / Edit Form ───────────────────────────────── */}
      {isAdding && (
        <div className="card-premium animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.1)' }}>
                <Package size={14} style={{ color: 'var(--brand)' }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                {editId ? 'Edit Product' : 'Add New Product'}
              </h3>
            </div>
            <button className="btn-icon" onClick={reset}><X size={15} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ── Left column ── */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="section-title">Product Name *</label>
                  <input required value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input-field" placeholder="Enter product name" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="section-title">Price (Rs.) *</label>
                    <input required type="number" min="0" step="0.01" value={form.price}
                      onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                      className="input-field font-mono-num" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="section-title">Stock *</label>
                    <input required type="number" min="0" value={form.stock}
                      onChange={e => setForm(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                      className="input-field font-mono-num" />
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="section-title">Description *</label>
                  <textarea required value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="input-field resize-none" rows={5} placeholder="Product description…" />
                  <button type="button" onClick={handleAI} disabled={aiLoad || !form.name}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-40"
                    style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--brand)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    {aiLoad ? <Loader2 size={11} className="animate-spin" /> : <Bot size={11} />}
                    AI Write
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="section-title">Category</label>
                  <input list="cat-opts" value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="input-field" />
                  <datalist id="cat-opts">
                    {['Electronics', 'Audio', 'Accessories', 'Home', 'Fashion', 'Gadgets'].map(c =>
                      <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="section-title">Country Origin</label>
                  <div className="flex gap-2">
                    {(['pakistan', 'china'] as const).map(c => (
                      <button key={c} type="button" onClick={() => setForm(p => ({ ...p, country: c }))}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border"
                        style={{
                          background: form.country === c
                            ? (c === 'pakistan' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)')
                            : 'var(--input-bg)',
                          borderColor: form.country === c
                            ? (c === 'pakistan' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)')
                            : 'var(--border)',
                          color: form.country === c
                            ? (c === 'pakistan' ? '#4ade80' : '#f87171')
                            : 'var(--text-subtle)',
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.featured}
                    onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-400" />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Featured Product</span>
                  <Star size={13}
                    className={form.featured ? 'text-amber-400 fill-amber-400' : ''}
                    style={{ color: form.featured ? '#fbbf24' : 'var(--text-subtle)' }} />
                </label>
              </div>

              {/* ── Right column ── */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="section-title">Primary Image</label>
                  <div className="flex gap-2">
                    <input value={form.image}
                      onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                      className="input-field flex-1" placeholder="URL or upload" />
                    <button type="button" onClick={() => imgRef.current?.click()}
                      className="btn-secondary !px-3 shrink-0">
                      <Upload size={13} />
                    </button>
                    <input type="file" ref={imgRef} onChange={e => handleImg(e)} accept="image/*" className="hidden" />
                  </div>
                  {form.image && (
                    <div className="relative h-36 rounded-xl overflow-hidden mt-2"
                      style={{ border: '1px solid var(--border)' }}>
                      <img src={form.image} className="w-full h-full object-cover" alt="" />
                    </div>
                  )}
                </div>

                {/* Gallery */}
                <div className="space-y-1.5">
                  <label className="section-title">Gallery</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl min-h-[72px] items-start"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                    {gallery.map((img, i) => (
                      <div key={i} className="w-14 h-14 rounded-lg overflow-hidden relative group/img"
                        style={{ border: '1px solid var(--border)' }}>
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        <button type="button"
                          onClick={() => setGallery(p => p.filter((_, j) => j !== i))}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity text-red-400">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    <label className="w-14 h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all"
                      style={{ border: '1px dashed var(--border)', color: 'var(--text-subtle)' }}>
                      <Plus size={14} />
                      <span className="text-[8px] mt-0.5 font-bold">Add</span>
                      <input type="file" multiple onChange={e => handleImg(e, true)} accept="image/*" className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Videos */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="section-title flex items-center gap-1.5 mb-0">
                      <Video size={10} style={{ color: '#c084fc' }} />Videos
                    </label>
                    <label className="btn-secondary !py-1.5 !px-3 !text-[10px] cursor-pointer">
                      {vidLoad ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Upload
                      <input type="file" multiple onChange={handleVid} accept="video/*" className="hidden" ref={vidRef} />
                    </label>
                  </div>
                  {videos.map((v, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(168,85,247,0.1)' }}>
                        <Video size={12} style={{ color: '#c084fc' }} />
                      </div>
                      <input value={v.title || ''}
                        onChange={e => {
                          const n = [...videos]; n[i] = { ...n[i], title: e.target.value }; setVideos(n);
                        }}
                        placeholder="Video title…"
                        className="flex-1 bg-transparent text-xs outline-none" style={{ color: 'var(--text)' }} />
                      <button type="button"
                        onClick={() => setVideos(p => p.filter((_, j) => j !== i))}
                        className="text-red-400/60 hover:text-red-400 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Variants ── */}
            <div className="space-y-3 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <label className="section-title flex items-center gap-1.5 mb-0">
                  <Layers size={10} style={{ color: '#60a5fa' }} />Variants
                </label>
                <button type="button"
                  onClick={() => setVariants(p => [...p, { type: '', options: [{ value: '', price: '' }] }])}
                  className="btn-secondary !py-1.5 !px-3 !text-[10px]">
                  <Plus size={11} /> Add Variant
                </button>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                Leave price blank to use product base price.
              </p>

              {variants.length > 0 && (
                <div className="space-y-3">
                  {variants.map((v, i) => (
                    <div key={i} className="p-3.5 rounded-xl relative"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                      <button type="button"
                        onClick={() => setVariants(p => p.filter((_, j) => j !== i))}
                        className="absolute top-2 right-2 hover:text-red-400 transition-colors"
                        style={{ color: 'var(--text-subtle)' }}>
                        <X size={14} />
                      </button>

                      <input value={v.type}
                        onChange={e => { const n = [...variants]; n[i] = { ...n[i], type: e.target.value }; setVariants(n); }}
                        list="v-types" placeholder="Type (Color, Size…)"
                        className="input-field text-xs mb-3 py-2 w-full" />
                      <datalist id="v-types">
                        {['Color', 'Size', 'Material', 'Storage', 'Warranty'].map(t => <option key={t} value={t} />)}
                      </datalist>

                      <div className="space-y-2 mb-2">
                        {v.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input value={opt.value}
                              onChange={e => {
                                const n = [...variants]; const opts = [...n[i].options];
                                opts[oi] = { ...opts[oi], value: e.target.value };
                                n[i] = { ...n[i], options: opts }; setVariants(n);
                              }}
                              placeholder="Option (e.g. Red)"
                              className="input-field text-xs py-1.5 flex-1" />
                            <div className="relative shrink-0" style={{ width: '110px' }}>
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]"
                                style={{ color: 'var(--text-subtle)' }}>Rs.</span>
                              <input value={opt.price}
                                onChange={e => {
                                  const n = [...variants]; const opts = [...n[i].options];
                                  opts[oi] = { ...opts[oi], price: e.target.value };
                                  n[i] = { ...n[i], options: opts }; setVariants(n);
                                }}
                                placeholder="Price" type="number" min="0"
                                className="input-field text-xs py-1.5 pl-8 w-full font-mono-num" />
                            </div>
                            {v.options.length > 1 && (
                              <button type="button"
                                onClick={() => {
                                  const n = [...variants];
                                  n[i] = { ...n[i], options: n[i].options.filter((_, j) => j !== oi) };
                                  setVariants(n);
                                }}
                                className="hover:text-red-400 transition-colors shrink-0"
                                style={{ color: 'var(--text-subtle)' }}>
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button type="button"
                        onClick={() => {
                          const n = [...variants];
                          n[i] = { ...n[i], options: [...n[i].options, { value: '', price: '' }] };
                          setVariants(n);
                        }}
                        className="text-[10px] font-bold flex items-center gap-1 hover:opacity-80"
                        style={{ color: '#60a5fa' }}>
                        <Plus size={10} /> Add Option
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-3">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Package size={15} />}
                {editId ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" onClick={reset} className="btn-secondary sm:w-auto justify-center">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Product sections ─────────────────────────────── */}
      {(() => {
        const pakistanProducts = filtered.filter(p => p.country === 'pakistan' || !p.country || p.country === '');
        const chinaProducts    = filtered.filter(p => p.country === 'china');
        const allShown = new Set([...pakistanProducts, ...chinaProducts].map(p => p.id));
        const finalPakistan = [...pakistanProducts, ...filtered.filter(p => !allShown.has(p.id))];

        if (country === 'pakistan')
          return <ProductSection items={finalPakistan} label="Pakistan Products" color="#4ade80" />;
        if (country === 'china')
          return <ProductSection items={chinaProducts}  label="China Products"   color="#f87171" />;
        return (
          <div className="space-y-6">
            <ProductSection items={finalPakistan} label="Pakistan Products" color="#4ade80" />
            <ProductSection items={chinaProducts}  label="China Products"   color="#f87171" />
          </div>
        );
      })()}
    </div>
  );
}
