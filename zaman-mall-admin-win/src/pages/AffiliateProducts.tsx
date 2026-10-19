import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Trash2, Edit, X, Upload, Loader2, Search,
  Link2, Tag, Star, Package, Eye, EyeOff, CheckCircle2,
  ExternalLink, DollarSign, Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAlert } from '../context/AlertContext';

interface AffiliateBrand {
  id: string;
  name: string;
  logo_url: string;
}

interface AffiliateProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  images: string[];
  affiliate_url: string;
  brand_id?: string;
  brand_name?: string;
  category: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at?: string;
}

const CATEGORIES = ['Shopping', 'Electronics', 'Fashion', 'Wholesale', 'Groceries', 'Gadgets', 'Home', 'General'];

const empty: Partial<AffiliateProduct> = {
  name: '', description: '', price: 0, image_url: '', images: [],
  affiliate_url: '', brand_id: '', brand_name: '',
  category: 'General', is_active: true, is_featured: false, sort_order: 0,
};

export default function AffiliateProducts() {
  const { showAlert } = useAlert();

  const [products, setProducts]         = useState<AffiliateProduct[]>([]);
  const [brands, setBrands]             = useState<AffiliateBrand[]>([]);
  const [loading, setLoading]           = useState(true);
  const [isAdding, setIsAdding]         = useState(false);
  const [editId, setEditId]             = useState<string | null>(null);
  const [form, setForm]                 = useState<Partial<AffiliateProduct>>(empty);
  const [gallery, setGallery]           = useState<string[]>([]);
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [galUploading, setGalUploading] = useState(false);
  const [search, setSearch]             = useState('');

  const mainImgRef = useRef<HTMLInputElement>(null);
  const galRef     = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: prods }, { data: brnds }] = await Promise.all([
      supabase.from('affiliate_products').select('*').order('sort_order'),
      supabase.from('affiliate_brands').select('id, name, logo_url').eq('is_active', true).order('sort_order'),
    ]);
    setProducts(prods || []);
    setBrands(brnds || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* ── image uploads ── */
  const handleMainImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(f);
      setForm(p => ({ ...p, image_url: url }));
    } catch { showAlert('error', 'Upload failed'); }
    setUploading(false);
    if (mainImgRef.current) mainImgRef.current.value = '';
  };

  const handleGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files?.length) return;
    setGalUploading(true);
    for (const f of Array.from(files)) {
      try {
        const url = await uploadToCloudinary(f);
        setGallery(p => [...p, url]);
      } catch { showAlert('error', `Failed: ${f.name}`); }
    }
    setGalUploading(false);
    if (galRef.current) galRef.current.value = '';
  };

  /* ── save ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim())          { showAlert('warning', 'Product name required');   return; }
    if (!form.image_url)             { showAlert('warning', 'Main image required');     return; }
    if (!form.affiliate_url?.trim()) { showAlert('warning', 'Affiliate link required'); return; }

    setSaving(true);
    try {
      const selectedBrand = brands.find(b => b.id === form.brand_id);
      const payload = {
        ...form,
        images: gallery,
        brand_name: selectedBrand?.name || form.brand_name || '',
      };

      if (editId) {
        const { error } = await supabase.from('affiliate_products').update(payload).eq('id', editId);
        if (error) throw error;
        showAlert('success', 'Updated', `"${form.name}" updated.`);
      } else {
        const { error } = await supabase.from('affiliate_products').insert([payload]);
        if (error) throw error;
        showAlert('success', 'Added', `"${form.name}" added.`);
      }
      reset(); fetchData();
    } catch (err: any) {
      showAlert('error', 'Save failed', err?.message);
    } finally { setSaving(false); }
  };

  const handleEdit = (p: AffiliateProduct) => {
    setEditId(p.id); setForm(p); setGallery(p.images || []);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from('affiliate_products').delete().eq('id', id);
      if (error) throw error;
      showAlert('info', 'Deleted'); fetchData();
    } catch { showAlert('error', 'Delete failed'); }
  };

  const handleToggle = async (p: AffiliateProduct) => {
    await supabase.from('affiliate_products').update({ is_active: !p.is_active }).eq('id', p.id);
    showAlert('success', p.is_active ? 'Hidden' : 'Shown'); fetchData();
  };

  const handleFeatureToggle = async (p: AffiliateProduct) => {
    await supabase.from('affiliate_products').update({ is_featured: !p.is_featured }).eq('id', p.id);
    fetchData();
  };

  const reset = () => { setIsAdding(false); setEditId(null); setForm(empty); setGallery([]); };

  const filtered = useMemo(() => products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand_name || '').toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Icon + title */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Package size={14} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Affiliate Products</p>
            <p className="text-[10px] hidden sm:block" style={{ color: 'var(--text-subtle)' }}>
              Daraz, Temu wagera ke products — app mein dikhenge
            </p>
          </div>
        </div>

        {/* Search — full width on xs */}
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…" className="input-field pl-8 py-2 text-sm w-full" />
        </div>

        {/* Count */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--brand)' }}>
          <Package size={12} />
          {products.length}
        </div>

        <button onClick={() => { reset(); setIsAdding(true); }} className="btn-primary shrink-0">
          <Plus size={14} />
          <span className="hidden xs:inline">Add Product</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>

      {/* ── Add / Edit Form ── */}
      {isAdding && (
        <div className="card-premium animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.1)' }}>
                <Package size={14} style={{ color: 'var(--brand)' }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                {editId ? 'Edit Affiliate Product' : 'Add Affiliate Product'}
              </h3>
            </div>
            <button className="btn-icon" onClick={reset}><X size={15} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* ── Left column ── */}
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="section-title">Product Name *</label>
                  <input required value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input-field" placeholder="e.g. Men's Running Shoes" />
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <label className="section-title flex items-center gap-1.5">
                    <DollarSign size={10} style={{ color: 'var(--brand)' }} /> Price (Rs.)
                  </label>
                  <input type="number" min="0" step="0.01" value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    className="input-field font-mono-num" placeholder="0" />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="section-title">Description</label>
                  <textarea value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="input-field resize-none" rows={4} placeholder="Product details…" />
                </div>

                {/* Affiliate URL */}
                <div className="space-y-1.5">
                  <label className="section-title flex items-center gap-1.5">
                    <Link2 size={10} style={{ color: 'var(--brand)' }} /> Affiliate / Order Link *
                  </label>
                  <input required value={form.affiliate_url}
                    onChange={e => setForm(p => ({ ...p, affiliate_url: e.target.value }))}
                    className="input-field" placeholder="https://daraz.pk/products/…" type="url" />
                  <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                    App mein "Order" button ye link kholega
                  </p>
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <label className="section-title">Brand (optional)</label>
                  <select value={form.brand_id || ''}
                    onChange={e => setForm(p => ({ ...p, brand_id: e.target.value }))}
                    className="input-field">
                    <option value="">-- No brand --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                {/* Category + Sort */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="section-title flex items-center gap-1.5">
                      <Tag size={10} style={{ color: 'var(--brand)' }} /> Category
                    </label>
                    <select value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="input-field">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="section-title">Sort Order</label>
                    <input type="number" value={form.sort_order}
                      onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                      className="input-field font-mono-num" />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active}
                      onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded accent-amber-400" />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_featured}
                      onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                      className="w-4 h-4 rounded accent-amber-400" />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Featured</span>
                    <Star size={12} className={form.is_featured ? 'text-amber-400 fill-amber-400' : ''} />
                  </label>
                </div>
              </div>

              {/* ── Right column ── */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="space-y-1.5">
                  <label className="section-title flex items-center gap-1.5">
                    <ImageIcon size={10} style={{ color: 'var(--brand)' }} /> Main Image *
                  </label>
                  <div className="flex gap-2">
                    <input value={form.image_url}
                      onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                      className="input-field flex-1" placeholder="URL or upload" />
                    <button type="button" onClick={() => mainImgRef.current?.click()}
                      disabled={uploading} className="btn-secondary !px-3 shrink-0">
                      {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    </button>
                    <input type="file" ref={mainImgRef} onChange={handleMainImg} accept="image/*" className="hidden" />
                  </div>
                  {form.image_url && (
                    <div className="relative h-44 rounded-xl overflow-hidden mt-2"
                      style={{ border: '1px solid var(--border)' }}>
                      <img src={form.image_url} className="w-full h-full object-cover" alt="" />
                    </div>
                  )}
                </div>

                {/* Gallery */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="section-title mb-0">Gallery (optional)</label>
                    <label className="btn-secondary !py-1.5 !px-3 !text-[10px] cursor-pointer">
                      {galUploading ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                      Add Images
                      <input type="file" multiple onChange={handleGallery} accept="image/*" className="hidden" ref={galRef} />
                    </label>
                  </div>
                  {gallery.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                      {gallery.map((img, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden relative"
                          style={{ border: '1px solid var(--border)' }}>
                          <img src={img} className="w-full h-full object-cover" alt="" />
                          {/* Always-visible remove button on touch — not hover-only */}
                          <button type="button"
                            onClick={() => setGallery(p => p.filter((_, j) => j !== i))}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-black/60 text-red-400"
                            aria-label="Remove image">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* App preview */}
                {(form.image_url || form.name) && (
                  <div className="p-4 rounded-xl space-y-2"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--text-subtle)' }}>App Preview</p>
                    <div className="flex items-center gap-3">
                      {form.image_url && (
                        <img src={form.image_url} className="w-14 h-14 object-cover rounded-xl shrink-0" alt="" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>
                          {form.name || 'Product Name'}
                        </p>
                        {form.price ? (
                          <p className="text-xs font-bold" style={{ color: 'var(--brand)' }}>
                            Rs. {Number(form.price).toLocaleString()}
                          </p>
                        ) : null}
                        {form.brand_id && brands.find(b => b.id === form.brand_id) && (
                          <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                            via {brands.find(b => b.id === form.brand_id)?.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 py-2 rounded-lg text-center text-xs font-bold"
                      style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--brand)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      🛒 Order — {form.name || 'Product'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit buttons — stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-3">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {editId ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" onClick={reset} className="btn-secondary justify-center">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Product Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <Package size={36} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-subtle)' }}>
            {search ? 'Koi product nahi mila' : 'Abhi koi affiliate product nahi hai'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
            "Add Product" se Daraz/Temu wagera ke products add karein
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(product => {
            const brand = brands.find(b => b.id === product.brand_id);
            return (
              <div key={product.id} className="card card-hover group"
                style={{ opacity: product.is_active ? 1 : 0.55 }}>

                {/* Product image */}
                <div className="relative h-40 rounded-xl overflow-hidden mb-3"
                  style={{ border: '1px solid var(--border)' }}>
                  <img src={product.image_url} alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {product.is_featured && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ background: 'rgba(245,158,11,0.9)', color: '#000' }}>
                      <Star size={9} className="fill-current" /> Featured
                    </div>
                  )}
                  {brand?.logo_url && (
                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-white p-1 shadow"
                      style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                      <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>
                      {product.name}
                    </p>
                    {product.price > 0 && (
                      <span className="font-bold text-sm font-mono-num shrink-0" style={{ color: 'var(--brand)' }}>
                        Rs.{Number(product.price).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-subtle)' }}>
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--brand)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      {product.category}
                    </span>
                    {product.brand_name && (
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--text-subtle)' }}>
                        via {product.brand_name}
                      </span>
                    )}
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ml-auto"
                      style={product.is_active
                        ? { background: 'rgba(74,222,128,0.1)',  color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
                        : { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                      }>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Affiliate URL */}
                  <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] hover:underline mt-1 truncate"
                    style={{ color: 'var(--brand)' }}>
                    <ExternalLink size={9} />
                    {product.affiliate_url.replace(/^https?:\/\//, '').substring(0, 35)}
                    {product.affiliate_url.length > 43 ? '…' : ''}
                  </a>
                </div>

                {/* Actions — always visible */}
                <div className="flex items-center gap-1.5 pt-3 border-t"
                  style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => handleFeatureToggle(product)} title="Toggle featured"
                    className="btn-icon w-8 h-8"
                    style={{ color: product.is_featured ? '#fbbf24' : 'var(--text-subtle)' }}>
                    <Star size={13} className={product.is_featured ? 'fill-current' : ''} />
                  </button>
                  <button onClick={() => handleToggle(product)}
                    className="btn-icon w-8 h-8"
                    style={{ color: product.is_active ? '#4ade80' : 'var(--text-subtle)' }}>
                    {product.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => handleEdit(product)} className="btn-icon w-8 h-8 hover:!text-blue-400">
                    <Edit size={13} />
                  </button>
                  <button onClick={() => handleDelete(product.id, product.name)}
                    className="btn-icon w-8 h-8 hover:!text-red-400 ml-auto">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
