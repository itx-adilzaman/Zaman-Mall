// Custom Google OAuth Service
import { supabase } from './supabase';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

class CustomGoogleOAuth {
  private config: GoogleOAuthConfig | null = null;
  private readonly GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private readonly GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

  // Initialize with your provided credentials
  constructor() {
    // Get current origin and ensure it's correct
    const currentOrigin = window.location.origin;
    const redirectUri = `${currentOrigin}/auth/callback`;
    
    // Auto-initialize with provided credentials
    this.initialize({
      clientId: '35472883858-hojafa8lvmla9l06lapam350esoktk7l.apps.googleusercontent.com',
      clientSecret: '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',
      redirectUri: redirectUri
    });
    
    // Log the exact redirect URI for debugging
    console.log('=== GOOGLE OAUTH DEBUG ===');
    console.log('Current Origin:', currentOrigin);
    console.log('Google OAuth Redirect URI:', redirectUri);
    console.log('Google OAuth Client ID:', '35472883858-hojafa8lvmla9l06lapam350esoktk7l.apps.googleusercontent.com');
    console.log('========================');
  }

  // Initialize OAuth configuration
  initialize(config: GoogleOAuthConfig) {
    this.config = config;
    console.log('Google OAuth initialized with client ID:', config.clientId);
  }

  // Check if OAuth is configured
  isConfigured(): boolean {
    return !!this.config;
  }

  // Get authorization URL
  getAuthorizationUrl(): string {
    if (!this.config) {
      throw new Error('Google OAuth not configured');
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `${this.GOOGLE_AUTH_URL}?${params.toString()}`;
    
    // Log for debugging
    console.log('Google OAuth Auth URL:', authUrl);
    console.log('Google OAuth Redirect URI being sent:', this.config.redirectUri);
    
    return authUrl;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
    if (!this.config) {
      throw new Error('Google OAuth not configured');
    }

    try {
      const response = await fetch(this.GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('Token exchange successful');
      return data;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  // Get user info from Google
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await fetch(this.GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`User info request failed: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('User info retrieved:', data.email);
      return data;
    } catch (error) {
      console.error('User info error:', error);
      throw error;
    }
  }

  // Simple direct login without Supabase complexity
  async directGoogleLogin(code: string): Promise<{ user: GoogleUserInfo; tokens: GoogleTokenResponse }> {
    try {
      console.log('=== DIRECT GOOGLE LOGIN ===');
      console.log('Starting direct OAuth flow...');
      
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForToken(code);
      console.log('Tokens received:', tokens.access_token ? 'Success' : 'Failed');
      
      // Get user info
      const user = await this.getUserInfo(tokens.access_token);
      console.log('User info received:', user.email);
      
      console.log('Direct Google login successful for:', user.email);
      
      return { user, tokens };
    } catch (error) {
      console.error('Direct Google login error:', error);
      throw error;
    }
  }
  async completeOAuthFlowWithSupabase(code: string): Promise<{ user: GoogleUserInfo; tokens: GoogleTokenResponse; supabaseUser: any }> {
    try {
      console.log('Starting OAuth flow completion with Supabase integration...');
      
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForToken(code);
      
      // Get user info
      const user = await this.getUserInfo(tokens.access_token);
      
      console.log('OAuth flow completed for:', user.email);
      
      // Create or update user in Supabase
      const supabaseUser = await this.createOrUpdateSupabaseUser(user, tokens);
      
      console.log('Supabase user created/updated:', supabaseUser);
      
      return { user, tokens, supabaseUser };
    } catch (error) {
      console.error('OAuth flow completion error:', error);
      throw error;
    }
  }

  // Create or update user in Supabase
  private async createOrUpdateSupabaseUser(googleUser: GoogleUserInfo, tokens: GoogleTokenResponse) {
    try {
      console.log('=== SUPABASE USER CREATION DEBUG ===');
      console.log('Google User:', googleUser);
      console.log('Google User ID:', googleUser.id);
      console.log('Google User Email:', googleUser.email);
      
      // Check if user exists in profiles table
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', googleUser.email)
        .single();

      console.log('Existing Profile Query Result:', { existingProfile, fetchError });

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing profile:', fetchError);
        throw fetchError;
      }

      const userProfile = {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        profilePic: googleUser.picture,
        role: 'user',
        joinedDate: new Date().toISOString(),
        provider: 'google',
        oauth_provider: 'google',
        is_oauth_user: true,
        verified: true,
        updated_at: new Date().toISOString()
      };

      console.log('User Profile to Create/Update:', userProfile);

      if (existingProfile) {
        // Update existing user
        console.log('Updating existing profile...');
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(userProfile)
          .eq('id', existingProfile.id)
          .select()
          .single();

        console.log('Update Result:', { updatedProfile, updateError });

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }

        console.log('Profile updated successfully');
        return updatedProfile;
      } else {
        // Create new user
        console.log('Creating new profile...');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([userProfile])
          .select()
          .single();

        console.log('Insert Result:', { newProfile, insertError });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }

        console.log('Profile created successfully');
        return newProfile;
      }
    } catch (error) {
      console.error('Error in createOrUpdateSupabaseUser:', error);
      throw error;
    }
  }

  // Initiate OAuth login
  initiateLogin() {
    if (!this.config) {
      throw new Error('Google OAuth not configured');
    }

    const authUrl = this.getAuthorizationUrl();
    console.log('Redirecting to Google OAuth:', authUrl);
    
    // Redirect to Google OAuth
    window.location.href = authUrl;
  }

  // Extract authorization code from URL
  extractAuthCode(): string | null {
    // First check search parameters (query string)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      console.log('Authorization code found in URL search params');
      return code;
    }
    
    // Also check hash for hash routing (fallback)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashCode = hashParams.get('code');
    
    if (hashCode) {
      console.log('Authorization code found in hash params');
      return hashCode;
    }
    
    console.log('No authorization code found');
    return null;
  }

  // Clear OAuth parameters from URL
  clearOAuthParams() {
    // Clear search params
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    
    // Update URL without OAuth params
    window.history.replaceState({}, document.title, url.toString());
    
    // Also clear hash if using hash routing
    if (window.location.hash.includes('code=')) {
      const hash = window.location.hash.split('?')[0];
      window.history.replaceState({}, document.title, hash);
    }
  }

  // Redirect to hash router after OAuth
  redirectToHashRouter() {
    // Redirect to hash router with callback
    window.location.href = `${window.location.origin}/#/auth/callback${window.location.search}`;
  }
}

// Export singleton instance with auto-initialization
export const googleOAuth = new CustomGoogleOAuth();
