import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (phone: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempOtp, setTempOtp] = useState<string | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (phone: string) => {
    try {
      // Generate a random 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setTempOtp(generatedOtp);

      // Call Fast2SMS API
      const apiKey = import.meta.env.VITE_FAST2SMS_API_KEY;
      if (!apiKey) {
        console.warn('Fast2SMS API key is missing. Check your environment variables.');
        // For development/testing without API key, just log the OTP
        console.log(`[DEV MODE] OTP for ${phone} is: ${generatedOtp}`);
        return { error: null };
      }

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'v3',
          sender_id: 'TXTIND',
          message: `Your Restaurant POS verification code is ${generatedOtp}`,
          language: 'english',
          flash: 0,
          numbers: phone,
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.return) {
        throw new Error(data.message || 'Failed to send OTP via Fast2SMS');
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return { error };
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    try {
      // Verify against the temporarily stored OTP
      if (token !== tempOtp) {
        throw new Error('Invalid OTP');
      }

      // If OTP is valid, we need to create or sign in the user in Supabase
      // Since we bypassed Supabase's built-in OTP, we'll use a custom approach
      // For this demo, we'll create a dummy email based on the phone number
      // and use a fixed password to simulate a successful login
      const dummyEmail = `${phone}@restaurantpos.local`;
      const dummyPassword = `User@${phone}`; // A consistent password for this user

      // Try to sign in first
      let { data, error } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: dummyPassword,
      });

      // If sign in fails (user doesn't exist), try to sign up
      if (error && error.message.includes('Invalid login credentials')) {
        const signUpResult = await supabase.auth.signUp({
          email: dummyEmail,
          password: dummyPassword,
        });
        
        data = signUpResult.data;
        error = signUpResult.error;
      }

      if (error) throw error;

      // Clear the temporary OTP
      setTempOtp(null);
      
      return { error: null };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, verifyOtp, signOut }}>
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
