import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit, X, Upload, Layers, CheckCircle2, Loader2, Eye, EyeOff, Hash } from 'lucide-react';
import { supabase } from '../services/supabase';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAlert } from '../context/AlertContext';
import { Category } from '../types';

const defaultForm = { name: '', name_urdu: '', description: '', image_url: '', icon_url: '', is_active: true, sort_order: 0 };

export default function Categories() {
  const { showAlert } = useAlert();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [isAdding,   setIsAdding]   = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data || []); setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try { const url = await uploadToCloudinary(f); setForm(p => ({ ...p, image_url: url })); showAlert('success', 'Image Uploaded'); }
    catch { showAlert('error', 'Upload Failed'); }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showAlert('warning', 'Name Required'); return; }
    if (!form.image_url)   { showAlert('warning', 'Image Required'); return; }
    setSubmitting(true);
    try {
      if (editId) {
        const { error } = await supabase.from('categories').update(form).eq('id', editId);
        if (error) throw error;
        showAlert('success', 'Updated', `"${form.name}" updated.`);
      } else {
        const { error } = await supabase.from('categories').insert([form]);
        if (error) throw error;
        showAlert('success', 'Added', `"${form.name}" added.`);
      }
      reset(); fetch();
    } catch (err: any) { showAlert('error', 'Failed', err?.message); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (c: Category) => {
    setEditId(c.id);
    setForm({ name: c.name, name_urdu: c.name_urdu || '', description: c.description || '', image_url: c.image_url, icon_url: c.icon_url || '', is_active: c.is_active, sort_order: c.sort_order });
    setIsAdding(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      showAlert('info', 'Deleted'); fetch();
    } catch { showAlert('error', 'Failed'); }
  };

  const handleToggle = async (c: Category) => {
    try {
      await supabase.from('categories').update({ is_active: !c.is_active }).eq('id', c.id);
      showAlert('success', c.is_active ? 'Hidden' : 'Visible', `"${c.name}" ${c.is_active ? 'deactivated' : 'activated'}.`);
      fetch();
    } catch { showAlert('error', 'Failed'); }
  };

  const reset = () => { setIsAdding(false); setEditId(null); setForm(defaultForm); };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Layers size={14} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Categories</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-subtle)' }}>{categories.length} total</p>
          </div>
        </div>
        <button onClick={() => { setIsAdding(true); reset(); setIsAdding(true); }} className="btn-primary">
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* Form */}
      {isAdding && (
        <div className="card-premium animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{editId ? 'Edit Category' : 'New Category'}</h3>
            <button className="btn-icon" onClick={reset}><X size={15} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="section-title">Name (English) *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Category name" />
              </div>
              <div className="space-y-1.5">
                <label className="section-title">Name (Urdu)</label>
                <input value={form.name_urdu} onChange={e => setForm(p => ({ ...p, name_urdu: e.target.value }))} className="input-field" placeholder="اردو میں نام" dir="rtl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="section-title">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field resize-none" rows={2} />
            </div>
            <div className="space-y-1.5">
              <label className="section-title">Category Image *</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => imgRef.current?.click()} disabled={uploading}
                  className="btn-secondary !py-2">
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <input type="file" ref={imgRef} onChange={handleImgUpload} accept="image/*" className="hidden" />
                {form.image_url && (
                  <>
                    <div className="avatar w-12 h-12"><img src={form.image_url} alt="" className="object-cover" /></div>
                    <button type="button" onClick={() => setForm(p => ({ ...p, image_url: '' }))} className="text-xs font-semibold" style={{ color: '#f87171' }}>Remove</button>
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="section-title">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="input-field font-mono-num" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-amber-400" />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {editId ? 'Update' : 'Add'} Category
              </button>
              <button type="button" onClick={reset} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-14">
          <Layers size={36} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-subtle)' }}>No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="card card-hover group"
              style={{ opacity: cat.is_active ? 1 : 0.6 }}
            >
              <div className="flex items-start gap-4">
                <div className="avatar w-14 h-14 !rounded-2xl shrink-0">
                  <img src={cat.image_url} alt={cat.name} className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{cat.name}</p>
                    {cat.name_urdu && <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{cat.name_urdu}</span>}
                    {!cat.is_active && <span className="badge" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>Inactive</span>}
                  </div>
                  {cat.description && <p className="text-xs line-clamp-2 mb-1" style={{ color: 'var(--text-muted)' }}>{cat.description}</p>}
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                    <Hash size={9} />
                    <span className="font-mono-num">Order {cat.sort_order}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-4 pt-3.5 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => handleToggle(cat)} title={cat.is_active ? 'Deactivate' : 'Activate'}
                  className="btn-icon w-8 h-8" style={{ color: cat.is_active ? '#4ade80' : 'var(--text-subtle)' }}>
                  {cat.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button onClick={() => handleEdit(cat)} className="btn-icon w-8 h-8 hover:!text-blue-400"><Edit size={13} /></button>
                <button onClick={() => handleDelete(cat.id, cat.name)} className="btn-icon w-8 h-8 hover:!text-red-400 ml-auto"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
