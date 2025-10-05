import React, { createContext, useState, useEffect, useCallback } from 'react';
import { UserSettings } from '../types';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

interface SettingsContextType {
  settings: UserSettings | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isSettingsLoading: boolean;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);
    
    // Apply theme to the document
    useEffect(() => {
        if (settings?.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [settings?.theme]);

    // Load settings when user logs in
    useEffect(() => {
        const loadSettings = async () => {
            if (user) {
                setIsSettingsLoading(true);
                const userSettings = await api.getUserSettings(user.email);
                setSettings(userSettings);
                setIsSettingsLoading(false);
            } else {
                setSettings(null); // Clear settings on logout
            }
        };
        loadSettings();
    }, [user]);

    const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
        if (user && settings) {
            const updatedSettings: UserSettings = { ...settings, ...newSettings };
            await api.updateUserSettings(user.email, updatedSettings);
            setSettings(updatedSettings);
        }
    }, [user, settings]);
    
    const value = { settings, updateSettings, isSettingsLoading };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
