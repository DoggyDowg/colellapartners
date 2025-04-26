import React, { createContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import { useAuthStore } from '../stores/authStore'; // Import the Zustand store

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<{ error: AuthError | null }>;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null); // Initialize as null, let useEffect handle it
  const [loading, setLoading] = useState(true);

  // Get the Zustand store actions
  const setZustandAccessToken = useAuthStore((state) => state.auth.setAccessToken);
  const resetZustandAccessToken = useAuthStore((state) => state.auth.resetAccessToken);
  const setZustandUser = useAuthStore((state) => state.auth.setUser); // Add setUser if you store user in Zustand too

  useEffect(() => {
    // Get session from Supabase
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession); // Update local state
        setUser(initialSession?.user ?? null);
        
        // Convert User to AuthUser with required properties when setting in Zustand
        if (initialSession?.user) {
          setZustandUser({
            ...initialSession.user,
            accountNo: initialSession.user.id, // Use ID as accountNo
            exp: Math.floor((new Date().getTime() / 1000) + 3600), // Add 1 hour expiration
            email: initialSession.user.email || '', // Ensure email is never undefined
            role: initialSession.user.role ? 
              (Array.isArray(initialSession.user.role) ? initialSession.user.role : [initialSession.user.role]) : 
              ['user'] // Default role
          });
        } else {
          setZustandUser(null);
        }

        if (initialSession) {
          // Update Zustand store with initial token
          setZustandAccessToken(initialSession.access_token);
        } else {
          // Ensure Zustand store is reset if no initial session
          resetZustandAccessToken();
        }
      } catch (_error) {
        // Replace console.error with a safe error handling approach
        resetZustandAccessToken(); // Reset on error too
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession); // Update local state
        setUser(newSession?.user ?? null);
        
        // Convert User to AuthUser with required properties when setting in Zustand
        if (newSession?.user) {
          setZustandUser({
            ...newSession.user,
            accountNo: newSession.user.id, // Use ID as accountNo
            exp: Math.floor((new Date().getTime() / 1000) + 3600), // Add 1 hour expiration
            email: newSession.user.email || '', // Ensure email is never undefined
            role: newSession.user.role ? 
              (Array.isArray(newSession.user.role) ? newSession.user.role : [newSession.user.role]) : 
              ['user'] // Default role
          });
        } else {
          setZustandUser(null);
        }

        // Update Zustand store based on auth state
        if (newSession) {
          setZustandAccessToken(newSession.access_token);
        } else {
          resetZustandAccessToken();
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [setZustandAccessToken, resetZustandAccessToken, setZustandUser]); // Add dependencies

  const signOut = async () => {
    // Reset Zustand store on sign out
    resetZustandAccessToken();
    setZustandUser(null);
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

// The useAuth hook is moved to hooks/useAuth.ts 