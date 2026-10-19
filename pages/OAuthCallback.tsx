// OAuth Callback Handler Page
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get session after OAuth callback
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('OAuth callback error:', error);
          navigate('/login?error=oauth_failed');
          return;
        }
        
        if (session?.user) {
          // User successfully authenticated
          console.log('OAuth successful:', session.user);
          navigate('/dashboard?login=success');
        } else {
          // No session found
          navigate('/login?error=no_session');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
