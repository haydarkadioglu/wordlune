
"use client";
import type React from 'react';
import { useState, createContext, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';
import * as NextRouter from 'next/navigation'; // Alias to avoid conflict with local router

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
    if (!loading && !user) {
      // Allow access to login and register pages if not authenticated
      if (pathname !== '/login' && pathname !== '/register') {
        router.replace('/login');
      }
    } else if (!loading && user) {
      // If user is authenticated and on login/register, redirect to dashboard
      if (pathname === '/login' || pathname === '/register') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router, pathname]);


  const signOut = async () => {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
