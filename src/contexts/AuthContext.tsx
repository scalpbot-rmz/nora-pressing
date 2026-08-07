'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppUser, setAuthSession, clearAuthSession, logoutUser } from '@/lib/auth';

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
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const emailConfirmed = !!session.user.email_confirmed_at;
        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Gérant',
          emailConfirmed,
        };

        if (emailConfirmed) {
          setUser(appUser);
          setAuthSession(appUser.id, appUser.email);
        } else {
          setUser(null);
          clearAuthSession();
        }
      } else {
        setUser(null);
        clearAuthSession();
      }
    } catch (err) {
      console.error('Erreur récupération session Auth:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSession();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const emailConfirmed = !!session.user.email_confirmed_at;
        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Gérant',
          emailConfirmed,
        };

        if (emailConfirmed) {
          setUser(appUser);
          setAuthSession(appUser.id, appUser.email);
        } else {
          setUser(null);
          clearAuthSession();
        }
      } else {
        setUser(null);
        clearAuthSession();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
