import React, { useState, useRef } from 'react';
import { Plus, Trash2, Power, Image as ImageIcon, Video, X, Upload, Loader2 } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAlert } from '../context/AlertContext';
import { uploadToCloudinary, uploadVideoToCloudinary } from '../services/cloudinary';
import { Ad } from '../types';

export default function Banners() {
  const { ads, addAd, updateAd, removeAd } = useAdmin();
  const { showAlert } = useAlert();
  const [form, setForm]       = useState<Partial<Ad>>({ title: '', imageUrl: '', videoUrl: '', link: '#/shop', active: true });
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  const handleImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try { const url = await uploadToCloudinary(f); setForm(p => ({ ...p, imageUrl: url, videoUrl: '' })); }
    catch { showAlert('error', 'Upload Failed'); }
    setUploading(false);
  };

  const handleVid = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try { const url = await uploadVideoToCloudinary(f); setForm(p => ({ ...p, videoUrl: url })); }
    catch { showAlert('error', 'Upload Failed'); }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || (!form.imageUrl && !form.videoUrl)) {
      showAlert('warning', 'Missing Fields', 'Title and image/video are required.');
      return;
    }
    try {
      await addAd({ ...form as Ad, id: crypto.randomUUID() });
      setForm({ title: '', imageUrl: '', videoUrl: '', link: '#/shop', active: true });
      showAlert('success', 'Banner Published');
    } catch { showAlert('error', 'Failed'); }
  };

  const handleToggle = async (ad: Ad) => {
    try { await updateAd({ ...ad, active: !ad.active }); showAlert('success', ad.active ? 'Banner Disabled' : 'Banner Enabled'); }
    catch { showAlert('error', 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try { await removeAd(id); showAlert('info', 'Deleted'); }
    catch { showAlert('error', 'Failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Add Form */}
        <div className="card-premium">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <ImageIcon size={14} style={{ color: 'var(--brand)' }} />
            </div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Create New Banner</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="section-title">Banner Title *</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder="e.g. Summer Sale" />
            </div>

            <div className="space-y-1.5">
              <label className="section-title">Media Asset</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" onClick={() => imgRef.current?.click()} disabled={uploading}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl transition-all group"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                  <ImageIcon size={18} style={{ color: '#60a5fa' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>Image</span>
                </button>
                <button type="button" onClick={() => vidRef.current?.click()} disabled={uploading}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl transition-all group"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                  <Video size={18} style={{ color: '#c084fc' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>Video</span>
                </button>
              </div>
              <input type="file" ref={imgRef} onChange={handleImg} accept="image/*" className="hidden" />
              <input type="file" ref={vidRef} onChange={handleVid} accept="video/*" className="hidden" />
              {uploading && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--brand)' }}>
                  <Loader2 size={13} className="animate-spin" /> Uploading...
                </div>
              )}
              {(form.imageUrl || form.videoUrl) && (
                <div className="relative h-24 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {form.videoUrl
                    ? <video src={form.videoUrl} muted autoPlay loop className="w-full h-full object-cover opacity-60" />
                    : <img src={form.imageUrl} className="w-full h-full object-cover opacity-70" alt="" />
                  }
                  <button type="button" onClick={() => setForm(p => ({ ...p, imageUrl: '', videoUrl: '' }))}
                    className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center bg-black/60 hover:bg-red-500 transition-colors text-white">
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="section-title">Link URL</label>
              <input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} className="input-field font-mono-num" placeholder="#/shop" />
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3">
              <Plus size={15} /> Publish Banner
            </button>
          </form>
        </div>

        {/* Live preview */}
        <div className="flex flex-col gap-3">
          <p className="section-title text-center">Live Preview</p>
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden" style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
            {form.videoUrl ? (
              <video src={form.videoUrl} muted autoPlay loop className="w-full h-full object-cover opacity-50" />
            ) : form.imageUrl ? (
              <img src={form.imageUrl} className="w-full h-full object-cover opacity-50" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={40} style={{ color: 'var(--text-subtle)' }} />
              </div>
            )}
            <div className="absolute inset-0 flex flex-col justify-end p-6" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand)' }}>Preview</p>
              <h2 className="text-xl font-extrabold text-white uppercase tracking-tight leading-tight">{form.title || 'Banner Title'}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Existing banners */}
      {ads.length > 0 && (
        <div>
          <p className="section-title mb-4">Published Banners ({ads.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ads.map(ad => (
              <div key={ad.id} className="relative rounded-2xl overflow-hidden aspect-video group" style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                {ad.videoUrl
                  ? <video src={ad.videoUrl} muted autoPlay loop className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                  : <img src={ad.imageUrl} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500" alt={ad.title} />
                }
                <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                  <div className="flex items-end justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{ad.title}</h4>
                      <div className={`w-8 h-0.5 rounded-full mt-1.5 ${ad.active ? 'bg-green-400' : 'bg-gray-600'}`} />
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleToggle(ad)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                        style={{
                          background: ad.active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
                          border: `1px solid ${ad.active ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          color: ad.active ? '#4ade80' : '#64748b',
                        }}>
                        <Power size={13} />
                      </button>
                      <button onClick={() => handleDelete(ad.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-red-500"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
