import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { THEME_COLORS, GRADIENTS, BORDER_RADIUS } from '../constants/theme';
import { useIsMobile } from '../hooks/useIsMobile';

// Alert Types
type AlertType = 'success' | 'error' | 'warning' | 'info';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
  duration?: number;
  hasDownloadButton?: boolean;
}

// Alert context
interface AlertContextType {
  showAlert: (type: AlertType, title: string, message?: string, duration?: number, hasDownloadButton?: boolean) => string;
  hideAlert: (id: string) => void;
  clearAllAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Alert Provider Component
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = (type: AlertType, title: string, message?: string, duration = 2000, hasDownloadButton = false): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newAlert: Alert = { id, type, title, message, duration, hasDownloadButton };

    setAlerts(prev => [...prev, newAlert]);

    if (duration > 0) {
      setTimeout(() => {
        hideAlert(id);
      }, duration);
    }

    return id;
  };

  const hideAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, clearAllAlerts }}>
      {children}
      <AlertContainer alerts={alerts} hideAlert={hideAlert} />
    </AlertContext.Provider>
  );
};

// Hook to use alerts
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Alert configuration based on type
const getAlertConfig = (type: AlertType) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle,
        bgGradient: THEME_COLORS.success ? THEME_COLORS.success[500] : '#22c55e',
        borderColor: THEME_COLORS.success ? THEME_COLORS.success[500] : '#22c55e',
        iconColor: THEME_COLORS.success ? THEME_COLORS.success[600] : '#16a34a',
        titleColor: THEME_COLORS.success ? THEME_COLORS.success[800] : '#15803d',
        messageColor: THEME_COLORS.success ? THEME_COLORS.success[700] : '#15803d',
        shadowColor: `0 0 30px ${THEME_COLORS.success ? THEME_COLORS.success[500] : '#22c55e'}40`,
      };
    case 'error':
      return {
        icon: XCircle,
        bgGradient: THEME_COLORS.error ? THEME_COLORS.error[500] : '#ef4444',
        borderColor: THEME_COLORS.error ? THEME_COLORS.error[500] : '#ef4444',
        iconColor: THEME_COLORS.error ? THEME_COLORS.error[600] : '#dc2626',
        titleColor: THEME_COLORS.error ? THEME_COLORS.error[800] : '#991b1b',
        messageColor: THEME_COLORS.error ? THEME_COLORS.error[700] : '#b91c1c',
        shadowColor: `0 0 30px ${THEME_COLORS.error ? THEME_COLORS.error[500] : '#ef4444'}40`,
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        bgGradient: THEME_COLORS.warning ? THEME_COLORS.warning[500] : '#f59e0b',
        borderColor: THEME_COLORS.warning ? THEME_COLORS.warning[500] : '#f59e0b',
        iconColor: THEME_COLORS.warning ? THEME_COLORS.warning[600] : '#d97706',
        titleColor: THEME_COLORS.warning ? THEME_COLORS.warning[800] : '#92400e',
        messageColor: THEME_COLORS.warning ? THEME_COLORS.warning[700] : '#b45309',
        shadowColor: `0 0 30px ${THEME_COLORS.warning ? THEME_COLORS.warning[500] : '#f59e0b'}40`,
      };
    case 'info':
    default:
      return {
        icon: Info,
        bgGradient: THEME_COLORS.primary[500],
        borderColor: THEME_COLORS.primary[500],
        iconColor: THEME_COLORS.primary[600],
        titleColor: THEME_COLORS.primary[800],
        messageColor: THEME_COLORS.primary[700],
        shadowColor: `0 0 30px ${THEME_COLORS.primary[500]}40`,
      };
  }
};

// Single Alert Component
const AlertItem: React.FC<{ alert: Alert; onHide: (id: string) => void }> = ({ alert, onHide }) => {
  const config = getAlertConfig(alert.type);
  const Icon = config.icon;
  const isMobile = useIsMobile();

  // ── MOBILE: simple clean toast ──────────────────────────────────────────────
  if (isMobile) {
    const mobileColors: Record<AlertType, { bg: string; border: string; icon: string; title: string; text: string }> = {
      success: { bg: '#0d1f14', border: '#16a34a', icon: '#4ade80', title: '#86efac', text: '#bbf7d0' },
      error:   { bg: '#1f0d0d', border: '#dc2626', icon: '#f87171', title: '#fca5a5', text: '#fecaca' },
      warning: { bg: '#1f1700', border: '#d97706', icon: '#fbbf24', title: '#fcd34d', text: '#fde68a' },
      info:    { bg: '#0d1525', border: '#2563eb', icon: '#60a5fa', title: '#93c5fd', text: '#bfdbfe' },
    };
    const mc = mobileColors[alert.type];

    return (
      <div
        style={{
          background: mc.bg,
          border: `1px solid ${mc.border}`,
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          position: 'relative',
        }}
      >
        {/* thin top accent line */}
        <div style={{ height: '3px', background: mc.icon }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '10px 12px', gap: '10px' }}>
          <Icon size={18} style={{ color: mc.icon, flexShrink: 0, marginTop: '1px' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: mc.title, margin: 0, lineHeight: '1.3' }}>
              {alert.title}
            </p>
            {alert.message && (
              <p style={{ fontSize: '12px', color: mc.text, margin: '2px 0 0', lineHeight: '1.4' }}>
                {alert.message}
              </p>
            )}
            {alert.hasDownloadButton && (
              <button
                onClick={() => {
                  const footer = document.querySelector('footer');
                  if (footer) footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                style={{
                  marginTop: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: mc.icon,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                📱 Download Now
              </button>
            )}
          </div>
          <button
            onClick={() => onHide(alert.id)}
            style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: mc.icon, marginTop: '1px' }}
          >
            <X size={15} />
          </button>
        </div>
        {/* progress bar */}
        {alert.duration && alert.duration > 0 && (
          <div style={{ height: '2px', background: '#e5e7eb' }}>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: alert.duration / 1000, ease: 'linear' }}
              style={{ height: '100%', background: mc.icon }}
            />
          </div>
        )}
      </div>
    );
  }

  // ── DESKTOP: original animated glassmorphism alert ──────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.9, rotateX: 15, transition: { duration: 0.3 } }}
      whileHover={{ 
        scale: 1.03, 
        y: -2,
        transition: { duration: 0.2 }
      }}
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, 
          ${THEME_COLORS.dark.card}98 0%, 
          ${THEME_COLORS.dark.surface}95 50%,
          ${config.bgGradient}15 100%
        )`,
        backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        border: `2px solid ${config.borderColor}80`,
        borderRadius: BORDER_RADIUS['2xl'],
        boxShadow: `
          ${config.shadowColor},
          0 15px 50px rgba(0, 0, 0, 0.4),
          0 5px 20px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.15),
          inset 0 -1px 0 rgba(0, 0, 0, 0.1)
        `,
        minHeight: '90px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            `linear-gradient(45deg, ${config.bgGradient} 0%, transparent 70%)`,
            `linear-gradient(135deg, ${config.bgGradient} 0%, transparent 70%)`,
            `linear-gradient(225deg, ${config.bgGradient} 0%, transparent 70%)`,
            `linear-gradient(315deg, ${config.bgGradient} 0%, transparent 70%)`,
            `linear-gradient(45deg, ${config.bgGradient} 0%, transparent 70%)`
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          background: `linear-gradient(45deg, ${config.bgGradient} 0%, transparent 70%)`
        }}
      />

      {/* Top gradient border with animation */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-2"
        style={{
          background: `linear-gradient(90deg, 
            ${config.bgGradient} 0%, 
            ${config.iconColor} 50%, 
            ${config.bgGradient} 100%
          )`
        }}
        animate={{
          scaleX: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Alert content */}
      <div className="flex items-start p-5 relative z-10">
        {/* Icon with enhanced animation */}
        <motion.div
          initial={{ rotate: 0, scale: 0 }}
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [0, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 0.5, delay: 0.2 },
            scale: { duration: 0.3, delay: 0.1 }
          }}
          whileHover={{ 
            rotate: [0, 360], 
            scale: 1.2,
            transition: { duration: 0.5 }
          }}
          className="flex-shrink-0 mr-4"
          style={{
            color: config.iconColor,
            filter: `drop-shadow(0 0 15px ${config.iconColor}60)`,
          }}
        >
          <Icon size={28} />
        </motion.div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <motion.h4 
            className="font-bold text-lg mb-2"
            style={{ color: config.titleColor }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {alert.title}
          </motion.h4>
          {alert.message && (
            <motion.p 
              className="text-sm leading-relaxed mb-3"
              style={{ color: config.messageColor }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {alert.message}
            </motion.p>
          )}
          
          {/* Download Button */}
          {alert.hasDownloadButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Scroll to footer
                const footer = document.querySelector('footer');
                if (footer) {
                  footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{
                boxShadow: `0 4px 15px ${config.iconColor}40`,
                border: `1px solid ${config.iconColor}60`
              }}
            >
              📱 Download Now
            </motion.button>
          )}
        </div>

        {/* Enhanced close button */}
        <motion.button
          whileHover={{ 
            scale: 1.2, 
            rotate: 90,
            backgroundColor: config.iconColor,
            color: 'white'
          }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onHide(alert.id)}
          className="flex-shrink-0 ml-4 p-2 rounded-xl transition-all duration-200"
          style={{
            color: config.iconColor,
            background: `${config.iconColor}15`,
            border: `1px solid ${config.iconColor}30`
          }}
        >
          <X size={20} />
        </motion.button>
      </div>

      {/* Enhanced progress bar for auto-dismiss */}
      {alert.duration && alert.duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: alert.duration / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 h-2"
          style={{
            background: `linear-gradient(90deg, 
              ${config.bgGradient} 0%, 
              ${config.iconColor} 100%
            )`,
            boxShadow: `0 0 10px ${config.iconColor}60`
          }}
        />
      )}

      {/* Floating particles effect */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: config.iconColor,
            top: `${20 + i * 20}%`,
            left: `${10 + i * 30}%`
          }}
          animate={{
            x: [0, 20, -20, 0],
            y: [0, -10, 10, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Glow effect overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${config.borderColor}20 0%, transparent 50%)`,
        }}
      />
    </motion.div>
  );
};

// Alert Container Component
const AlertContainer: React.FC<{ alerts: Alert[]; hideAlert: (id: string) => void }> = ({ alerts, hideAlert }) => {
  const isMobile = useIsMobile();

  return (
    <AnimatePresence>
      {alerts.length > 0 && (
        <div
          className={`fixed z-[9999] ${
            isMobile
              ? 'top-3 left-3 right-3 space-y-2'
              : 'top-4 right-4 space-y-3 max-w-md w-full'
          }`}
        >
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onHide={hideAlert} />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Convenience functions for different alert types
export const alertUtils = {
  success: (title: string, message?: string, duration?: number) => {
    // This will be used with the hook
    return { type: 'success' as const, title, message, duration };
  },
  error: (title: string, message?: string, duration?: number) => {
    return { type: 'error' as const, title, message, duration };
  },
  warning: (title: string, message?: string, duration?: number) => {
    return { type: 'warning' as const, title, message, duration };
  },
  info: (title: string, message?: string, duration?: number) => {
    return { type: 'info' as const, title, message, duration };
  },
};
