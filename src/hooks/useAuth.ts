"use client";
import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/components/auth/AuthProvider';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth called outside of AuthProvider, returning default values');
    return {
      user: null,
      loading: false,
      signOut: async () => {},
      refetchUser: async () => {}
    };
  }
  return context;
};
