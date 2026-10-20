import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, ADMIN_EMAILS } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.role === 'admin' : false;

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const userObj: User = {
        id: userId,
        email: email,
        name: profile?.full_name || profile?.name || email.split('@')[0],
        role: ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : (profile?.role || 'user'),
        avatar: profile?.avatar_url || profile?.avatar || '',
        bio: profile?.bio || '',
        location: profile?.location || '',
        joinedDate: profile?.created_at || new Date().toISOString(),
        phone: profile?.phone || '',
      };
      setUser(userObj);
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;

      // Check if admin
      if (!ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
        await supabase.auth.signOut();
        return { success: false, message: 'Access denied. Admin accounts only.' };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Login failed.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
