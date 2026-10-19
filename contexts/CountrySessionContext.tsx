import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type CountrySession = 'pakistan' | 'china';

interface CountrySessionContextType {
  currentSession: CountrySession;
  setSession: (session: CountrySession) => void;
  toggleSession: () => void;
}

const CountrySessionContext = createContext<CountrySessionContextType | undefined>(undefined);

export const CountrySessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<CountrySession>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('countrySession');
    return (saved === 'china' || saved === 'pakistan') ? saved : 'pakistan';
  });

  const setSession = (session: CountrySession) => {
    setCurrentSession(session);
    localStorage.setItem('countrySession', session);
  };

  const toggleSession = () => {
    setCurrentSession(prev => {
      const newSession = prev === 'pakistan' ? 'china' : 'pakistan';
      localStorage.setItem('countrySession', newSession);
      return newSession;
    });
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
