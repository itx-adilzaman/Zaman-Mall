import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Edit, X, Upload, Award, CheckCircle2,
  Loader2, Eye, EyeOff, Hash, ExternalLink,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAlert } from '../context/AlertContext';

interface Brand {
  id: string;
  name: string;
  name_urdu?: string;
  logo_url: string;
  website_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

const defaultForm = {
  name: '',
  name_urdu: '',
  logo_url: '',
  website_url: '',
  is_active: true,
  sort_order: 0,
};

export default function Brands() {
  const { showAlert } = useAlert();
  const [brands, setBrands]       = useState<Brand[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isAdding, setIsAdding]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const fetchBrands = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('brands')
      .select('*')
      .order('sort_order');
    setBrands(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(f);
      setForm(p => ({ ...p, logo_url: url }));
      showAlert('success', 'Logo Uploaded');
    } catch {
      showAlert('error', 'Upload Failed');
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showAlert('warning', 'Name Required'); return; }
    if (!form.logo_url)    { showAlert('warning', 'Logo Required'); return; }
    setSubmitting(true);
    try {
      if (editId) {
        const { error } = await supabase.from('brands').update(form).eq('id', editId);
        if (error) throw error;
        showAlert('success', 'Updated', `"${form.name}" updated.`);
      } else {
        const { error } = await supabase.from('brands').insert([form]);
        if (error) throw error;
        showAlert('success', 'Added', `"${form.name}" added.`);
      }
      reset();
      fetchBrands();
    } catch (err: any) {
      showAlert('error', 'Failed', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (b: Brand) => {
    setEditId(b.id);
    setForm({
      name:        b.name,
      name_urdu:   b.name_urdu   || '',
      logo_url:    b.logo_url,
      website_url: b.website_url || '',
      is_active:   b.is_active,
      sort_order:  b.sort_order,
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from('brands').delete().eq('id', id);
      if (error) throw error;
      showAlert('info', 'Deleted');
      fetchBrands();
    } catch { showAlert('error', 'Failed'); }
  };

  const handleToggle = async (b: Brand) => {
    try {
      await supabase.from('brands').update({ is_active: !b.is_active }).eq('id', b.id);
      showAlert('success', b.is_active ? 'Hidden' : 'Visible',
        `"${b.name}" ${b.is_active ? 'deactivated' : 'activated'}.`);
      fetchBrands();
    } catch { showAlert('error', 'Failed'); }
  };

  const reset = () => { setIsAdding(false); setEditId(null); setForm(defaultForm); };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.1)' }}
          >
            <Award size={14} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Brands</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-subtle)' }}>
              {brands.length} total
            </p>
          </div>
        </div>
        <button
          onClick={() => { reset(); setIsAdding(true); }}
          className="btn-primary"
        >
          <Plus size={14} /> Add Brand
        </button>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="card-premium animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {editId ? 'Edit Brand' : 'New Brand'}
            </h3>
            <button className="btn-icon" onClick={reset}><X size={15} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="section-title">Brand Name (English) *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Samsung"
                />
              </div>
              <div className="space-y-1.5">
                <label className="section-title">Brand Name (Urdu)</label>
                <input
                  value={form.name_urdu}
                  onChange={e => setForm(p => ({ ...p, name_urdu: e.target.value }))}
                  className="input-field"
                  placeholder="اردو میں نام"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-1.5">
              <label className="section-title">Brand Logo *</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary !py-2"
                >
                  {uploading
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Upload size={13} />
                  }
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </button>
                <input
                  type="file"
                  ref={logoRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                {form.logo_url && (
                  <>
                    <div
                      className="w-12 h-12 rounded-xl border flex items-center justify-center p-1 bg-white"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <img src={form.logo_url} alt="" className="w-full h-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, logo_url: '' }))}
                      className="text-xs font-semibold"
                      style={{ color: '#f87171' }}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Website URL */}
            <div className="space-y-1.5">
              <label className="section-title">Website URL (optional)</label>
              <input
                value={form.website_url}
                onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))}
                className="input-field"
                placeholder="https://brand.com"
                type="url"
              />
            </div>

            {/* Sort Order + Active */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="section-title">Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                  className="input-field font-mono-num"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-400"
                  />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Active</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1 justify-center py-3"
              >
                {submitting
                  ? <Loader2 size={14} className="animate-spin" />
                  : <CheckCircle2 size={14} />
                }
                {editId ? 'Update' : 'Add'} Brand
              </button>
              <button type="button" onClick={reset} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-14">
          <Award size={36} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-subtle)' }}>No brands yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {brands.map(brand => (
            <div
              key={brand.id}
              className="card card-hover group"
              style={{ opacity: brand.is_active ? 1 : 0.6 }}
            >
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div
                  className="w-14 h-14 rounded-2xl border flex items-center justify-center p-2 bg-white shrink-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {brand.name}
                    </p>
                    {brand.name_urdu && (
                      <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                        {brand.name_urdu}
                      </span>
                    )}
                    {!brand.is_active && (
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          color: '#f87171',
                          borderColor: 'rgba(239,68,68,0.2)',
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>

                  {brand.website_url && (
                    <a
                      href={brand.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] hover:underline"
                      style={{ color: 'var(--brand)' }}
                    >
                      <ExternalLink size={9} /> {brand.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  )}

                  <div
                    className="flex items-center gap-1.5 text-[10px] mt-1"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    <Hash size={9} />
                    <span className="font-mono-num">Order {brand.sort_order}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div
                className="flex items-center gap-1.5 mt-4 pt-3.5 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <button
                  onClick={() => handleToggle(brand)}
                  title={brand.is_active ? 'Deactivate' : 'Activate'}
                  className="btn-icon w-8 h-8"
                  style={{ color: brand.is_active ? '#4ade80' : 'var(--text-subtle)' }}
                >
                  {brand.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  onClick={() => handleEdit(brand)}
                  className="btn-icon w-8 h-8 hover:!text-blue-400"
                >
                  <Edit size={13} />
                </button>
                <button
                  onClick={() => handleDelete(brand.id, brand.name)}
                  className="btn-icon w-8 h-8 hover:!text-red-400 ml-auto"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
