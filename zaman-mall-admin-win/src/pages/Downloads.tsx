import React, { useState, useEffect } from 'react';
import {
  Smartphone, Monitor, RefreshCw, Save, ExternalLink,
  CheckCircle2, AlertCircle, Loader2, Link2, Eye, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAlert } from '../context/AlertContext';

interface DownloadLink {
  id: string;
  platform: string;
  download_url: string;
  is_active: boolean;
  label: string;
  sub_label: string;
  version: string;
  updated_at: string;
}

interface FormState {
  download_url: string;
  is_active: boolean;
  version: string;
  sub_label: string;
}

const PLATFORM_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  topLabel: string;
  placeholder: string;
  defaultSubLabel: string;
}> = {
  android: {
    icon: <Smartphone size={18} style={{ color: '#4ade80' }} />,
    color: '#4ade80',
    borderColor: 'rgba(74,222,128,0.2)',
    bgColor: 'rgba(74,222,128,0.06)',
    topLabel: 'Android APK',
    placeholder: 'https://drive.google.com/...',
    defaultSubLabel: 'Free Download ↓',
  },
  windows: {
    icon: <Monitor size={18} style={{ color: '#fb923c' }} />,
    color: '#fb923c',
    borderColor: 'rgba(251,146,60,0.2)',
    bgColor: 'rgba(251,146,60,0.06)',
    topLabel: 'Windows Software',
    placeholder: 'https://drive.google.com/...',
    defaultSubLabel: 'Desktop App ↓',
  },
  ios: {
    icon: <Smartphone size={18} style={{ color: '#94a3b8' }} />,
    color: '#94a3b8',
    borderColor: 'rgba(148,163,184,0.15)',
    bgColor: 'rgba(148,163,184,0.04)',
    topLabel: 'iOS App',
    placeholder: 'https://apps.apple.com/...',
    defaultSubLabel: 'Coming Soon ⏳',
  },
};

const PLATFORMS = ['android', 'windows', 'ios'];

const defaultForm: FormState = {
  download_url: '',
  is_active: false,
  version: '',
  sub_label: '',
};

export default function Downloads() {
  const { showAlert } = useAlert();
  const [links, setLinks] = useState<Record<string, DownloadLink>>({});
  const [forms, setForms] = useState<Record<string, FormState>>({
    android: { ...defaultForm, is_active: true, sub_label: 'Free Download ↓' },
    windows: { ...defaultForm, is_active: true, sub_label: 'Desktop App ↓' },
    ios:     { ...defaultForm, is_active: false, sub_label: 'Coming Soon ⏳' },
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('download_links')
        .select('*')
        .order('platform');
      if (error) throw error;

      const map: Record<string, DownloadLink> = {};
      const formMap: Record<string, FormState> = {};

      (data || []).forEach((row: DownloadLink) => {
        map[row.platform] = row;
        formMap[row.platform] = {
          download_url: row.download_url,
          is_active: row.is_active,
          version: row.version,
          sub_label: row.sub_label,
        };
      });

      setLinks(map);
      // Merge fetched with defaults (in case some platforms missing from DB)
      setForms(prev => ({ ...prev, ...formMap }));
    } catch (err: any) {
      showAlert('error', 'Fetch Failed', err?.message || 'Could not load download links');
    }
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleSave = async (platform: string) => {
    setSaving(platform);
    try {
      const form = forms[platform];
      const existing = links[platform];

      if (existing) {
        const { error } = await supabase
          .from('download_links')
          .update({
            download_url: form.download_url,
            is_active: form.is_active,
            version: form.version,
            sub_label: form.sub_label,
          })
          .eq('platform', platform);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('download_links')
          .insert({
            platform,
            label: PLATFORM_CONFIG[platform]?.topLabel || platform,
            download_url: form.download_url,
            is_active: form.is_active,
            version: form.version,
            sub_label: form.sub_label,
          });
        if (error) throw error;
      }

      showAlert('success', 'Saved', `${PLATFORM_CONFIG[platform]?.topLabel} link updated.`);
      fetchLinks();
    } catch (err: any) {
      showAlert('error', 'Save Failed', err?.message || 'Could not save link');
    }
    setSaving(null);
  };

  const updateForm = (platform: string, field: keyof FormState, value: string | boolean) => {
    setForms(prev => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value },
    }));
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Link2 size={14} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Download Links</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-subtle)' }}>
              Website footer aur navbar ke download buttons control karein
            </p>
          </div>
        </div>
        <button onClick={fetchLinks} className="btn-secondary">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      ) : (
        <>
          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => {
              const cfg = PLATFORM_CONFIG[platform];
              const form = forms[platform];
              const existing = links[platform];
              const isSaving = saving === platform;

              return (
                <div
                  key={platform}
                  className="card !p-0 overflow-hidden"
                  style={{ border: `1px solid ${cfg.borderColor}` }}
                >
                  {/* Card top bar */}
                  <div
                    className="px-4 py-3 flex items-center justify-between border-b"
                    style={{ background: cfg.bgColor, borderColor: cfg.borderColor }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
                      >
                        {cfg.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{cfg.topLabel}</p>
                        <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
                          {platform}
                        </p>
                      </div>
                    </div>

                    {/* Active toggle */}
                    <button
                      onClick={() => updateForm(platform, 'is_active', !form.is_active)}
                      className="flex items-center gap-1.5 transition-all"
                      style={{ color: form.is_active ? cfg.color : 'var(--text-subtle)' }}
                      title={form.is_active ? 'Disable' : 'Enable'}
                    >
                      {form.is_active
                        ? <ToggleRight size={22} />
                        : <ToggleLeft size={22} />
                      }
                      <span className="text-[10px] font-bold uppercase tracking-wide hidden sm:inline">
                        {form.is_active ? 'Active' : 'Off'}
                      </span>
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="p-4 space-y-3">

                    {/* Download URL */}
                    <div className="space-y-1.5">
                      <label className="section-title">Download URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={form.download_url}
                          onChange={e => updateForm(platform, 'download_url', e.target.value)}
                          placeholder={cfg.placeholder}
                          className="input-field flex-1 text-xs font-mono-num"
                        />
                        {form.download_url && form.download_url !== '#' && (
                          <a
                            href={form.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon shrink-0"
                            title="Test link"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Version + Sub label */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="section-title">Version</label>
                        <input
                          type="text"
                          value={form.version}
                          onChange={e => updateForm(platform, 'version', e.target.value)}
                          placeholder="v1.0.0"
                          className="input-field text-xs font-mono-num"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="section-title">Button Text</label>
                        <input
                          type="text"
                          value={form.sub_label}
                          onChange={e => updateForm(platform, 'sub_label', e.target.value)}
                          placeholder={cfg.defaultSubLabel}
                          className="input-field text-xs"
                        />
                      </div>
                    </div>

                    {/* Last updated */}
                    {existing?.updated_at && (
                      <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                        Last saved: {new Date(existing.updated_at).toLocaleString()}
                      </p>
                    )}

                    {/* Save button */}
                    <button
                      onClick={() => handleSave(platform)}
                      disabled={isSaving}
                      className="btn-primary w-full justify-center py-2.5"
                      style={
                        isSaving
                          ? { opacity: 0.5, cursor: 'not-allowed' }
                          : { background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` }
                      }
                    >
                      {isSaving
                        ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                        : <><Save size={13} /> Save Link</>
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Preview */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={14} style={{ color: 'var(--brand)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Live Preview</p>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-subtle)' }}>
                — website footer mein aisa dikhega
              </span>
            </div>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-3 p-5 rounded-xl"
              style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}
            >
              {['android', 'windows'].map(platform => {
                const form = forms[platform];
                if (!form?.is_active) return (
                  <div
                    key={platform}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-30 border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  >
                    {PLATFORM_CONFIG[platform].icon}
                    <div>
                      <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>Disabled</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                        {PLATFORM_CONFIG[platform].topLabel}
                      </p>
                    </div>
                  </div>
                );
                const cfg = PLATFORM_CONFIG[platform];
                return (
                  <div
                    key={platform}
                    className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all border"
                    style={{ background: cfg.bgColor, borderColor: cfg.borderColor }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${cfg.color}20` }}
                    >
                      {cfg.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-subtle)' }}>
                        {platform === 'android' ? 'Get it on' : 'Download for'}
                      </p>
                      <p className="font-black text-sm leading-tight" style={{ color: 'var(--text)' }}>
                        {platform === 'android' ? 'Android' : 'Windows'}
                      </p>
                      <p className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                        {form.sub_label || cfg.defaultSubLabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info box */}
          <div
            className="flex gap-3 p-4 rounded-xl text-sm border"
            style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.15)' }}
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
            <div style={{ color: 'var(--text-muted)' }}>
              <p className="font-semibold text-xs mb-1" style={{ color: 'var(--text)' }}>Kaise kaam karta hai?</p>
              <p className="text-xs leading-relaxed">
                Yahan links save karne ke baad website ka footer aur navbar hover popup automatically
                naye links use karega. Agar koi platform "Off" hai to us ka button website par
                disabled ya hidden ho jayega. <strong style={{ color: 'var(--brand)' }}>Supabase mein
                <code className="font-mono-num px-1">download_links</code> table run karein pehle.</strong>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
