
"use client";
import type React from 'react';
import { useState, createContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/types';
import * as NextRouter from 'next/navigation';
import { SettingsContext } from '@/hooks/useSettings';
import { doc, getDoc } from 'firebase/firestore';


// --- Settings Provider ---
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [sourceLanguage, setSourceLanguageState] = useState<string>('English');
  const [targetLanguage, setTargetLanguageState] = useState<string>('Turkish');
  const [uiLanguage, setUiLanguageState] = useState<string>('en');
  const [storyListId, setStoryListIdState] = useState<string>('');
  const [lastSelectedListId, setLastSelectedListIdState] = useState<string>('');
  const [theme, setThemeState] = useState<string>('light'); // Default to light to avoid undefined state
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // This effect runs only on the client side
    const savedSource = localStorage.getItem('sourceLanguage');
    const savedTarget = localStorage.getItem('targetLanguage');
    const savedUiLang = localStorage.getItem('uiLanguage');
    const savedStoryListId = localStorage.getItem('storyListId');
    const savedLastListId = localStorage.getItem('lastSelectedListId');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedSource) setSourceLanguageState(savedSource);
    if (savedTarget) setTargetLanguageState(savedTarget);
    if (savedStoryListId) setStoryListIdState(savedStoryListId);
    if (savedLastListId) setLastSelectedListIdState(savedLastListId);
    if (savedUiLang) {
        setUiLanguageState(savedUiLang);
        document.documentElement.lang = savedUiLang;
    } else {
        document.documentElement.lang = 'en';
    }
    
    // Theme logic is now fully client-side
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // Check system preference only on the client
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(systemPrefersDark ? 'dark' : 'light');
    }
    
    setIsLoaded(true); // Mark settings as loaded
  }, []);

  // Apply theme changes to DOM
  useEffect(() => {
    // This also runs only on the client
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const setSourceLanguage = (lang: string) => {
    localStorage.setItem('sourceLanguage', lang);
    setSourceLanguageState(lang);
  };

  const setTargetLanguage = (lang: string) => {
    localStorage.setItem('targetLanguage', lang);
    setTargetLanguageState(lang);
  };
  
  const setUiLanguage = (lang: string) => {
    localStorage.setItem('uiLanguage', lang);
    setUiLanguageState(lang);
    document.documentElement.lang = lang;
  };

  const setStoryListId = (listId: string) => {
    localStorage.setItem('storyListId', listId);
    setStoryListIdState(listId);
  }
  
  const setLastSelectedListId = (listId: string) => {
    localStorage.setItem('lastSelectedListId', listId);
    setLastSelectedListIdState(listId);
  }

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const value = useMemo(() => ({
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    uiLanguage,
    setUiLanguage,
    storyListId,
    setStoryListId,
    lastSelectedListId,
    setLastSelectedListId,
    theme,
    setTheme,
    toggleTheme,
  }), [sourceLanguage, targetLanguage, uiLanguage, storyListId, lastSelectedListId, theme]);

  // Prevent children from rendering on the server or before client-side settings are loaded
  if (!isLoaded) {
    return null; 
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};


// --- Auth Provider ---
export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = NextRouter.useRouter();
  const pathname = NextRouter.usePathname();

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    if (!db) {
        setUser({ ...firebaseUser, username: firebaseUser.displayName } as AppUser);
        return;
    }
    try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            setUser({ ...firebaseUser, ...userDocSnap.data() } as AppUser);
        } else {
            console.warn("User profile document not found for user:", firebaseUser.uid);
            setUser({ ...firebaseUser, username: firebaseUser.displayName } as AppUser);
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser({ ...firebaseUser, username: firebaseUser.displayName } as AppUser);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);


  useEffect(() => {
    if (!loading && user) {
      if (pathname === '/login' || pathname === '/register') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router, pathname]);


  const signOut = async () => {
    if (!auth) return;
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      setLoading(false);
    }
  };
  
  const refetchUser = useCallback(async () => {
    if (auth?.currentUser) {
        setLoading(true);
        await fetchUserProfile(auth.currentUser);
        setLoading(false);
    }
  }, [fetchUserProfile]);
  
  const value = { user, loading, signOut, refetchUser };

  return (
    <AuthContext.Provider value={value}>
        <SettingsProvider>
            {children}
        </SettingsProvider>
    </AuthContext.Provider>
  );
};
