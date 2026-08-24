import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  changeAccessCode: async () => {},
  authFetch: async () => {}
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('master_pos_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    verifyStoredToken();
  }, [token]);

  const verifyStoredToken = async () => {
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('master_pos_token');
        setToken('');
        setIsAuthenticated(false);
      }
    } catch {
      // If network offline or check fails, allow cached if present
      setIsAuthenticated(!!token);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (code) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('master_pos_token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Kode akses salah' };
      }
    } catch (err) {
      return { success: false, error: 'Koneksi gagal: ' + err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('master_pos_token');
    setToken('');
    setIsAuthenticated(false);
  };

  const changeAccessCode = async (currentCode, newCode) => {
    try {
      const res = await fetch('/api/auth/change-code', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_code: currentCode, new_code: newCode })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('master_pos_token', data.token);
        setToken(data.token);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Gagal mengubah kode akses' };
      }
    } catch (err) {
      return { success: false, error: 'Koneksi gagal: ' + err.message };
    }
  };

  // Helper fetch with auto Bearer token
  const authFetch = (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers });
  };

  // Override window.fetch to automatically include token for all /api calls
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      let url = typeof input === 'string' ? input : input.url;
      if (url.startsWith('/api') && !url.startsWith('/api/auth/login') && token) {
        init = init || {};
        init.headers = {
          ...(init.headers || {}),
          'Authorization': `Bearer ${token}`
        };
      }
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, changeAccessCode, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
