// Supabase OAuth Service - Direct Integration
import { supabase } from './supabase';
import { Provider } from '@supabase/supabase-js';

// Sign in with OAuth provider
export const signInWithOAuth = async (provider: Provider) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('OAuth sign in error:', error);
    return { success: false, error: error.message || 'OAuth sign in failed' };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message || 'Sign out failed' };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { success: true, user };
  } catch (error) {
    console.error('Get current user error:', error);
    return { success: false, error: error.message || 'Failed to get current user' };
  }
};

// Handle OAuth callback
export const handleOAuthCallback = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (data.session?.user) {
      // Extract profile image from Google OAuth provider
      const userMetadata = data.session.user.user_metadata || {};
      const appMetadata = data.session.user.app_metadata || {};
      
      // Get profile image from Google
      let profileImage = userMetadata.picture || userMetadata.avatar_url;
      
      // Check if user exists in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // User doesn't exist in profiles, create one with Google profile image
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || 'User',
            role: 'user',
            joinedDate: new Date().toISOString(),
            avatar: profileImage,
            provider: appMetadata.provider,
            oauth_provider: appMetadata.provider,
            is_oauth_user: true,
            verified: data.session.user.email_confirmed_at ? true : false
          }]);
        
        if (insertError) throw insertError;
      } else if (profile) {
        // User exists, update their profile image from Google OAuth
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar: profileImage,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.session.user.id);
        
        if (updateError) throw updateError;
      }
      
      return { success: true, user: data.session.user, profileImage };
    }
    
    return { success: false, error: 'No session found' };
  } catch (error) {
    console.error('OAuth callback error:', error);
    return { success: false, error: error.message || 'OAuth callback failed' };
  }
};

// OAuth providers configuration
export const OAUTH_PROVIDERS = {
  google: {
    name: 'Google',
    icon: 'https://developers.google.com/identity/images/g-logo.png',
    color: '#4285f4',
    provider: 'google' as Provider
  }
};

// Get available OAuth providers
export const getAvailableOAuthProviders = () => {
  return Object.entries(OAUTH_PROVIDERS).map(([key, provider]) => ({
    key,
    name: provider.name,
    icon: provider.icon,
    color: provider.color,
    provider: provider.provider,
    configured: true // Since you already enabled Google in Supabase
  }));
};
