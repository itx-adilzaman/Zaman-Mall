import React, { useState } from 'react';
import { signInWithOAuth, getAvailableOAuthProviders } from '../services/supabaseOAuth';

interface SupabaseOAuthButtonsProps {
  onOAuthLogin?: (provider: string) => void;
  className?: string;
}

const SupabaseOAuthButtons: React.FC<SupabaseOAuthButtonsProps> = ({ onOAuthLogin, className = '' }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);
  const providers = getAvailableOAuthProviders();

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
      {/* Animated Divider with Gradient */}
      <div className="relative group">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent group-hover:via-blue-500/60 transition-all duration-500"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-transparent bg-clip-text font-medium text-sm animate-gradient-flow group-hover:scale-110 transition-transform duration-300">
            Continue with
          </span>
        </div>
      </div>

      {/* OAuth Buttons Grid with Enhanced Animations */}
      <div className="grid grid-cols-2 gap-4">
        {providers.map((provider, index) => (
          <button
            key={provider.key}
            onClick={() => handleOAuthLogin(provider.provider, provider.key)}
            onMouseEnter={() => setHoveredProvider(provider.key)}
            onMouseLeave={() => setHoveredProvider(null)}
            disabled={loading === provider.key}
            className={`
              relative group overflow-hidden
              bg-gradient-to-br from-white via-gray-50 to-white
              border-2 border-gray-200/50 rounded-2xl
              px-4 py-4 flex items-center justify-center
              text-sm font-semibold text-gray-700
              transition-all duration-500 ease-out
              hover:shadow-2xl hover:scale-105 hover:-translate-y-2
              active:scale-95 active:translate-y-0
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:scale-100 disabled:hover:translate-y-0
              ${loading === provider.key ? 'animate-pulse' : ''}
              animate-fade-in-up
            `}
            style={{
              animationDelay: `${index * 100}ms`,
              boxShadow: hoveredProvider === provider.key ? `0 20px 40px -10px ${provider.color}40` : '',
              borderColor: hoveredProvider === provider.key ? provider.color : '',
              background: hoveredProvider === provider.key 
                ? `linear-gradient(135deg, ${provider.color}08 0%, ${provider.color}04 50%, transparent 100%)`
                : ''
            }}
          >
            {/* Animated Background Gradient */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700"
              style={{
                background: `linear-gradient(135deg, ${provider.color}15 0%, ${provider.color}08 50%, transparent 100%)`,
                transform: hoveredProvider === provider.key ? 'scale(1.05)' : 'scale(1)'
              }}
            />
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
              <div 
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500"
                style={{
                  background: `linear-gradient(90deg, transparent, ${provider.color}20, transparent)`
                }}
              />
            </div>

            {/* Loading Spinner */}
            {loading === provider.key && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-2xl">
                <div 
                  className="animate-spin rounded-full h-6 w-6 border-2 border-transparent"
                  style={{
                    borderTopColor: provider.color,
                    borderBottomColor: provider.color
                  }}
                />
              </div>
            )}
            
            {/* Button Content */}
            <div className="relative flex items-center space-x-3 z-10">
              {/* Provider Icon with Glow */}
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-all duration-500"
                  style={{ backgroundColor: provider.color }}
                />
                <img
                  src={provider.icon}
                  alt={provider.name}
                  className={`
                    w-6 h-6 transition-all duration-500 relative z-10
                    ${hoveredProvider === provider.key ? 'scale-125 rotate-12 drop-shadow-lg' : ''}
                  `}
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" fill="${provider.color}"/>
                        <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-family="Arial" font-weight="bold">
                          ${provider.name.charAt(0)}
                        </text>
                      </svg>
                    `)}`;
                  }}
                />
              </div>
              
              {/* Provider Name with Gradient */}
              <span className={`
                font-bold transition-all duration-500
                ${hoveredProvider === provider.key ? 'text-transparent bg-clip-text' : 'text-gray-700'}
              `}
              style={{
                backgroundImage: hoveredProvider === provider.key 
                  ? `linear-gradient(135deg, ${provider.color}, ${provider.color}dd)`
                  : '',
                fontSize: hoveredProvider === provider.key ? '15px' : '14px'
              }}
              >
                {provider.name}
              </span>
            </div>

            {/* Hover Border Animation */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `linear-gradient(45deg, ${provider.color}40, ${provider.color}20, ${provider.color}40)`,
                backgroundSize: '200% 200%',
                animation: hoveredProvider === provider.key ? 'gradient-border 2s linear infinite' : ''
              }}
            />
          </button>
        ))}
      </div>

      {/* Enhanced Footer with Animation */}
      <div className="flex flex-col space-y-3 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        {/* Security Badge */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 group">
          <div className="relative">
            <svg className="w-4 h-4 transition-all duration-300 group-hover:text-green-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <span className="transition-colors duration-300 group-hover:text-gray-600">Secure single sign-on</span>
        </div>
        
        {/* Terms and Privacy */}
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          By continuing, you agree to our{' '}
          <a href="#" className="text-blue-500 hover:text-blue-600 hover:underline transition-all duration-200 hover:text-blue-400">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-blue-500 hover:text-blue-600 hover:underline transition-all duration-200 hover:text-blue-400">Privacy Policy</a>
        </p>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes gradient-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes fade-in-up {
          0% { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-gradient-flow {
          background-size: 200% 200%;
          animation: gradient-flow 3s ease infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
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

export default SupabaseOAuthButtons;
