'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, AuthUser } from '@/services/auth-api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  sendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, [checkAuth]);

  const sendOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.sendOtp(email);
      if (response.success) {
        return { success: true };
      }
      return { success: false, error: response.error || 'Failed to send OTP' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send OTP' };
    }
  };

  const login = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.verifyOtp(email, code);
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: response.error || 'Authentication failed' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
        sendOtp,
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
