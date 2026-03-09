import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AppUser {
  id: string;
  phone: string;
  name?: string;
  created_at?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (phone: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
  updateProfile: (name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempOtp, setTempOtp] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('restaurant_pos_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('restaurant_pos_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (phone: string) => {
    try {
      // Generate a random 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setTempOtp(generatedOtp);

      // Call our backend API to send the OTP
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone,
          otp: generatedOtp
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Log for dev purposes if the API key is missing
      if (data.message && data.message.includes('DEV MODE')) {
        console.log(`[DEV MODE] OTP for ${phone} is: ${generatedOtp}`);
        alert(`[DEV MODE] Fast2SMS Error: ${data.warning || 'API Failed'}\n\nYour OTP is: ${generatedOtp}`);
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

      // Check if user exists in the custom users table
      let { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw fetchError;
      }

      let appUser: AppUser;

      if (!existingUser) {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ phone }])
          .select()
          .single();

        if (insertError) throw insertError;
        appUser = newUser;
      } else {
        appUser = existingUser;
      }

      // Set user in state and local storage
      setUser(appUser);
      localStorage.setItem('restaurant_pos_user', JSON.stringify(appUser));

      // Clear the temporary OTP
      setTempOtp(null);
      
      return { error: null };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return { error };
    }
  };

  const updateProfile = async (name: string) => {
    if (!user) return { error: new Error('Not logged in') };
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      
      const updatedUser = { ...user, name: data.name };
      setUser(updatedUser);
      localStorage.setItem('restaurant_pos_user', JSON.stringify(updatedUser));
      
      return { error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('restaurant_pos_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, verifyOtp, updateProfile, signOut }}>
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
