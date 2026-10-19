import React, { useState } from 'react';
import { signInWithOAuth } from '../services/supabaseOAuth';

interface NeonOAuthButtonsProps {
  onOAuthLogin?: (provider: string) => void;
  className?: string;
}

const NeonOAuthButtons: React.FC<NeonOAuthButtonsProps> = ({ onOAuthLogin, className = '' }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);

  // Neon providers configuration with only Google
  const neonProviders = [
    {
      key: 'google',
      name: 'Google',
      neonIcon: 'G',
      color: '#4285f4',
      neonGlow: 'rgba(66, 133, 244, 0.8)',
      bgGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a3e 50%, #0a0a0a 100%)',
      borderGradient: 'linear-gradient(45deg, #4285f4, #1967d2, #4285f4)',
      provider: 'google' as const
    }
  ];

  const handleOAuthLogin = async (provider: string, providerKey: string) => {
    setLoading(providerKey);
    
    try {
      const result = await signInWithOAuth(provider as any);
      
      if (result.success) {
        onOAuthLogin?.(providerKey);
        console.log(`OAuth login initiated with ${providerKey}`);
      } else {
        console.error('OAuth login failed:', result.error);
      }
    } catch (error) {
      console.error('OAuth login error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Neon Divider with Animated Text */}
      <div className="relative group">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent group-hover:via-cyan-500/80 transition-all duration-500"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-6 font-bold text-sm uppercase tracking-wider transition-all duration-300 group-hover:scale-110 group-hover:text-cyan-400" 
                style={{
                  textShadow: hoveredProvider ? '0 0 20px rgba(6, 182, 212, 0.8)' : '0 0 10px rgba(6, 182, 212, 0.5)',
                  color: hoveredProvider ? '#06b6d4' : '#0891b2'
                }}>
            Continue with
          </span>
        </div>
      </div>

      {/* Neon OAuth Buttons Grid - Extra Small Size */}
      <div className="grid grid-cols-2 gap-4">
        {neonProviders.map((provider, index) => (
          <button
            key={provider.key}
            onClick={() => handleOAuthLogin(provider.provider, provider.key)}
            onMouseEnter={() => setHoveredProvider(provider.key)}
            onMouseLeave={() => setHoveredProvider(null)}
            disabled={loading === provider.key}
            className={`
              relative group overflow-hidden
              rounded-lg px-2 py-2 flex items-center justify-center
              font-medium text-xs uppercase tracking-normal
              transition-all duration-500 ease-out
              hover:scale-105 hover:-translate-y-0.5
              active:scale-95 active:translate-y-0
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:scale-100 disabled:hover:translate-y-0
              animate-fade-in-up
            `}
            style={{
              animationDelay: `${index * 100}ms`,
              background: provider.bgGradient,
              border: `1px solid ${provider.color}`,
              boxShadow: hoveredProvider === provider.key 
                ? `0 0 15px ${provider.neonGlow}, 0 0 30px ${provider.neonGlow}, inset 0 0 10px ${provider.neonGlow}20`
                : `0 0 6px ${provider.neonGlow}40, inset 0 0 6px ${provider.neonGlow}10`,
              transform: hoveredProvider === provider.key ? 'translateY(-2px)' : 'translateY(0)'
            }}
          >
            {/* Neon Border Animation */}
            <div 
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: provider.borderGradient,
                backgroundSize: '200% 200%',
                animation: hoveredProvider === provider.key ? 'neon-border 2s linear infinite' : '',
                filter: 'blur(1px)'
              }}
            />
            
            {/* Inner Glow Effect */}
            <div 
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${provider.neonGlow}20 0%, transparent 70%)`,
                transform: hoveredProvider === provider.key ? 'scale(1.1)' : 'scale(1)'
              }}
            />

            {/* Loading Spinner */}
            {loading === provider.key && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg">
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-2 border-transparent"
                  style={{
                    borderTopColor: provider.color,
                    borderBottomColor: provider.color,
                    boxShadow: `0 0 12px ${provider.neonGlow}`
                  }}
                />
              </div>
            )}
            
            {/* Neon Icon and Text */}
            <div className="relative flex items-center space-x-1.5 z-10">
              {/* Extra Small Neon Icon */}
              <div className="relative">
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${provider.color}, ${provider.color}dd)`,
                    color: '#ffffff',
                    boxShadow: hoveredProvider === provider.key 
                      ? `0 0 12px ${provider.neonGlow}, 0 0 24px ${provider.neonGlow}`
                      : `0 0 6px ${provider.neonGlow}60`,
                    transform: hoveredProvider === provider.key ? 'scale(1.1) rotate(2deg)' : 'scale(1) rotate(0deg)',
                    textShadow: `0 0 6px ${provider.neonGlow}`,
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {provider.key === 'google' && 'G'}
                  {provider.key === 'github' && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.09-.65.35-1.09.63-1.34 2.22-.25 4.8-1.09 4.8-4.82 0-1.08-.38-1.96-1.02-2.65-.1-.25-.45-1.29.1-2.64 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 2.05.08 2.65-.64.69-1.02 1.57-1.02 2.65 0 3.74 2.58 4.57 4.83 4.58.14.01.28.01.42.01 3.44 0 6.28-2.86 6.28-6.38 0-.97-.25-1.88-.69-2.66z"/>
                    </svg>
                  )}
                  {provider.key === 'facebook' && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625H5.069v-2.326h3.679V7.35c0-1.921 1.176-2.984 2.896-2.984.866 0 1.77.155 1.77.155v2.326h-.996c-.783 0-1.493.48-1.493 1.49v1.826h2.984l-.479 2.326h-2.505V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                    </svg>
                  )}
                  {provider.key === 'microsoft' && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M7.5 7.5H0V0h7.5v7.5zM16 0H8.5v7.5H16V0zM7.5 8.5H0V16h7.5V8.5zM16 8.5H8.5V16H16V8.5z"/>
                    </svg>
                  )}
                </div>
                
                {/* Icon Glow Ring */}
                {hoveredProvider === provider.key && (
                  <div 
                    className="absolute inset-0 rounded-md animate-pulse"
                    style={{
                      background: `linear-gradient(45deg, ${provider.neonGlow}, ${provider.color})`,
                      filter: 'blur(4px)',
                      transform: 'scale(1.15)'
                    }}
                  />
                )}
              </div>
              
              {/* Provider Name with Neon Effect */}
              <span 
                className="font-medium transition-all duration-500"
                style={{
                  color: hoveredProvider === provider.key ? provider.color : '#ffffff',
                  textShadow: hoveredProvider === provider.key 
                    ? `0 0 8px ${provider.neonGlow}, 0 0 16px ${provider.neonGlow}`
                    : `0 0 3px ${provider.neonGlow}40`,
                  fontSize: hoveredProvider === provider.key ? '11px' : '10px',
                  letterSpacing: hoveredProvider === provider.key ? '0.25px' : '0.1px'
                }}
              >
                {provider.name}
              </span>
            </div>

            {/* Scanning Line Effect */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none overflow-hidden">
              <div 
                className="absolute inset-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500"
                style={{
                  background: `linear-gradient(90deg, transparent, ${provider.neonGlow}, transparent)`,
                  filter: 'blur(1px)'
                }}
              />
            </div>

            {/* Minimal Particle Effects */}
            {hoveredProvider === provider.key && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-0.5 rounded-full animate-pulse"
                    style={{
                      backgroundColor: provider.color,
                      left: `${30 + (i * 20)}%`,
                      top: `${20 + (i * 25)}%`,
                      boxShadow: `0 0 3px ${provider.neonGlow}`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Enhanced Footer with Neon Effects */}
      <div className="flex flex-col space-y-3 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        {/* Security Badge with Neon */}
        <div className="flex items-center justify-center space-x-2 text-xs group">
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
            <div 
              className="absolute inset-0 rounded-full animate-ping"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }}
            />
          </div>
          <span 
            className="transition-all duration-300 group-hover:text-green-400 uppercase tracking-wider"
            style={{
              textShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
            }}
          >
            Secure Neon Authentication
          </span>
        </div>
        
        {/* Terms and Privacy */}
        <p className="text-xs text-center leading-relaxed text-gray-400">
          By continuing, you agree to our{' '}
          <a href="#" 
             className="text-cyan-400 hover:text-cyan-300 transition-all duration-200 uppercase tracking-wider"
             style={{ textShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}
          >
            Terms
          </a>
          {' '}and{' '}
          <a href="#" 
             className="text-cyan-400 hover:text-cyan-300 transition-all duration-200 uppercase tracking-wider"
             style={{ textShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}
          >
            Privacy
          </a>
        </p>
      </div>

      {/* Custom Neon Styles */}
      <style>{`
        @keyframes neon-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes fade-in-up {
          0% { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in-up:nth-child(1) { animation-delay: 0.1s; }
        .animate-fade-in-up:nth-child(2) { animation-delay: 0.2s; }
        .animate-fade-in-up:nth-child(3) { animation-delay: 0.3s; }
        .animate-fade-in-up:nth-child(4) { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
};

export default NeonOAuthButtons;
