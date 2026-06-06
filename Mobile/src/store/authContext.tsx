import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage, StorageKeys, setStorageItem, removeStorageItem } from './storage';
import { queryClient } from '../services/queryClient';

interface User {
  id: string | null;
  name: string | null;
  email: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User;
  login: (accessToken: string, refreshToken: string, user: { id: string; name: string; email: string }) => void;
  logout: () => void;
  updateUser: (userDetails: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User>({ id: null, name: null, email: null });

  useEffect(() => {
    // Check if token exists in MMKV on load
    const token = storage.getString(StorageKeys.ACCESS_TOKEN);
    const userId = storage.getString(StorageKeys.USER_ID);
    const name = storage.getString(StorageKeys.USER_NAME);
    const email = storage.getString(StorageKeys.USER_EMAIL);

    if (token) {
      setIsAuthenticated(true);
      setUser({ id: userId ?? null, name: name ?? null, email: email ?? null });
    }
    setIsLoading(false);
  }, []);

  const login = (
    accessToken: string,
    refreshToken: string,
    userDetails: { id: string; name: string; email: string }
  ) => {
    setStorageItem(StorageKeys.ACCESS_TOKEN, accessToken);
    setStorageItem(StorageKeys.REFRESH_TOKEN, refreshToken);
    setStorageItem(StorageKeys.USER_ID, userDetails.id);
    setStorageItem(StorageKeys.USER_NAME, userDetails.name);
    setStorageItem(StorageKeys.USER_EMAIL, userDetails.email);

    setUser(userDetails);
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeStorageItem(StorageKeys.ACCESS_TOKEN);
    removeStorageItem(StorageKeys.REFRESH_TOKEN);
    removeStorageItem(StorageKeys.USER_ID);
    removeStorageItem(StorageKeys.USER_NAME);
    removeStorageItem(StorageKeys.USER_EMAIL);

    setUser({ id: null, name: null, email: null });
    setIsAuthenticated(false);
    
    // Clear React Query cache to prevent data leak across logins
    queryClient.clear();
  };

  const updateUser = (userDetails: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...userDetails };
      if (userDetails.name !== undefined) {
        if (userDetails.name === null) {
          removeStorageItem(StorageKeys.USER_NAME);
        } else {
          setStorageItem(StorageKeys.USER_NAME, userDetails.name);
        }
      }
      if (userDetails.email !== undefined) {
        if (userDetails.email === null) {
          removeStorageItem(StorageKeys.USER_EMAIL);
        } else {
          setStorageItem(StorageKeys.USER_EMAIL, userDetails.email);
        }
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
