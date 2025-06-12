
"use client";
import type React from 'react';
import { useState, createContext, ReactNode } from 'react';
// Firebase auth imports are no longer needed for mock setup
// import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
// import { auth } from '@/lib/firebase';
import type { User } from '@/types';
// import { useRouter } from 'next/navigation'; // Not needed for redirect from here anymore

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Define a more complete mock user based on Firebase User type
const mockUser: User = {
  uid: 'mock-user-uid',
  email: 'user@example.com',
  displayName: 'Mock User',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [{
    providerId: 'password', // or 'google.com', etc.
    uid: 'mock-user-uid',
    displayName: 'Mock User',
    email: 'user@example.com',
    phoneNumber: null,
    photoURL: null,
  }],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: async () => { console.log('Mock user delete called'); },
  getIdToken: async (_forceRefresh?: boolean) => 'mock-id-token',
  getIdTokenResult: async (_forceRefresh?: boolean) => ({
    token: 'mock-id-token',
    claims: { auth_time: Date.now() / 1000, iat: Date.now() / 1000, exp: (Date.now() / 1000) + 3600 },
    expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
    issuedAtTime: new Date(Date.now()).toISOString(),
    signInProvider: 'password',
    signInSecondFactor: null,
  }),
  reload: async () => { console.log('Mock user reload called'); },
  toJSON: () => ({ uid: 'mock-user-uid', email: 'user@example.com', displayName: 'Mock User' }),
  phoneNumber: null,
  photoURL: null,
};


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(mockUser); // Provide mock user by default
  const [loading, setLoading] = useState(false); // Set loading to false by default
  // const router = useRouter(); // Not needed if we don't redirect from here

  // useEffect for onAuthStateChanged is removed as we are using a mock user
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
  //     if (firebaseUser) {
  //       setUser(firebaseUser as User);
  //     } else {
  //       setUser(null); // Or set to mockUser if you want a fallback
  //     }
  //     setLoading(false);
  //   });
  //   return () => unsubscribe();
  // }, []);

  const signOut = async () => {
    // console.log("Sign out called for mock user. Resetting to mock user state.");
    // For a "removed login" scenario, signOut might do nothing or reset to the mock user.
    setUser(mockUser); 
    // If you had a toast notification system, you could notify that this is a mock sign out.
    // router.push('/login'); // Avoid this if login page is effectively removed
  };
  
  const value = { user, loading, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
