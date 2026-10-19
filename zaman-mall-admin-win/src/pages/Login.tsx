import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

function ThemeToggleBtn() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="fixed top-5 right-5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
    >
      {isDark
        ? <><span className="text-amber-400">☀</span> Light</>
        : <><span className="text-indigo-400">☽</span> Dark</>
      }
    </button>
  );
}

export default function Login() {
  const { login } = useAdmin();
  const { showAlert } = useAlert();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) showAlert('error', 'Access Denied', result.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-theme" style={{ background: 'var(--bg)' }}>
      <ThemeToggleBtn />

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8 animate-slide-down">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
            }}
          >
            <Shield size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            Admin Portal
          </h1>
          <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-subtle)' }}>
            Zaman Sons Super Mall
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7 animate-scale-in"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: isDark
              ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)'
              : '0 8px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
          }}
        >
          {/* Alert strip */}
          <div
            className="flex items-center gap-2.5 mb-6 px-3.5 py-2.5 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
          >
            <Sparkles size={13} style={{ color: 'var(--brand)', flexShrink: 0 }} />
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--brand)' }}>
              Authorized personnel only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="section-title">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@zamansons.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="section-title">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2 py-3"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield size={15} />
                  Access Dashboard
                  <ArrowRight size={14} className="ml-auto" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-subtle)' }}>
            Connected · Supabase · Secure Session
          </p>
        </div>
      </div>
    </div>
  );
}
