import React, { useState } from 'react';
import { supabase } from '../services/supabase';

// Simple hook for signup with cooldown
export const useSignupWithCooldown = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const signup = async (email: string, password: string, name?: string) => {
    // Check cooldown
    if (cooldownRemaining > 0) {
      setError(`Please wait ${cooldownRemaining} seconds before trying again.`);
      return { success: false };
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: name ? { name } : undefined
        }
      });

      if (signupError) {
        // Handle rate limit and duplicate signup errors
        if (
          signupError.message?.includes('rate limit') ||
          signupError.message?.includes('too many requests') ||
          signupError.message?.includes('email already been registered') ||
          signupError.status === 429
        ) {
          setError('Verification email already sent, please check your inbox.');
          startCooldown();
          return { success: false };
        }

        setError(signupError.message || 'Signup failed');
        return { success: false };
      }

      setSuccess('Account created! Please check your email to verify.');
      startCooldown();
      return { success: true, user: data.user };

    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const startCooldown = () => {
    setCooldownRemaining(60);
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return {
    isLoading,
    error,
    success,
    cooldownRemaining,
    signup,
    canSignup: cooldownRemaining === 0 && !isLoading
  };
};

// Minimal Component Example
export const MinimalSignupForm: React.FC = () => {
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
  } = useSignupWithCooldown();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup(email, password, name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Cooldown Timer */}
      {cooldownRemaining > 0 && (
        <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-center">
          ⏰ Wait {cooldownRemaining}s before trying again
        </div>
      )}

      {/* Form Fields */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)"
        className="w-full p-2 border rounded"
      />
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full p-2 border rounded"
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        minLength={6}
        className="w-full p-2 border rounded"
      />

      <button
        type="submit"
        disabled={!canSignup}
        className={`w-full p-2 rounded font-medium ${
          !canSignup
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Creating...' : cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Sign Up'}
      </button>
    </form>
  );
};
