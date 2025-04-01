import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import supabase from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<{ error: AuthError | null }>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if a previously stored session exists in localStorage
const getPersistedSession = (): Session | null => {
  const storedSession = localStorage.getItem('supabase_auth_session');
  return storedSession ? JSON.parse(storedSession) : null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(getPersistedSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session from Supabase
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          // Store session in localStorage for persistence
          localStorage.setItem('supabase_auth_session', JSON.stringify(initialSession));
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Store or remove session in localStorage based on auth state
        if (newSession) {
          localStorage.setItem('supabase_auth_session', JSON.stringify(newSession));
        } else {
          localStorage.removeItem('supabase_auth_session');
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('supabase_auth_session');
    return supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 