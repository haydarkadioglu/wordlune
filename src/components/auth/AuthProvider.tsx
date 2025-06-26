
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
        setUser({ ...firebaseUser, username: firebaseUser.displayName || 'user' });
        return;
    }
    try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({ ...firebaseUser, username: userData.username });
        } else {
            console.warn("User profile document not found for user:", firebaseUser.uid);
            setUser({ ...firebaseUser, username: firebaseUser.displayName || 'user' });
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser({ ...firebaseUser, username: firebaseUser.displayName || 'user' });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
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
