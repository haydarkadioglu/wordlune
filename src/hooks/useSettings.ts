
"use client";
import { createContext, useContext } from 'react';

export const SUPPORTED_LANGUAGES = [
  "English", "Turkish", "Spanish", "French", "German", "Italian", "Portuguese", "Russian", "Chinese", "Japanese", "Korean", "Arabic"
];

export const SUPPORTED_UI_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' },
];

export interface SettingsContextType {
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  uiLanguage: string;
  setUiLanguage: (lang: string) => void;
  storyListId: string;
  setStoryListId: (listId: string) => void;
  lastSelectedListId: string;
  setLastSelectedListId: (listId: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
