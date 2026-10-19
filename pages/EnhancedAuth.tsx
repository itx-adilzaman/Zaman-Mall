import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import AnimatedOAuthButtons from '../components/AnimatedOAuthButtons';

const EnhancedAuth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { login, register, loginWithOAuth, isAuthLoading } = useStore();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!isLogin && !formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setErrors({ general: result.message || 'Login failed' });
        }
      } else {
        const result = await register(formData.name, formData.email, formData.password);
        if (!result.success) {
          setErrors({ general: result.message || 'Registration failed' });
        }
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    console.log(`OAuth login initiated with ${provider}`);
    // OAuth flow will be handled by the AnimatedOAuthButtons component
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">ZM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Zaman Mall</h1>
          <p className="text-gray-600">
            {isLogin ? 'Welcome back! Please sign in to your account' : 'Create your account to start shopping'}
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* OAuth Buttons */}
          <AnimatedOAuthButtons 
            onOAuthLogin={handleOAuthLogin}
            className="mb-6"
          />

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Register Only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`
                    w-full px-4 py-3 border rounded-lg
                    transition-all duration-200
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.name ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`
                  w-full px-4 py-3 border rounded-lg
                  transition-all duration-200
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.email ? 'border-red-500' : 'border-gray-300'}
                `}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`
                  w-full px-4 py-3 border rounded-lg
                  transition-all duration-200
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.password ? 'border-red-500' : 'border-gray-300'}
                `}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthLoading}
              className={`
                w-full py-3 px-4 rounded-lg font-medium
                transition-all duration-200
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isAuthLoading
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
                }
              `}
            >
              {isAuthLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2026 Zaman Mall. All rights reserved.
          </p>
          <div className="mt-2 space-x-4">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Terms of Service</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAuth;
