import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SettingsContextType {
  isTableServiceEnabled: boolean;
  packagingCharge: number;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  isTableServiceEnabled: true,
  packagingCharge: 20,
  loading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isTableServiceEnabled, setIsTableServiceEnabled] = useState(true);
  const [packagingCharge, setPackagingCharge] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        // Attempt to fetch from a settings table
        // If the table doesn't exist yet, this will fail gracefully and we'll use the default (true)
        const { data, error } = await supabase
          .from('restaurant_settings')
          .select('is_table_service_enabled, packaging_charge')
          .single();

        if (error) {
          console.log('Settings table not found or empty, using defaults');
        } else if (data) {
          if (data.is_table_service_enabled !== undefined) setIsTableServiceEnabled(data.is_table_service_enabled);
          if (data.packaging_charge !== undefined) setPackagingCharge(data.packaging_charge);
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
        if (payload.new) {
          if ('is_table_service_enabled' in payload.new) {
            setIsTableServiceEnabled(payload.new.is_table_service_enabled);
          }
          if ('packaging_charge' in payload.new) {
            setPackagingCharge(payload.new.packaging_charge);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ isTableServiceEnabled, packagingCharge, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
