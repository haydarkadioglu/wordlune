
"use client";
import type React from 'react';
import { useState, createContext, ReactNode, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';
import * as NextRouter from 'next/navigation'; // Alias to avoid conflict with local router
import { SettingsContext } from '@/hooks/useSettings';


// --- Settings Provider ---
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [sourceLanguage, setSourceLanguageState] = useState<string>('English');
  const [targetLanguage, setTargetLanguageState] = useState<string>('Turkish');
  const [uiLanguage, setUiLanguageState] = useState<string>('tr');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedSource = localStorage.getItem('sourceLanguage');
    const savedTarget = localStorage.getItem('targetLanguage');
    const savedUiLang = localStorage.getItem('uiLanguage');
    if (savedSource) setSourceLanguageState(savedSource);
    if (savedTarget) setTargetLanguageState(savedTarget);
    if (savedUiLang) {
        setUiLanguageState(savedUiLang);
        document.documentElement.lang = savedUiLang;
    } else {
        document.documentElement.lang = 'tr';
    }
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
  
  const setUiLanguage = (lang: string) => {
    localStorage.setItem('uiLanguage', lang);
    setUiLanguageState(lang);
    document.documentElement.lang = lang;
  };

  const value = useMemo(() => ({
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    uiLanguage,
    setUiLanguage,
  }), [sourceLanguage, targetLanguage, uiLanguage]);

  if (!isLoaded) {
    return null; // Or a loading spinner, but null avoids hydration issues
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};


// --- Auth Provider ---
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true
  const router = NextRouter.useRouter();
  const pathname = NextRouter.usePathname();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return; // Firebase not initialized
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated and on login/register, redirect to dashboard
      if (pathname === '/login' || pathname === '/register') {
        router.replace('/dashboard');
      }
    }
    // The redirect for unauthenticated users trying to access protected routes
    // is handled in `src/app/dashboard/layout.tsx`.
    // No action is needed here for unauthenticated users on public routes.
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
      // Handle sign out error, maybe show a toast
    } finally {
      setLoading(false);
    }
  };
  
  const value = { user, loading, signOut };

  return (
    <AuthContext.Provider value={value}>
        <SettingsProvider>
            {children}
        </SettingsProvider>
    </AuthContext.Provider>
  );
};
