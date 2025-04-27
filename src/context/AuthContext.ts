import { createContext } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<{ error: AuthError | null }>;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined); 