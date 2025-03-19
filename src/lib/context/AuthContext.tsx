'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  login: (credentials: { phone: string; }) => Promise<void>;
  signup: (userData: { name: string; phone: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Fetch the user profile from our database
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (data && !error) {
            const authUser: AuthUser = {
              id: data.id,
              name: data.name,
              phone: data.phone,
              email: data.email || undefined,
            };
            setUser(authUser);
          } else {
            // New user, just signed up with auth but no profile yet
            console.log('User authenticated but no profile found');
            setUser(null);
          }
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Initial check for user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        
        // Fetch user profile
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              const authUser: AuthUser = {
                id: data.id,
                name: data.name,
                phone: data.phone,
                email: data.email || undefined,
              };
              setUser(authUser);
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: { phone: string }) => {
    setIsLoading(true);
    try {
      // Phone auth with Supabase
      const { error } = await supabase.auth.signInWithOtp({
        phone: credentials.phone,
      });
      
      if (error) throw error;
      
      // The user will be set by the auth state listener
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: { name: string; phone: string; email?: string }) => {
    setIsLoading(true);
    try {
      // Sign up with phone auth
      const { data, error: authError } = await supabase.auth.signInWithOtp({
        phone: userData.phone,
      });
      
      if (authError) throw authError;

      // After successful verification and sign-in, supabase.auth.onAuthStateChange will fire
      // At that point we'll detect a new user without a profile
      // For now, we need to wait for the verification process to complete
      
      // Note: We can't create a user record here because we don't have the user ID yet
      // The user record will be created after the OTP verification is completed

      return;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      // The user state will be updated by the auth state listener
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        login,
        signup,
        logout,
        isLoading,
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