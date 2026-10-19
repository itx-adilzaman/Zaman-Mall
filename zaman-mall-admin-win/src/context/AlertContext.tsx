import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface AlertContextType {
  showAlert: (type: Alert['type'], title: string, message?: string, duration?: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = useCallback((type: Alert['type'], title: string, message?: string, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlerts(p => [...p, { id, type, title, message }]);
    setTimeout(() => setAlerts(p => p.filter(a => a.id !== id)), duration);
  }, []);

  const cfg = {
    success: { icon: CheckCircle2, accent: '#4ade80', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)' },
    error:   { icon: AlertCircle,  accent: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
    warning: { icon: AlertTriangle,accent: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
    info:    { icon: Info,         accent: '#60a5fa', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)' },
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none" style={{ maxWidth: '360px', width: '100%' }}>
        {alerts.map(alert => {
          const c = cfg[alert.type];
          return (
            <div
              key={alert.id}
              className="pointer-events-auto animate-slide-down flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-xl"
              style={{
                background: 'var(--card)',
                border: `1px solid ${c.border}`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px ${c.border}`,
              }}
            >
              {/* Accent bar */}
              <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r" style={{ background: c.accent }} />

              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: c.bg }}
              >
                <c.icon size={14} style={{ color: c.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>{alert.title}</p>
                {alert.message && (
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{alert.message}</p>
                )}
              </div>
              <button
                onClick={() => setAlerts(p => p.filter(a => a.id !== alert.id))}
                className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-subtle)' }}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
};
