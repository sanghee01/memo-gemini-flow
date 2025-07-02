
import React, { createContext, useContext } from 'react';

interface GeminiContextType {
  apiKey: string;
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

export const useGemini = () => {
  const context = useContext(GeminiContext);
  if (!context) {
    throw new Error('useGemini must be used within a GeminiProvider');
  }
  return context;
};

interface GeminiProviderProps {
  children: React.ReactNode;
}

export const GeminiProvider: React.FC<GeminiProviderProps> = ({ children }) => {
  const apiKey = '***REMOVED***';

  return (
    <GeminiContext.Provider value={{ apiKey }}>
      {children}
    </GeminiContext.Provider>
  );
};
