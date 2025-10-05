import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  reloadUser: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    const loggedInUser = await api.login(email, password);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);
  
  const signup = useCallback(async (name: string, email: string, password?: string) => {
    const newUser = await api.signup(name, email, password);
    setUser(newUser);
  }, []);

  const reloadUser = useCallback(async () => {
    if (user) {
      const updatedUser = await api.reloadUser(user.email);
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        // User may have been deleted
        logout();
      }
    }
  }, [user, logout]);

  const value = { user, login, logout, signup, isLoading, reloadUser };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
