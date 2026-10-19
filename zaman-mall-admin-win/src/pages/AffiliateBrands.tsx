import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Edit, X, Upload, ShoppingBag, CheckCircle2,
  Loader2, Eye, EyeOff, ExternalLink, Hash, Link2, Tag, Search,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAlert } from '../context/AlertContext';

interface AffiliateBrand {
  id: string;
  name: string;
  name_urdu?: string;
  logo_url: string;
  affiliate_url: string;
  description?: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

const CATEGORIES = ['Shopping', 'Electronics', 'Fashion', 'Wholesale', 'Groceries', 'Gadgets', 'Home', 'General'];

const defaultForm = {
  name: '', name_urdu: '', logo_url: '', affiliate_url: '',
  description: '', category: 'Shopping', is_active: true, sort_order: 0,
};

const CATEGORY_COLORS: Record<string, string> = {
  Shopping: '#f59e0b', Electronics: '#3b82f6', Fashion: '#ec4899',
  Wholesale: '#8b5cf6', Groceries: '#10b981', Gadgets: '#06b6d4',
  Home: '#f97316', General: '#6b7280',
};

export default function AffiliateBrands() {
  const { showAlert } = useAlert();
  const [brands, setBrands]         = useState<AffiliateBrand[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isAdding, setIsAdding]     = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [search, setSearch]         = useState('');
  const logoRef = useRef<HTMLInputElement>(null);

  const fetchBrands = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('affiliate_brands').select('*').order('sort_order');
    if (error) console.error('[AffiliateBrands] fetch error:', error.message);
    setBrands(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(f);
      setForm(p => ({ ...p, logo_url: url }));
      showAlert('success', 'Logo Uploaded');
    } catch { showAlert('error', 'Upload Failed'); }
    setUploading(false);
    if (logoRef.current) logoRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim())          { showAlert('warning', 'Brand name required');   return; }
    if (!form.logo_url)             { showAlert('warning', 'Logo required');          return; }
    if (!form.affiliate_url.trim()) { showAlert('warning', 'Affiliate URL required'); return; }

    setSubmitting(true);
    try {
      if (editId) {
        const { error } = await supabase.from('affiliate_brands').update(form).eq('id', editId);
        if (error) throw error;
        showAlert('success', 'Updated', `"${form.name}" updated.`);
      } else {
        const { error } = await supabase.from('affiliate_brands').insert([form]);
        if (error) throw error;
        showAlert('success', 'Added', `"${form.name}" added.`);
      }
      reset(); fetchBrands();
    } catch (err: any) {
      showAlert('error', 'Save Failed', err?.message);
    } finally { setSubmitting(false); }
  };

  const handleEdit = (b: AffiliateBrand) => {
    setEditId(b.id);
    setForm({
      name: b.name, name_urdu: b.name_urdu || '', logo_url: b.logo_url,
      affiliate_url: b.affiliate_url, description: b.description || '',
      category: b.category || 'Shopping', is_active: b.is_active, sort_order: b.sort_order,
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from('affiliate_brands').delete().eq('id', id);
      if (error) throw error;
      showAlert('info', 'Deleted', `"${name}" removed.`);
      fetchBrands();
    } catch { showAlert('error', 'Delete Failed'); }
  };

  const handleToggle = async (b: AffiliateBrand) => {
    try {
      await supabase.from('affiliate_brands').update({ is_active: !b.is_active }).eq('id', b.id);
      showAlert('success', b.is_active ? 'Hidden' : 'Visible',
        `"${b.name}" ${b.is_active ? 'deactivated' : 'activated'}.`);
      fetchBrands();
    } catch { showAlert('error', 'Failed'); }
  };

  const reset = () => { setIsAdding(false); setEditId(null); setForm(defaultForm); };

  const filtered = brands.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Icon + title */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.1)' }}>
            <ShoppingBag size={14} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Affiliate Brands</p>
            <p className="text-[10px] font-medium hidden sm:block" style={{ color: 'var(--text-subtle)' }}>
              Daraz, Temu, Alibaba — app mein show honge
            </p>
          </div>
        </div>

        {/* Search — full width on xs */}
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search brands…" className="input-field pl-8 py-2 text-sm w-full" />
        </div>

        {/* Count badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--brand)' }}>
          <ShoppingBag size={12} />
          {brands.length}
        </div>

        <button onClick={() => { reset(); setIsAdding(true); }} className="btn-primary shrink-0">
          <Plus size={14} />
          <span className="hidden xs:inline">Add Brand</span>
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
                <ShoppingBag size={14} style={{ color: 'var(--brand)' }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                {editId ? 'Edit Affiliate Brand' : 'Add Affiliate Brand'}
              </h3>
            </div>
            <button className="btn-icon" onClick={reset}><X size={15} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Brand names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="section-title">Brand Name (English) *</label>
                <input required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field" placeholder="e.g. Daraz" />
              </div>
              <div className="space-y-1.5">
                <label className="section-title">Brand Name (Urdu)</label>
                <input value={form.name_urdu}
                  onChange={e => setForm(p => ({ ...p, name_urdu: e.target.value }))}
                  className="input-field" placeholder="اردو میں نام" dir="rtl" />
              </div>
            </div>

            {/* Logo upload */}
            <div className="space-y-1.5">
              <label className="section-title">Brand Logo *</label>
              {/* Stack vertically on mobile */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button type="button" onClick={() => logoRef.current?.click()}
                  disabled={uploading} className="btn-secondary !py-2.5 sm:!py-2 justify-center sm:justify-start">
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploading ? 'Uploading…' : 'Upload Logo'}
                </button>
                <input type="file" ref={logoRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                <input value={form.logo_url}
                  onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))}
                  className="input-field flex-1" placeholder="Ya URL paste karein" />
                {form.logo_url && (
                  <div className="w-12 h-12 rounded-xl border flex items-center justify-center p-1.5 bg-white shrink-0 self-center"
                    style={{ borderColor: 'var(--border)' }}>
                    <img src={form.logo_url} alt="" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* Affiliate URL */}
            <div className="space-y-1.5">
              <label className="section-title flex items-center gap-1.5">
                <Link2 size={10} style={{ color: 'var(--brand)' }} /> Affiliate / Order Link *
              </label>
              <input required value={form.affiliate_url}
                onChange={e => setForm(p => ({ ...p, affiliate_url: e.target.value }))}
                className="input-field" placeholder="https://daraz.pk" type="url" />
              <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                App mein "Order" button ye link kholega.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="section-title">Description (optional)</label>
              <input value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="input-field" placeholder="Short description about this brand" />
            </div>

            {/* Category + Sort Order — 2 cols on all sizes */}
            <div className="grid grid-cols-2 gap-4">
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
                <label className="section-title flex items-center gap-1.5">
                  <Hash size={10} style={{ color: 'var(--brand)' }} /> Sort Order
                </label>
                <input type="number" value={form.sort_order}
                  onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                  className="input-field font-mono-num" />
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 rounded accent-amber-400" />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                Active (app mein show ho)
              </span>
            </label>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {editId ? 'Update' : 'Add'} Brand
              </button>
              <button type="button" onClick={reset} className="btn-secondary justify-center">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Brand Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <ShoppingBag size={36} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-subtle)' }}>
            {search ? 'Koi brand nahi mila' : 'Abhi tak koi affiliate brand nahi hai'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
            "Add Brand" button se Daraz, Temu wagera add karein
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(brand => {
            const catColor = CATEGORY_COLORS[brand.category] || '#6b7280';
            return (
              <div key={brand.id} className="card card-hover group"
                style={{ opacity: brand.is_active ? 1 : 0.55 }}>

                <div className="flex items-start gap-3">
                  {/* Logo */}
                  <div className="w-14 h-14 rounded-2xl border flex items-center justify-center p-2 bg-white shrink-0 shadow-sm"
                    style={{ borderColor: 'var(--border)' }}>
                    <img src={brand.logo_url} alt={brand.name}
                      className="w-full h-full object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          `https://placehold.co/64x64/f59e0b/fff?text=${brand.name[0]}`;
                      }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name */}
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                        {brand.name}
                      </p>
                      {brand.name_urdu && (
                        <span className="text-xs shrink-0" style={{ color: 'var(--text-subtle)' }}>
                          {brand.name_urdu}
                        </span>
                      )}
                    </div>

                    {/* Category badge */}
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1"
                      style={{ background: catColor + '18', color: catColor, border: `1px solid ${catColor}30` }}>
                      <Tag size={8} /> {brand.category}
                    </span>

                    {brand.description && (
                      <p className="text-[10px] leading-relaxed mt-0.5 line-clamp-1"
                        style={{ color: 'var(--text-subtle)' }}>
                        {brand.description}
                      </p>
                    )}

                    {/* Affiliate URL */}
                    <a href={brand.affiliate_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] hover:underline mt-1 truncate"
                      style={{ color: 'var(--brand)' }} title={brand.affiliate_url}>
                      <ExternalLink size={9} />
                      {brand.affiliate_url.replace(/^https?:\/\//, '').substring(0, 28)}
                      {brand.affiliate_url.length > 36 ? '…' : ''}
                    </a>
                  </div>
                </div>

                {/* Footer: status + sort + actions */}
                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t"
                  style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
                    style={brand.is_active
                      ? { background: 'rgba(74,222,128,0.1)',  color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }
                      : { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                    }>
                    {brand.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[9px] font-mono-num flex items-center gap-0.5"
                    style={{ color: 'var(--text-subtle)' }}>
                    <Hash size={8} />{brand.sort_order}
                  </span>

                  {/* Actions — always visible, pushed to right */}
                  <div className="flex items-center gap-1 ml-auto">
                    <button onClick={() => handleToggle(brand)}
                      title={brand.is_active ? 'Deactivate' : 'Activate'}
                      className="btn-icon w-8 h-8"
                      style={{ color: brand.is_active ? '#4ade80' : 'var(--text-subtle)' }}>
                      {brand.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button onClick={() => handleEdit(brand)} className="btn-icon w-8 h-8 hover:!text-blue-400">
                      <Edit size={13} />
                    </button>
                    <button onClick={() => handleDelete(brand.id, brand.name)}
                      className="btn-icon w-8 h-8 hover:!text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
