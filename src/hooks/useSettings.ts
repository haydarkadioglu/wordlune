
"use client";
import { createContext, useState, useContext, useEffect, ReactNode, useMemo } from 'react';

export const SUPPORTED_LANGUAGES = [
  "English", "Turkish", "Spanish", "French", "German", "Italian", "Portuguese", "Russian", "Chinese", "Japanese", "Korean", "Arabic"
];

interface SettingsContextType {
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [sourceLanguage, setSourceLanguageState] = useState<string>('English');
  const [targetLanguage, setTargetLanguageState] = useState<string>('Turkish');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedSource = localStorage.getItem('sourceLanguage');
    const savedTarget = localStorage.getItem('targetLanguage');
    if (savedSource) setSourceLanguageState(savedSource);
    if (savedTarget) setTargetLanguageState(savedTarget);
    setIsLoaded(true);
  }, []);

  const setSourceLanguage = (lang: string) => {
    localStorage.setItem('sourceLanguage', lang);
    setSourceLanguageState(lang);
  };

  const setTargetLanguage = (lang: string) => {
    localStorage.setItem('targetLanguage', lang);
    setTargetLanguageState(lang);
  };

  const value = useMemo(() => ({
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
  }), [sourceLanguage, targetLanguage]);

  if (!isLoaded) {
    return null; // Or a loading spinner, but null avoids hydration issues
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
