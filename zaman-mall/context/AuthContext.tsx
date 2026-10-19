import { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type AuthContextType = {
  session: Session | null
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.log("Auth Session Error:", error.message);
        if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
          await supabase.auth.signOut();
        }
      }
      setSession(session)
      setUser(session?.user ?? null)
      checkAdmin(session?.user)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setIsAdmin(false)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
        checkAdmin(session?.user)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAdmin = async (user: User | null | undefined) => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    // Check profiles table for role
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    setIsAdmin(data?.role === 'admin')
  }

  const signInWithGoogle = async () => {
    // For Expo, we would typically use expo-auth-session here
    // But since deep linking setup is complex in this environment, 
    // we will implement the logic but it requires scheme configuration.
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'zaman-mall://auth/callback', // Requires scheme in app.json
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Google Sign In Error:', error)
      throw error
    }
  }

  const signInWithApple = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'zaman-mall://auth/callback',
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Apple Sign In Error:', error)
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isAdmin, signInWithGoogle, signInWithApple, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
