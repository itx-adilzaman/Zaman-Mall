
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/StoreContext';
import {
  MapPin, Plus, Trash2, Home, Briefcase, Phone, User,
  ArrowLeft, CheckCircle2, ShieldCheck, Globe, Loader2, Sparkles, XCircle, Zap, ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { PAKISTAN_DATA } from '../constants/pakistanData';

// ── Mobile Addresses ───────────────────────────────────────────────────────────
const bg = '#0d0d0d'; const surface = '#1a1a1a'; const border = '#2a2a2a'; const text = '#f0f0f0'; const sub = '#888'; const accent = '#6366f1';

const MobileAddressesView: React.FC = () => {
  const { addresses, addAddress, removeAddress, setDefaultAddress, currentUser } = useStore();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    label: 'Home', fullName: currentUser?.name || '', phone: '',
    streetAddress: '', city: '', province: '', district: '', tehsil: '', isDefault: false
  });

  const provinceData = PAKISTAN_DATA.find(p => p.name === form.province);
  const districts = provinceData?.districts.map(d => d.name) || [];
  const tehsils = provinceData?.districts.find(d => d.name === form.district)?.tehsils || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await addAddress({ ...form });
    setIsLoading(false);
    setIsAdding(false);
    setForm({ label: 'Home', fullName: currentUser?.name || '', phone: '', streetAddress: '', city: '', province: '', district: '', tehsil: '', isDefault: false });
  };

  const inp = (value: string, onChange: (v: string) => void, placeholder: string, type = 'text') => (
    <input type={type} required value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '10px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 9, fontSize: 14, color: text, outline: 'none', boxSizing: 'border-box' }} />
  );

  const sel = (value: string, onChange: (v: string) => void, options: string[], placeholder: string, disabled = false) => (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{ width: '100%', padding: '10px 12px', background: disabled ? '#111' : bg, border: `1px solid ${border}`, borderRadius: 9, fontSize: 14, color: value ? text : sub, outline: 'none', boxSizing: 'border-box', opacity: disabled ? 0.4 : 1 }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: sub, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 6, padding: 0 }}>
            ← Back
          </button>
          <h1 style={{ fontWeight: 800, fontSize: 20, color: text, margin: 0 }}>My Addresses</h1>
          <p style={{ fontSize: 12, color: sub, margin: '3px 0 0' }}>{addresses.length} saved</p>
        </div>
        <button onClick={() => setIsAdding(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: isAdding ? 'rgba(239,68,68,0.12)' : `${accent}18`, border: `1px solid ${isAdding ? 'rgba(239,68,68,0.3)' : accent+'40'}`, borderRadius: 9, color: isAdding ? '#ef4444' : accent, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {isAdding ? <XCircle size={15} /> : <Plus size={15} />}
          {isAdding ? 'Cancel' : 'Add New'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} style={{ padding: '14px 14px', borderBottom: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 11 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: text, margin: 0 }}>New Address</p>

          {/* Label */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['Home','Office','Other'].map(l => (
              <button key={l} type="button" onClick={() => setForm(p => ({ ...p, label: l }))} style={{
                flex: 1, padding: '8px 0', borderRadius: 9, border: form.label === l ? `2px solid ${accent}` : `1px solid ${border}`,
                background: form.label === l ? `${accent}18` : surface, color: form.label === l ? accent : sub, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div>
              <label style={{ fontSize: 11, color: sub, fontWeight: 600, display: 'block', marginBottom: 4 }}>Full Name</label>
              {inp(form.fullName, v => setForm(p => ({ ...p, fullName: v })), 'Full Name')}
            </div>
            <div>
              <label style={{ fontSize: 11, color: sub, fontWeight: 600, display: 'block', marginBottom: 4 }}>Phone</label>
              {inp(form.phone, v => setForm(p => ({ ...p, phone: v })), '+92 XXX XXXXXXX')}
            </div>
            <div>
              <label style={{ fontSize: 11, color: sub, fontWeight: 600, display: 'block', marginBottom: 4 }}>Province</label>
              {sel(form.province, v => setForm(p => ({ ...p, province: v, district: '', tehsil: '', city: '' })), PAKISTAN_DATA.map(p => p.name), 'Select Province')}
            </div>
            <div>
              <label style={{ fontSize: 11, color: sub, fontWeight: 600, display: 'block', marginBottom: 4 }}>District</label>
              {sel(form.district, v => setForm(p => ({ ...p, district: v, tehsil: '', city: v })), districts, 'Select District', !form.province)}
            </div>
            <div>
              <label style={{ fontSize: 11, color: sub, fontWeight: 600, display: 'block', marginBottom: 4 }}>Tehsil</label>
              {sel(form.tehsil, v => setForm(p => ({ ...p, tehsil: v })), tehsils, 'Select Tehsil', !form.district)}
            </div>
            <div>
              <label style={{ fontSize: 11, color: sub, fontWeight: 600, display: 'block', marginBottom: 4 }}>Street Address</label>
              <textarea required value={form.streetAddress} onChange={e => setForm(p => ({ ...p, streetAddress: e.target.value }))} rows={2} placeholder="House no, street, area..."
                style={{ width: '100%', padding: '10px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 9, fontSize: 14, color: text, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Default toggle */}
          <button type="button" onClick={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: form.isDefault ? `${accent}12` : surface, border: `1px solid ${form.isDefault ? accent+'50' : border}`, borderRadius: 10, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 22, borderRadius: 11, background: form.isDefault ? accent : '#333', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', left: form.isDefault ? 19 : 3 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: form.isDefault ? accent : sub }}>Set as default address</span>
          </button>

          <button type="submit" disabled={isLoading} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Saving...' : 'Save Address'}
          </button>
        </form>
      )}

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {addresses.length === 0 && !isAdding ? (
          <div style={{ textAlign: 'center', padding: '55px 20px' }}>
            <MapPin size={48} style={{ color: '#333', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 700, fontSize: 17, color: text, marginBottom: 6 }}>No addresses saved</p>
            <p style={{ fontSize: 13, color: sub }}>Add an address for faster checkout.</p>
          </div>
        ) : addresses.map(addr => (
          <div key={addr.id} style={{ background: surface, border: `1px solid ${addr.isDefault ? accent+'50' : border}`, borderRadius: 13, padding: '13px', position: 'relative' }}>
            {addr.isDefault && <span style={{ position: 'absolute', top: -8, right: 12, background: accent, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 9px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Default</span>}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {addr.label === 'Home' ? <Home size={16} style={{ color: accent }} /> : addr.label === 'Office' ? <Briefcase size={16} style={{ color: accent }} /> : <MapPin size={16} style={{ color: accent }} />}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{addr.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!addr.isDefault && (
                  <button onClick={() => setDefaultAddress(addr.id)} title="Set default" style={{ width: 30, height: 30, background: surface, border: `1px solid ${border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <ShieldCheck size={14} style={{ color: sub }} />
                  </button>
                )}
                <button onClick={() => removeAddress(addr.id)} style={{ width: 30, height: 30, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={14} style={{ color: '#ef4444' }} />
                </button>
              </div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: '0 0 3px' }}>{addr.fullName}</p>
            <p style={{ fontSize: 12, color: sub, margin: '0 0 3px' }}>{addr.phone}</p>
            <p style={{ fontSize: 12, color: sub, margin: 0 }}>{addr.streetAddress}</p>
            {(addr.tehsil || addr.district || addr.province) && (
              <p style={{ fontSize: 11, fontWeight: 600, color: accent, margin: '5px 0 0' }}>{[addr.tehsil, addr.district, addr.province].filter(Boolean).join(' • ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Premium Searchable Select Component
const SearchableSelect: React.FC<{
  label: string,
  value: string,
  onChange: (val: string) => void,
  options: string[],
  disabled?: boolean,
  icon: React.ReactNode,
  placeholder: string
}> = ({ label, value, onChange, options, disabled, icon, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4" ref={containerRef}>
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">{label}</label>
      <div className={`relative group ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full bg-[#030712]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] py-5 pl-16 pr-12 text-sm cursor-pointer transition-all flex items-center justify-between ${isOpen ? 'border-blue-600 ring-4 ring-blue-600/10' : 'hover:border-white/20'
            }`}
        >
          <div className="absolute left-6 text-gray-600 group-hover:text-blue-500 transition-colors">
            {icon}
          </div>
          <span className={`truncate ${value ? 'text-white font-bold' : 'text-gray-500'}`}>
            {value || placeholder}
          </span>
          <ChevronDown size={16} className={`text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-4 bg-[#0a0f1d] border border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[100] overflow-hidden animate-fade-in backdrop-blur-2xl">
            <div className="p-4 border-b border-white/5 bg-white/5">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-6 text-xs text-white outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`px-8 py-4 text-xs font-bold transition-all cursor-pointer flex items-center justify-between group/opt ${value === opt ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    {opt}
                    {value === opt && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                ))
              ) : (
                <div className="px-8 py-10 text-center text-gray-500 text-[10px] font-black uppercase tracking-widest">
                  No matches found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Addresses: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileAddressesView />;

  const { addresses, addAddress, removeAddress, setDefaultAddress, currentUser } = useStore();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    label: 'Home',
    fullName: currentUser?.name || '',
    phone: '',
    streetAddress: '',
    city: '',
    province: '',
    district: '',
    tehsil: '',
    isDefault: false
  });

  const selectedProvinceData = PAKISTAN_DATA.find(p => p.name === formData.province);
  const districts = selectedProvinceData?.districts.map(d => d.name) || [];

  const selectedDistrictData = selectedProvinceData?.districts.find(d => d.name === formData.district);
  const tehsils = selectedDistrictData?.tehsils || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await addAddress({
      ...formData
    });
    setIsLoading(false);
    setIsAdding(false);
    setFormData({
      label: 'Home',
      fullName: currentUser?.name || '',
      phone: '',
      streetAddress: '',
      city: '',
      province: '',
      district: '',
      tehsil: '',
      isDefault: false
    });
  };

  return (
    <div className="min-h-screen bg-[#010409] text-white pt-24 pb-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-blue-600/5 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-purple-600/5 blur-[160px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-8 mb-20 reveal">
          <div className="space-y-4">
            <Link to="/profile" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-4">
              <ArrowLeft size={16} /> Back to Identity Hub
            </Link>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none text-white">
              Logistics <span className="gradient-text">Nodes</span>
            </h1>
            <p className="text-gray-400 text-lg font-medium">Provisioning shipping coordinates for imperial delivery.</p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="group px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-2xl overflow-hidden"
          >
            {isAdding ? <><XCircle size={18} /> Close Protocol</> : <><Plus size={18} /> Provision New Node</>}
          </button>
        </div>

        {isAdding && (
          <div className="glass-dark p-10 md:p-16 rounded-[4rem] border-white/10 animate-fade-in mb-16 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-12 flex items-center gap-4">
              <Sparkles className="text-blue-500" /> Coordinate Configuration
            </h3>
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Node Designation</label>
                  <div className="flex gap-4">
                    {['Home', 'Office', 'Other'].map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setFormData({ ...formData, label: l })}
                        className={`flex-1 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${formData.label === l ? 'bg-blue-600 border-blue-500 text-white' : 'glass border-white/5 text-gray-500 hover:border-white/20'
                          }`}
                      >
                        {l === 'Home' && <Home size={14} className="inline mr-2" />}
                        {l === 'Office' && <Briefcase size={14} className="inline mr-2" />}
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Authorized Receiver</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500" size={18} />
                    <input
                      required
                      type="text"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Receiver Full Name"
                      className="w-full bg-[#030712] border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-sm focus:border-blue-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Verification Signal (Phone)</label>
                  <div className="relative group">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500" size={18} />
                    <input
                      required
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+92 XXX XXXXXXX"
                      className="w-full bg-[#030712] border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-sm focus:border-blue-600 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Province Select */}
                <SearchableSelect
                  label="Province"
                  value={formData.province}
                  onChange={val => setFormData({ ...formData, province: val, district: '', tehsil: '', city: '' })}
                  options={PAKISTAN_DATA.map(p => p.name)}
                  icon={<Globe size={18} />}
                  placeholder="Select Province"
                />

                {/* District Select */}
                <SearchableSelect
                  label="District"
                  value={formData.district}
                  disabled={!formData.province}
                  onChange={val => setFormData({ ...formData, district: val, tehsil: '', city: val })}
                  options={districts}
                  icon={<MapPin size={18} />}
                  placeholder="Select District"
                />

                {/* Tehsil Select */}
                <SearchableSelect
                  label="Tehsil"
                  value={formData.tehsil}
                  disabled={!formData.district}
                  onChange={val => setFormData({ ...formData, tehsil: val })}
                  options={tehsils}
                  icon={<Zap size={18} />}
                  placeholder="Select Tehsil"
                />


                <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Precise Logistic Coordinates</label>
                  <textarea
                    required
                    value={formData.streetAddress}
                    onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                    placeholder="Full Street Address, Area, House No."
                    rows={3}
                    className="w-full bg-[#030712] border border-white/10 rounded-[2.5rem] py-8 px-10 text-sm focus:border-blue-600 outline-none transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div
                onClick={() => setFormData(prev => ({ ...formData, isDefault: !prev.isDefault }))}
                className={`group flex items-center justify-between gap-6 px-10 py-6 glass border rounded-[2rem] cursor-pointer transition-all duration-500 overflow-hidden ${formData.isDefault
                  ? 'border-blue-500/50 bg-blue-600/10 shadow-[0_10px_30px_rgba(37,99,235,0.1)]'
                  : 'border-white/5 hover:border-white/20'
                  }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${formData.isDefault ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-700'
                    }`}>
                    <ShieldCheck size={20} className={formData.isDefault ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase tracking-widest transition-colors ${formData.isDefault ? 'text-blue-400' : 'text-gray-500'}`}>
                      Primary Logistic Node
                    </h4>
                    <p className="text-[10px] font-medium text-gray-700 mt-1 uppercase tracking-tighter">Designate as default reception point</p>
                  </div>
                </div>

                <div className={`w-14 h-8 rounded-full border transition-all duration-500 relative ${formData.isDefault ? 'bg-blue-600 border-blue-400' : 'bg-black/40 border-white/10'
                  }`}>
                  <div className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-xl transition-all duration-500 ${formData.isDefault ? 'left-[calc(100%-1.65rem)]' : 'left-1.5'
                    }`} />
                </div>
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="w-full py-8 bg-white text-black rounded-full font-black text-[12px] uppercase tracking-[0.6em] transition-all hover:bg-blue-600 hover:text-white shadow-2xl disabled:opacity-50 active:scale-95"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Protocol'}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {addresses.length > 0 ? addresses.map(addr => (
            <div
              key={addr.id}
              className={`group relative glass rounded-[3.5rem] p-10 border transition-all duration-700 hover:scale-[1.02] ${addr.isDefault ? 'border-blue-500/40 bg-blue-600/5 shadow-[0_20px_60px_rgba(37,99,235,0.15)]' : 'border-white/5 hover:border-white/20'
                }`}
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${addr.isDefault ? 'bg-blue-600 text-white border-blue-400/30 shadow-xl' : 'bg-white/5 text-gray-500 border-white/10'
                    }`}>
                    {addr.label === 'Home' ? <Home size={22} /> : addr.label === 'Office' ? <Briefcase size={22} /> : <MapPin size={22} />}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white tracking-tight uppercase">{addr.label}</h4>
                    {addr.isDefault && <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-1">Primary Reception Node</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!addr.isDefault && (
                    <button
                      onClick={() => setDefaultAddress(addr.id)}
                      className="p-3 glass rounded-xl text-gray-600 hover:text-blue-400 transition-all"
                      title="Set as Default"
                    >
                      <ShieldCheck size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => removeAddress(addr.id)}
                    className="p-3 glass rounded-xl text-gray-600 hover:text-red-500 transition-all"
                    title="Evict Node"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <p className="text-sm font-black text-white">{addr.fullName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  <p className="text-sm font-medium text-gray-400">{addr.phone}</p>
                </div>
                <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    {addr.streetAddress}
                  </p>
                  {(addr.tehsil || addr.district || addr.province) && (
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-4 pt-4 border-t border-white/5">
                      {[addr.tehsil, addr.district, addr.province].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>
              </div>

              {addr.isDefault && (
                <div className="absolute top-[-10px] right-8">
                  <div className="px-5 py-2 bg-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-xl animate-pulse">
                    Active
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="md:col-span-2 text-center py-40 glass rounded-[6rem] border-dashed border-white/10 shadow-2xl">
              <MapPin size={80} className="mx-auto text-gray-800 mb-8 animate-float opacity-30" />
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Coordinates Missing</h3>
              <p className="text-gray-500 text-lg font-medium max-w-sm mx-auto leading-relaxed">No logistics nodes have been authorized. Provision a coordinate to enable rapid asset acquisition.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
