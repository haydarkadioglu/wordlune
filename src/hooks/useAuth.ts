"use client";
import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/components/auth/AuthProvider';

export const useAuth = (): AuthContextType | null => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth called outside of AuthProvider');
    return null;
  }
  return context;
};
