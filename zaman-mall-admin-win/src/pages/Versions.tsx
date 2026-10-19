import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, AlertTriangle, Download, Calendar, Smartphone, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAlert } from '../context/AlertContext';
import { AppVersion } from '../types';

const defaultForm = { version_code: '', download_url: 'https://zamanmall.netlify.app/Zaman%20Mall.apk', is_critical: false, release_notes: '' };

export default function Versions() {
  const { showAlert } = useAlert();
  const [versions,    setVersions]    = useState<AppVersion[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [isAdding,    setIsAdding]    = useState(false);
  const [form,        setForm]        = useState(defaultForm);
  const [submitting,  setSubmitting]  = useState(false);

  const fetchVersions = async () => {
    setLoading(true);
    const { data } = await supabase.from('app_versions').select('*').order('created_at', { ascending: false });
    setVersions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchVersions(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const { data: existing } = await supabase.from('app_versions').select('*').eq('version_code', form.version_code).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('app_versions').update(form).eq('version_code', form.version_code);
        if (error) throw error;
        showAlert('success', 'Version Updated', `v${form.version_code} updated.`);
      } else {
        const { error } = await supabase.from('app_versions').insert([form]);
        if (error) throw error;
        showAlert('success', 'Version Published', `v${form.version_code} published.`);
      }
      setForm(defaultForm); setIsAdding(false); fetchVersions();
    } catch (err: any) { showAlert('error', 'Failed', err?.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete v${code}?`)) return;
    try {
      const { error } = await supabase.from('app_versions').delete().eq('id', id);
      if (error) throw error;
      showAlert('info', 'Deleted', `v${code} removed.`); fetchVersions();
    } catch (err: any) { showAlert('error', 'Failed', err?.message); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <Smartphone size={14} style={{ color: '#818cf8' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>App Versions</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-subtle)' }}>{versions.length} releases</p>
          </div>
        </div>
        <button onClick={() => setIsAdding(true)} className="btn-primary"><Plus size={14} />New Version</button>
      </div>

      {/* Form */}
      {isAdding && (
        <div className="card-premium animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Add / Update Release</h3>
            <button className="btn-icon" onClick={() => setIsAdding(false)}><X size={15} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="section-title">Version Code *</label>
                <input required value={form.version_code} onChange={e => setForm(p => ({ ...p, version_code: e.target.value }))}
                  className="input-field font-mono-num" placeholder="e.g. 1.2.0" />
              </div>
              <div className="space-y-1.5">
                <label className="section-title">Download URL *</label>
                <input required value={form.download_url} onChange={e => setForm(p => ({ ...p, download_url: e.target.value }))}
                  className="input-field font-mono-num text-xs" placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="section-title">Release Notes</label>
              <textarea value={form.release_notes} onChange={e => setForm(p => ({ ...p, release_notes: e.target.value }))}
                className="input-field resize-none" rows={3} placeholder="What's new in this version..." />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_critical} onChange={e => setForm(p => ({ ...p, is_critical: e.target.checked }))}
                className="w-4 h-4 rounded accent-red-400" />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Force Update (Critical)</span>
              {form.is_critical && <AlertTriangle size={13} className="text-red-400 animate-pulse" />}
            </label>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Save Release
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Versions list */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Release History</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--brand)' }} />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-14">
            <Smartphone size={36} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-subtle)' }}>No releases yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {versions.map(v => (
              <div key={v.id} className="px-5 py-4 flex items-start gap-4 group hover:bg-hover transition-colors" style={{ '--tw-bg-opacity': 1 } as any}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <Smartphone size={15} style={{ color: '#818cf8' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-bold text-sm font-mono-num" style={{ color: 'var(--text)' }}>v{v.version_code}</span>
                    {v.is_critical && (
                      <span className="badge" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>
                        <AlertTriangle size={9} className="animate-pulse" /> Critical
                      </span>
                    )}
                  </div>
                  {v.release_notes && <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>{v.release_notes}</p>}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                      <Calendar size={10} />
                      {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <a href={v.download_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-semibold hover:underline transition-colors" style={{ color: '#60a5fa' }}
                      onClick={e => e.stopPropagation()}>
                      <Download size={10} /> APK
                    </a>
                  </div>
                </div>
                <button onClick={() => handleDelete(v.id, v.version_code)}
                  className="btn-icon w-8 h-8 opacity-0 group-hover:opacity-100 hover:!text-red-400 transition-all shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
