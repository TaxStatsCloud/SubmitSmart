import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, signOutUser } from '@/lib/firebase';
import { handleRedirectResult } from '@/lib/firebase-redirect';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle Firebase redirect result first
    const initAuth = async () => {
      try {
        const result = await handleRedirectResult();
        if (result?.user) {
          setUser(result.user);
          setLoading(false);
        }
      } catch (error) {
        // Handle redirect result errors silently
        // Ensure loading is still set to false even on error
        setLoading(false);
      }
    };
    
    initAuth().catch((error) => {
      // Handle auth initialization errors silently
      setLoading(false);
    });

    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await signOutUser();
      // Redirect to login page after successful logout
      window.location.href = '/login';
    } catch (error) {
      // Handle sign out errors silently
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};