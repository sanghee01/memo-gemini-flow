import React, { createContext, useContext } from "react";

interface GeminiContextType {
  apiKey: string;
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

export const useGemini = () => {
  const context = useContext(GeminiContext);
  if (!context) {
    throw new Error("useGemini must be used within a GeminiProvider");
  }
  return context;
};

interface GeminiProviderProps {
  children: React.ReactNode;
}

export const GeminiProvider: React.FC<GeminiProviderProps> = ({ children }) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  if (!apiKey) {
    console.error(
      "VITE_GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요."
    );
  }

  return (
    <GeminiContext.Provider value={{ apiKey }}>
      {children}
    </GeminiContext.Provider>
  );
};
