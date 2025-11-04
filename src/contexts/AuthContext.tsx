import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AUTH_EMAIL = 'admin@aiconsultant.com';
const AUTH_PASSWORD = 'G7v@pK9z';
const STORAGE_KEY = 'auth:isAuthenticated';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isAuthenticated) {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [isAuthenticated]);

  const login = useCallback((email: string, password: string) => {
    const matched = email === AUTH_EMAIL && password === AUTH_PASSWORD;
    if (matched) {
      setIsAuthenticated(true);
    }
    return matched;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthはAuthProvider内でのみ使用できます');
  }
  return context;
};


