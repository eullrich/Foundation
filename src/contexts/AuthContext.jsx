import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  const checkAdminStatus = async (userId) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    try {
      // For the specific email we know is admin
      if (user && user.email === 'eullrich@gmail.com') {
        setIsAdmin(true);
        return;
      }

      // Fallback to checking the database
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkAdminStatus(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        await checkAdminStatus(data.user.id);
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign up with email and password
  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  // Auth context value
  const value = {
    user,
    session,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
