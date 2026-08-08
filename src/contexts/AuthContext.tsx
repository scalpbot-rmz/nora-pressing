'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppUser, setAuthSession, clearAuthSession, getCurrentAppUser, logoutUser } from '@/lib/auth';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isEmailVerified: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserSession = async () => {
    try {
      // 1. Tenter la session Supabase
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Gérant',
          emailConfirmed: !!session.user.email_confirmed_at,
        };

        setUser(appUser);
        setAuthSession(appUser);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Supabase Auth non joignable lors de fetchUserSession, vérification session locale:', err);
    }

    // 2. Fallback session locale
    const localUser = getCurrentAppUser();
    if (localUser) {
      setUser(localUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserSession();

    let subscription: any = null;
    try {
      const supabase = createClient();
      const res = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Gérant',
            emailConfirmed: !!session.user.email_confirmed_at,
          };
          setUser(appUser);
          setAuthSession(appUser);
        } else {
          const localUser = getCurrentAppUser();
          if (localUser) {
            setUser(localUser);
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });
      subscription = res.data?.subscription;
    } catch (err) {
      console.warn('Listener Supabase Auth non initialisé:', err);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isEmailVerified: !!user?.emailConfirmed,
        logout: handleLogout,
        refreshSession: fetchUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
