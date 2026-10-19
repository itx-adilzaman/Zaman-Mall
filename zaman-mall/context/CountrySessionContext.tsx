import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CountrySession = 'pakistan' | 'china';

interface CountrySessionContextType {
  currentSession: CountrySession;
  setSession: (session: CountrySession) => void;
  toggleSession: () => void;
}

const CountrySessionContext = createContext<CountrySessionContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'countrySession';

export const CountrySessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<CountrySession>(() => {
    // Default to pakistan
    return 'pakistan';
  });

  // Load session from AsyncStorage on mount
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const saved = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (saved === 'china' || saved === 'pakistan') {
        setCurrentSession(saved);
      }
    } catch (error) {
      console.error('Failed to load country session:', error);
    }
  };

  const setSession = (session: CountrySession) => {
    // Synchronous — UI highlights instantly
    setCurrentSession(session);
    // Persist in background
    AsyncStorage.setItem(SESSION_STORAGE_KEY, session).catch((error) => {
      console.error('Failed to save country session:', error);
    });
  };

  const toggleSession = () => {
    const newSession = currentSession === 'pakistan' ? 'china' : 'pakistan';
    setSession(newSession);
  };

  return (
    <CountrySessionContext.Provider value={{ currentSession, setSession, toggleSession }}>
      {children}
    </CountrySessionContext.Provider>
  );
};

export const useCountrySession = () => {
  const context = useContext(CountrySessionContext);
  if (context === undefined) {
    throw new Error('useCountrySession must be used within a CountrySessionProvider');
  }
  return context;
};
