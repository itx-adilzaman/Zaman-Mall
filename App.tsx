
import React, { useEffect } from 'react';
// Fix: Use standard named imports for react-router-dom v6 routing components and hooks
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store/StoreContext';
import { AlertProvider } from './components/ProfessionalAlertSystem';
import { ProfileModalWrapper } from './components/ProfileModalWrapper';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { ProductDetail } from './pages/ProductDetail';
import { Favorites } from './pages/Favorites';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Profile } from './pages/Profile';
import { UserOrders } from './pages/UserOrders';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Addresses } from './pages/Addresses';
import { UserMessages } from './pages/UserMessages';
import { Zeels } from './pages/Zeels';
import { AffiliateBrands } from './pages/AffiliateBrands';
import { AffiliateProducts } from './pages/AffiliateProducts';
import { AffiliateProductDetail } from './pages/AffiliateProductDetail';
import { Loader2, Zap } from 'lucide-react';
import { handleOAuthCallback } from './services/supabaseOAuth';
import { supabase } from './services/supabase';
import { googleOAuth } from './services/customGoogleOAuth';
import { CountrySessionProvider } from './contexts/CountrySessionContext';

// Custom Google OAuth Callback Handler Component
const CustomOAuthCallback: React.FC = () => {
  const { setCurrentUser } = useStore();
  const location = useLocation();

  useEffect(() => {
    const handleCustomOAuthCallback = async () => {
      console.log('=== OAUTH CALLBACK START ===');
      console.log('Current URL:', window.location.href);
      console.log('Current Hash:', window.location.hash);
      console.log('Current Search:', window.location.search);
      
      try {
        // Check for authorization code
        const code = googleOAuth.extractAuthCode();
        
        console.log('Extracted Code:', code);
        
        if (!code) {
          console.log('No code found, checking if we need to redirect...');
          
          // If we're on hash router but no code, check if we need to handle redirect
          if (window.location.hash.includes('/auth/callback')) {
            console.log('On hash router callback, checking search params...');
            
            // Wait a moment for potential redirect
            setTimeout(() => {
              const retryCode = googleOAuth.extractAuthCode();
              console.log('Retry Code after timeout:', retryCode);
              if (!retryCode) {
                console.error('No authorization code found after redirect');
                alert('No authorization code found. Please try login again.');
                window.location.hash = '/login';
              }
            }, 2000);
            return;
          }
          
          console.error('No authorization code found');
          alert('No authorization code found. Please try login again.');
          window.location.hash = '/login';
          return;
        }
        
        console.log('Authorization code found, trying direct login...');
        
        // Try simple direct login first
        const { user, tokens } = await googleOAuth.directGoogleLogin(code);
        
        console.log('=== SIMPLE LOGIN DEBUG ===');
        console.log('Google User:', user);
        console.log('User Email:', user.email);
        console.log('User Name:', user.name);
        console.log('User Picture:', user.picture);
        
        // Create simple user data for context
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: '',
          address: '',
          bio: '',
          profilePic: user.picture,
          joinedDate: new Date().toISOString(),
          role: 'user' as const
        };
        
        console.log('Simple User Data:', userData);
        console.log('Calling setCurrentUser with simple data...');
        
        // Add delay to ensure context update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setCurrentUser(userData);
        
        // Add another delay to verify user is set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Simple setCurrentUser called successfully');
        
        // Show success message
        alert(`Welcome ${user.name}! Login successful.`);
        
        // Clear OAuth parameters
        googleOAuth.clearOAuthParams();
        
        // Redirect to home page
        console.log('Redirecting to home page...');
        window.location.hash = '/';
        
      } catch (error) {
        console.error('=== OAUTH CALLBACK ERROR ===');
        console.error('Custom OAuth callback error:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        alert(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Clear OAuth parameters
        googleOAuth.clearOAuthParams();
        
        // Redirect to login page
        window.location.hash = '/login';
      }
    };

    console.log('OAuth Callback Component Mounted');
    handleCustomOAuthCallback();
  }, [setCurrentUser, location]);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] border border-blue-500/20 flex items-center justify-center animate-pulse">
          <Zap size={32} className="text-blue-500 fill-blue-500/20 animate-float" />
        </div>
        <Loader2 className="absolute -inset-2 w-24 h-24 text-blue-400 animate-spin opacity-20" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Google Authentication</p>
        <p className="text-sm font-medium text-gray-500">Completing sign in...</p>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { currentUser, isAuthLoading, isDbLoading } = useStore();
  const location = useLocation();

  // If we already have a user, don't show the full-screen loader, just let them in.
  // The data will finish loading in the background.
  if (!currentUser && (isAuthLoading || isDbLoading)) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] border border-blue-500/20 flex items-center justify-center animate-pulse">
            <Zap size={32} className="text-blue-500 fill-blue-500/20 animate-float" />
          </div>
          <Loader2 className="absolute -inset-2 w-24 h-24 text-blue-400 animate-spin opacity-20" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Security Checkpoint</p>
          <p className="text-sm font-medium text-gray-500">Synchronizing Identity Protocol...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <CountrySessionProvider>
      <StoreProvider>
        <AlertProvider>
          <HashRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/zeels" element={<Zeels />} />
                <Route path="/affiliate-brands" element={<AffiliateBrands />} />
                <Route path="/affiliate-products" element={<AffiliateProducts />} />
              <Route path="/affiliate-product/:id" element={<AffiliateProductDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/favorites" element={<Favorites />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order-confirmed" element={<OrderConfirmation />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <UserOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/addresses"
                element={
                  <ProtectedRoute>
                    <Addresses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <UserMessages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auth/callback"
                element={<CustomOAuthCallback />}
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
          <ProfileModalWrapper />
        </HashRouter>
      </AlertProvider>
    </StoreProvider>
    </CountrySessionProvider>
  );
};

export default App;
