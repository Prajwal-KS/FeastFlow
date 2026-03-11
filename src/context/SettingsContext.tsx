import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SettingsContextType {
  isTableServiceEnabled: boolean;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  isTableServiceEnabled: true,
  loading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isTableServiceEnabled, setIsTableServiceEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        // Attempt to fetch from a settings table
        // If the table doesn't exist yet, this will fail gracefully and we'll use the default (true)
        const { data, error } = await supabase
          .from('restaurant_settings')
          .select('is_table_service_enabled')
          .single();

        if (error) {
          console.log('Settings table not found or empty, using defaults');
        } else if (data) {
          setIsTableServiceEnabled(data.is_table_service_enabled);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();

    // Subscribe to changes if the table exists
    const subscription = supabase
      .channel('public:restaurant_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_settings' }, payload => {
        if (payload.new && 'is_table_service_enabled' in payload.new) {
          setIsTableServiceEnabled(payload.new.is_table_service_enabled);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ isTableServiceEnabled, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
