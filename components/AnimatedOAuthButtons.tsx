import React, { useState } from 'react';

import { supabase } from '../services/supabase';

import { getAvailableOAuthProviders } from '../services/oauthService';

import { googleOAuth } from '../services/customGoogleOAuth';



interface AnimatedOAuthButtonsProps {

  onOAuthLogin?: (provider: string) => void;

  className?: string;

}



const AnimatedOAuthButtons: React.FC<AnimatedOAuthButtonsProps> = ({ onOAuthLogin, className = '' }) => {

  const [loading, setLoading] = useState<string | null>(null);

  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);

  const availableProviders = getAvailableOAuthProviders();



  const handleOAuthLogin = async (provider: string) => {

    // Show coming soon alert

    alert('Google Auth is coming soon! Please use email/password login for now.');

  };



  const configuredProviders = availableProviders.filter(p => p.configured && p.key === 'google');



  if (configuredProviders.length === 0) {

    return (

      <div className={`text-center ${className}`}>

        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">

          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">

            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />

          </svg>

        </div>

        <p className="text-gray-500 text-sm">OAuth providers not configured</p>

        <p className="text-gray-400 text-xs mt-1">Please configure OAuth settings to enable social login</p>

      </div>

    );

  }



  return (

    <div className={`flex flex-col items-center space-y-4 ${className}`}>

      {/* Enhanced Animated Divider */}

      <div className="relative w-full max-w-md">

        <div className="absolute inset-0 flex items-center">

          <div className="w-full border-t border-gray-400" />

        </div>

        <div className="relative flex justify-center text-sm">

          {/* Neon glow background */}

          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-lg animate-pulse"></div>

          

          {/* Rotating neon ring */}

          <div className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-60 animate-spin" style={{ animationDuration: '6s' }}></div>

          

          {/* Pulsing neon wave */}

          <div className="absolute inset-0 rounded-full border border-purple-400 opacity-40 animate-ping" style={{ animationDuration: '3s' }}></div>

          

          {/* Floating neon particles */}

          <div className="absolute inset-0 rounded-full">

            {[...Array(6)].map((_, i) => (

              <div

                key={i}

                className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"

                style={{

                  left: `${15 + i * 12}%`,

                  top: `${25 + (i % 2) * 50}%`,

                  animationDelay: `${i * 0.3}s`,

                  boxShadow: '0 0 8px rgba(66, 133, 244, 0.8)'

                }}

              />

            ))}

          </div>

          

          <div className="relative px-6 py-2 bg-gray-800 border-2 border-gray-600 rounded-full shadow-2xl">

            {/* Neon gradient text */}

            <span className="font-semibold text-base bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse drop-shadow-lg">

              Google Auth (Coming Soon)

            </span>

          </div>

        </div>

      </div>



      {/* Animated Google OAuth Button */}

      <div className="flex flex-col items-center w-full max-w-sm">

        {configuredProviders.map((provider) => (

          <button

            key={provider.key}

            onClick={() => handleOAuthLogin(provider.key)}

            onMouseEnter={() => setHoveredProvider(provider.key)}

            onMouseLeave={() => setHoveredProvider(null)}

            disabled={loading === provider.key}

            className={`

              relative group w-full overflow-hidden

              bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600

              border-2 border-blue-400 rounded-full

              px-6 py-3 flex items-center justify-center

              text-base font-bold text-white

              transition-all duration-500 ease-out

              hover:border-blue-300 hover:shadow-[0_0_25px_rgba(66,133,244,0.8)]

              hover:shadow-blue-400/60 hover:scale-[1.02]

              hover:-translate-y-1 active:scale-95 active:translate-y-0

              disabled:opacity-50 disabled:cursor-not-allowed

              disabled:hover:scale-100 disabled:hover:translate-y-0

              ${loading === provider.key ? 'animate-pulse' : ''}

            `}

            style={{

              boxShadow: hoveredProvider === provider.key 

                ? '0 15px 30px -8px rgba(66, 133, 244, 0.6), 0 0 15px rgba(66, 133, 244, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 

                : '0 6px 10px -3px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',

              background: hoveredProvider === provider.key

                ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)'

                : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #3b82f6 100%)'

            }}

          >

            {/* Neon Background Animation */}

            <div 

              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"

              style={{

                background: `

                  radial-gradient(circle at 20% 80%, rgba(66, 133, 244, 0.3) 0%, transparent 50%),

                  radial-gradient(circle at 80% 20%, rgba(66, 133, 244, 0.2) 0%, transparent 50%),

                  linear-gradient(135deg, rgba(66, 133, 244, 0.1) 0%, transparent 100%)

                `

              }}

            />

            

            {/* Animated Neon Border */}

            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">

              <div className="absolute inset-0 rounded-2xl border-2 border-blue-400 animate-pulse"></div>

              <div className="absolute inset-0 rounded-2xl border border-blue-300 animate-ping" style={{ animationDuration: '2s' }}></div>

            </div>

            

            {/* Electric Shimmer Effect */}

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1200" style={{ animationDelay: '200ms' }}></div>

            </div>

            

            {/* Floating Particles */}

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">

              {[...Array(6)].map((_, i) => (

                <div

                  key={i}

                  className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"

                  style={{

                    left: `${15 + i * 15}%`,

                    top: `${20 + (i % 2) * 60}%`,

                    animationDelay: `${i * 100}ms`,

                    boxShadow: '0 0 6px rgba(66, 133, 244, 0.8)'

                  }}

                />

              ))}

            </div>

            

            {/* Loading Overlay */}

            {loading === provider.key && (

              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl">

                <div className="relative">

                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-white"></div>

                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent to-blue-400/30"></div>

                </div>

              </div>

            )}

            

            {/* Button Content */}

            <div className="relative flex items-center space-x-4">

              {/* Enhanced Google Logo */}

              <div className="relative">

                <div className="absolute inset-0 rounded-full bg-white/20 p-1 transition-all duration-300 group-hover:scale-110">

                  <div className="w-full h-full rounded-full bg-white/30 flex items-center justify-center">

                    {/* Official Google Logo */}

                    <svg className="w-5 h-5" viewBox="0 0 24 24">

                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>

                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>

                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>

                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>

                    </svg>

                  </div>

                </div>

                

                {/* Enhanced Icon Glow Effect */}

                {hoveredProvider === provider.key && (

                  <>

                    <div 

                      className="absolute inset-0 rounded-full blur-lg opacity-80"

                      style={{ 

                        backgroundColor: '#ffffff',

                        boxShadow: '0 0 25px rgba(255, 255, 255, 0.8)'

                      }}

                    />

                  </>

                )}

              </div>

              

              {/* Enhanced Provider Name */}

              <span className={`

                font-bold text-base transition-all duration-300

                ${hoveredProvider === provider.key ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-white/90'}

              `}>

                {provider.name} (Coming Soon)

              </span>

            </div>

            

            {/* Enhanced Electric Hover Effect */}

            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">

              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-blue-400/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1200" style={{ animationDelay: '100ms' }}></div>

            </div>

            

            {/* Floating Particles Animation */}

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">

              {[...Array(8)].map((_, i) => (

                <div

                  key={i}

                  className="absolute w-1 h-1 bg-blue-400 rounded-full"

                  style={{

                    left: `${10 + i * 11}%`,

                    top: `${15 + (i % 3) * 35}%`,

                    animation: `float ${2 + i * 0.2}s ease-in-out infinite`,

                    animationDelay: `${i * 0.1}s`,

                    boxShadow: '0 0 8px rgba(66, 133, 244, 0.8)'

                  }}

                />

              ))}

            </div>

          </button>

        ))}

      </div>



      {/* Enhanced Neon Footer */}

      <div className="flex flex-col items-center space-y-3 text-center">

        <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-900/50 to-cyan-900/50 rounded-full border border-blue-400/30 backdrop-blur-sm">

          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">

            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />

          </svg>

          <span className="text-blue-300 font-medium text-sm">Google authentication coming soon</span>

        </div>

        

        <p className="text-xs text-gray-400">

          By continuing, you agree to our{' '}

          <a href="#" className="text-blue-400 hover:text-blue-300 font-medium underline">Terms</a>

          {' '}and{' '}

          <a href="#" className="text-blue-400 hover:text-blue-300 font-medium underline">Privacy</a>

        </p>

      </div>

      

      {/* CSS Animations */}

      <style>{`

        @keyframes float {

          0%, 100% { transform: translateY(0px) rotate(0deg); }

          25% { transform: translateY(-5px) rotate(90deg); }

          50% { transform: translateY(-10px) rotate(180deg); }

          75% { transform: translateY(-5px) rotate(270deg); }

        }

        @keyframes spin {

          from { transform: rotate(0deg); }

          to { transform: rotate(360deg); }

        }

      `}</style>

    </div>

  );

};



export default AnimatedOAuthButtons;

