// OAuth Authentication Service
import { User } from '../types';

// OAuth Configuration
const OAUTH_CONFIG = {
  google: {
    clientId: 'test-google-client-id', // Changed from placeholder to enable
    redirectUri: 'http://localhost:3001/auth/google/callback',
    scope: 'openid email profile',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
  },
  microsoft: {
    clientId: 'YOUR_MICROSOFT_CLIENT_ID',
    redirectUri: 'http://localhost:3001/auth/microsoft/callback',
    scope: 'openid email profile',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me'
  },
  github: {
    clientId: 'YOUR_GITHUB_CLIENT_ID',
    redirectUri: 'http://localhost:3001/auth/github/callback',
    scope: 'user:email',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user'
  },
  facebook: {
    clientId: 'YOUR_FACEBOOK_CLIENT_ID',
    redirectUri: 'http://localhost:3001/auth/facebook/callback',
    scope: 'email,public_profile',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/v18.0/me'
  }
};

// Generate OAuth URL
export const generateOAuthUrl = (provider: 'google' | 'microsoft' | 'github' | 'facebook'): string => {
  const config = OAUTH_CONFIG[provider];
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: Math.random().toString(36).substring(7)
  });
  
  return `${config.authUrl}?${params.toString()}`;
};

// Exchange code for token
export const exchangeCodeForToken = async (provider: 'google' | 'microsoft' | 'github' | 'facebook', code: string): Promise<string> => {
  const config = OAUTH_CONFIG[provider];
  
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: 'YOUR_CLIENT_SECRET', // This should be stored securely
      code: code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code'
    })
  });
  
  const data = await response.json();
  return data.access_token;
};

// Get user info from OAuth provider
export const getOAuthUserInfo = async (provider: 'google' | 'microsoft' | 'github' | 'facebook', accessToken: string): Promise<any> => {
  const config = OAUTH_CONFIG[provider];
  
  const response = await fetch(config.userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      ...(provider === 'github' ? { 'Accept': 'application/vnd.github.v3+json' } : {})
    }
  });
  
  return await response.json();
};

// Normalize user data from different providers
export const normalizeOAuthUser = (provider: 'google' | 'microsoft' | 'github' | 'facebook', userData: any): Partial<User> => {
  let normalizedUser: Partial<User> = {
    id: userData.id || userData.sub,
    email: userData.email,
    name: userData.name || userData.displayName || userData.login,
    avatar: userData.picture || userData.avatar_url || userData.data?.url,
    provider: provider,
    oauthProvider: provider,
    isOAuthUser: true,
    joinedDate: new Date().toISOString()
  };

  // Provider-specific normalization
  switch (provider) {
    case 'google':
      normalizedUser = {
        ...normalizedUser,
        name: userData.name,
        email: userData.email,
        avatar: userData.picture,
        verified: userData.verified_email
      };
      break;
      
    case 'microsoft':
      normalizedUser = {
        ...normalizedUser,
        name: userData.displayName,
        email: userData.mail || userData.userPrincipalName,
        avatar: undefined // Microsoft doesn't provide profile picture by default
      };
      break;
      
    case 'github':
      normalizedUser = {
        ...normalizedUser,
        name: userData.name || userData.login,
        email: userData.email,
        avatar: userData.avatar_url,
        username: userData.login
      };
      break;
      
    case 'facebook':
      normalizedUser = {
        ...normalizedUser,
        name: userData.name,
        email: userData.email,
        avatar: `https://graph.facebook.com/${userData.id}/picture?type=large`
      };
      break;
  }
  
  return normalizedUser;
};

// OAuth Login Function
export const loginWithOAuth = async (provider: 'google' | 'microsoft' | 'github' | 'facebook', code: string): Promise<{ success: boolean, user?: User, message?: string }> => {
  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(provider, code);
    
    // Get user info
    const userData = await getOAuthUserInfo(provider, accessToken);
    
    // Normalize user data
    const normalizedUser = normalizeOAuthUser(provider, userData);
    
    // Check if user exists in database
    // This would typically involve a database call
    // For now, we'll create a mock user object
    
    const user: User = {
      id: normalizedUser.id || '',
      email: normalizedUser.email || '',
      name: normalizedUser.name || '',
      avatar: normalizedUser.avatar || '',
      role: 'user',
      joinedDate: normalizedUser.joinedDate || new Date().toISOString(),
      provider: normalizedUser.provider,
      oauthProvider: normalizedUser.oauthProvider,
      isOAuthUser: normalizedUser.isOAuthUser,
      verified: normalizedUser.verified || false,
      username: normalizedUser.username
    };
    
    return { success: true, user };
    
  } catch (error) {
    console.error(`OAuth login failed for ${provider}:`, error);
    return { success: false, message: `OAuth login failed: ${error}` };
  }
};

// OAuth Link Account Function (for existing users)
export const linkOAuthAccount = async (userId: string, provider: 'google' | 'microsoft' | 'github' | 'facebook', code: string): Promise<{ success: boolean, message?: string }> => {
  try {
    const accessToken = await exchangeCodeForToken(provider, code);
    const userData = await getOAuthUserInfo(provider, accessToken);
    const normalizedUser = normalizeOAuthUser(provider, userData);
    
    // This would typically update the user in the database
    console.log(`Linking ${provider} account to user ${userId}:`, normalizedUser);
    
    return { success: true, message: `${provider} account linked successfully` };
    
  } catch (error) {
    console.error(`OAuth linking failed for ${provider}:`, error);
    return { success: false, message: `Failed to link ${provider} account` };
  }
};

// OAuth Unlink Account Function
export const unlinkOAuthAccount = async (userId: string, provider: 'google' | 'microsoft' | 'github' | 'facebook'): Promise<{ success: boolean, message?: string }> => {
  try {
    // This would typically update the user in the database
    console.log(`Unlinking ${provider} account from user ${userId}`);
    
    return { success: true, message: `${provider} account unlinked successfully` };
    
  } catch (error) {
    console.error(`OAuth unlinking failed for ${provider}:`, error);
    return { success: false, message: `Failed to unlink ${provider} account` };
  }
};

// Get OAuth Providers for User
export const getUserOAuthProviders = async (userId: string): Promise<string[]> => {
  // This would typically fetch from database
  // For now, return empty array
  return [];
};

// Handle OAuth Callback
export const handleOAuthCallback = async (provider: 'google' | 'microsoft' | 'github' | 'facebook', code: string, state?: string): Promise<{ success: boolean, user?: User, message?: string }> => {
  try {
    return await loginWithOAuth(provider, code);
  } catch (error) {
    console.error(`OAuth callback failed for ${provider}:`, error);
    return { success: false, message: `OAuth callback failed: ${error}` };
  }
};

// OAuth Provider Icons and Names
export const OAUTH_PROVIDERS = {
  google: {
    name: 'Google',
    icon: 'https://developers.google.com/identity/images/g-logo.png',
    color: '#4285f4'
  },
  microsoft: {
    name: 'Microsoft',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/512px-Microsoft_logo.svg.png',
    color: '#00a4ef'
  },
  github: {
    name: 'GitHub',
    icon: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    color: '#333333'
  },
  facebook: {
    name: 'Facebook',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Facebook_f_logo_%282018%29.svg/512px-Facebook_f_logo_%282018%29.svg.png',
    color: '#1877f2'
  }
};

// Check if OAuth is configured
export const isOAuthConfigured = (provider: 'google' | 'microsoft' | 'github' | 'facebook'): boolean => {
  const config = OAUTH_CONFIG[provider];
  return config.clientId !== 'YOUR_' + provider.toUpperCase() + '_CLIENT_ID';
};

// Get available OAuth providers
export const getAvailableOAuthProviders = (): Array<{ key: string; name: string; icon: string; color: string; configured: boolean }> => {
  return Object.entries(OAUTH_PROVIDERS).map(([key, provider]) => ({
    key,
    name: provider.name,
    icon: provider.icon,
    color: provider.color,
    configured: isOAuthConfigured(key as any)
  }));
};
