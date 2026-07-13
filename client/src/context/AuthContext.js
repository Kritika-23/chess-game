import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, ensureCsrfToken, readJsonResponse } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      await ensureCsrfToken();
      const data = await readJsonResponse(await apiFetch('/api/users/me'));
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await readJsonResponse(await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }));
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async ({ name, email, password, confirmPassword }) => {
    return readJsonResponse(await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    }));
  }, []);
       
  const requestPasswordReset = useCallback(async (email) => {
    return readJsonResponse(await apiFetch('/api/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }));
  }, []);

  const resetPassword = useCallback(async ({ token, password, confirmPassword }) => {
    return readJsonResponse(await apiFetch('/api/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, password, confirmPassword }),
    }));
  }, []);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    await readJsonResponse(await apiFetch('/api/users/me/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }));
    setUser(null);
  }, []);

const updateProfile = useCallback(async (profileData) => {
  const data = await readJsonResponse(
    await apiFetch("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(profileData),
    })
  );

  setUser(data.user);

  return data.user;
}, []);

const uploadAvatar = useCallback(async (image) => {
  const data = await readJsonResponse(
    await apiFetch("/api/users/me/avatar", {
      method: "POST",
      body: JSON.stringify({ image }),
    })
  );

  setUser(data.user);
  return data.user;
}, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile,
    uploadAvatar,
    logout,
  }), [user, loading, login, register, requestPasswordReset, resetPassword, changePassword, updateProfile, uploadAvatar, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
