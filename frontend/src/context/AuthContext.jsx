import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const persistSession = (data) => {
    if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }
  };

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(credentials);
      persistSession(data);
      return data;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed. Check your credentials.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.register(payload);
      persistSession(data);
      return data;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Registration failed.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    authApi.logout().catch(() => {
      /* best-effort — session is already cleared client-side regardless */
    });
  }, []);

  const updateProfile = useCallback(async (profilePayload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.updateProfile(profilePayload);
      // /auth/me/profile only returns { user }, no tokens — reuse persistSession,
      // it already no-ops on the missing accessToken key.
      persistSession(data);
      return data;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Could not update profile.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, loading, error, login, register, logout, updateProfile }),
    [user, loading, error, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}