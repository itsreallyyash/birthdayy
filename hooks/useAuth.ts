'use client';
import { useState, useEffect, useCallback } from 'react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'lilbalcony';
const SESSION_KEY = 'auth_session';

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check if user has a valid session
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const { timestamp, isAdmin } = JSON.parse(session);
        // Session expires after 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setAuth({
            isAuthenticated: true,
            isAdmin: isAdmin || false,
            isLoading: false,
          });
          return;
        }
      } catch (error) {
        console.error('[Auth] Session parsing error:', error);
      }
    }
    setAuth({
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  }, []);

  const notifyLogin = (role: 'admin' | 'visitor') => {
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    fetch('/api/notify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, timestamp }),
    }).catch(() => {});
  };

  const login = useCallback((password: string, adminPassword?: string) => {
    // Check admin mode first
    if (adminPassword !== undefined) {
      const isAdminValid = adminPassword === ADMIN_PASSWORD;
      if (isAdminValid) {
        const session = { timestamp: Date.now(), isAdmin: true };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setAuth({ isAuthenticated: true, isAdmin: true, isLoading: false });
        notifyLogin('admin');
        return true;
      }
      return false;
    }

    // Regular user login
    const isValid = password === 'yellowblue';
    if (isValid) {
      const session = { timestamp: Date.now(), isAdmin: false };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setAuth({ isAuthenticated: true, isAdmin: false, isLoading: false });
      notifyLogin('visitor');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setAuth({
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  }, []);

  return {
    ...auth,
    login,
    logout,
  };
}