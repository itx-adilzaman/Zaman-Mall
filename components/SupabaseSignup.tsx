import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface SignupState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  cooldownRemaining: number;
  lastSignupAttempt: number | null;
}

const COOLDOWN_DURATION = 60000; // 60 seconds in milliseconds

export const useSupabaseSignup = () => {
  const [state, setState] = useState<SignupState>({
    isLoading: false,
    error: null,
    success: null,
    cooldownRemaining: 0,
    lastSignupAttempt: null
  });

  // Check for existing cooldown on mount
  useEffect(() => {
    const lastAttempt = localStorage.getItem('lastSignupAttempt');
    if (lastAttempt) {
      const timeDiff = Date.now() - parseInt(lastAttempt);
      if (timeDiff < COOLDOWN_DURATION) {
        const remaining = Math.ceil((COOLDOWN_DURATION - timeDiff) / 1000);
        setState(prev => ({
          ...prev,
          lastSignupAttempt: parseInt(lastAttempt),
          cooldownRemaining: remaining
        }));
      }
    }
  }, []);

  // Update cooldown timer
  useEffect(() => {
    if (state.cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          cooldownRemaining: prev.cooldownRemaining - 1
        }));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [state.cooldownRemaining]);

  const signup = async (email: string, password: string, name?: string) => {
    // Check cooldown first
    if (state.cooldownRemaining > 0) {
      setState(prev => ({
        ...prev,
        error: `Please wait ${state.cooldownRemaining} seconds before trying again.`
      }));
      return { success: false, message: `Please wait ${state.cooldownRemaining} seconds before trying again.` };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, success: null }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: name ? { name } : undefined
        }
      });

      if (error) {
        // Handle specific rate limit error
        if (error.message?.includes('rate limit') || 
            error.message?.includes('too many requests') ||
            error.message?.includes('email already been registered') ||
            error.status === 429) {
          
          setState(prev => ({
            ...prev,
            error: 'Verification email already sent, please check your inbox.',
            lastSignupAttempt: Date.now(),
            cooldownRemaining: 60
          }));

          // Store cooldown in localStorage
          localStorage.setItem('lastSignupAttempt', Date.now().toString());

          return { 
            success: false, 
            message: 'Verification email already sent, please check your inbox.' 
          };
        }

        // Handle other errors
        setState(prev => ({
          ...prev,
          error: error.message || 'Signup failed. Please try again.'
        }));
        return { success: false, message: error.message || 'Signup failed.' };
      }

      // Successful signup
      setState(prev => ({
        ...prev,
        success: 'Account created! Please check your email to verify your account.',
        lastSignupAttempt: Date.now(),
        cooldownRemaining: 60
      }));

      // Store cooldown in localStorage
      localStorage.setItem('lastSignupAttempt', Date.now().toString());

      return { 
        success: true, 
        message: 'Account created! Please check your email to verify your account.',
        user: data.user
      };

    } catch (err: any) {
      const errorMessage = err?.message || 'An unexpected error occurred.';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      return { success: false, message: errorMessage };
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const resetState = () => {
    setState({
      isLoading: false,
      error: null,
      success: null,
      cooldownRemaining: 0,
      lastSignupAttempt: null
    });
    localStorage.removeItem('lastSignupAttempt');
  };

  return {
    ...state,
    signup,
    resetState,
    canSignup: state.cooldownRemaining === 0 && !state.isLoading
  };
};

// React Component Example
export const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const {
    isLoading,
    error,
    success,
    cooldownRemaining,
    signup,
    canSignup
  } = useSupabaseSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSignup) return;
    
    const result = await signup(email, password, name);
    
    if (result.success) {
      // Clear form on successful signup
      setEmail('');
      setPassword('');
      setName('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
      
      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Cooldown Timer */}
      {cooldownRemaining > 0 && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <div className="flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Please wait {cooldownRemaining} seconds before trying again
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name (Optional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </div>
        
        <button
          type="submit"
          disabled={!canSignup || isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            !canSignup || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Account...
            </span>
          ) : cooldownRemaining > 0 ? (
            `Wait ${cooldownRemaining}s`
          ) : (
            'Create Account'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </div>
    </div>
  );
};
