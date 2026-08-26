import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  token: '',
  isAuthenticated: false,
  isAdmin: false,
  isSales: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
  changePassword: async () => {},
  authFetch: async () => {}
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('master_pos_auth_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('master_pos_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isSales = user?.role === 'sales';

  useEffect(() => {
    verifyStoredSession();
  }, [token]);

  const verifyStoredSession = async () => {
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('master_pos_user', JSON.stringify(data.user));
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch {
      // If network fails offline, keep cached user if present
      if (user && token) {
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem('master_pos_auth_token', data.token);
        localStorage.setItem('master_pos_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Email atau password salah.' };
      }
    } catch (err) {
      return { success: false, error: 'Koneksi ke server gagal: ' + err.message };
    }
  };

  const register = async (name, email, password, role = 'sales') => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem('master_pos_auth_token', data.token);
        localStorage.setItem('master_pos_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Gagal mendaftarkan akun.' };
      }
    } catch (err) {
      return { success: false, error: 'Koneksi ke server gagal: ' + err.message };
    }
  };

  const loginWithGoogle = async (googleData) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData)
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem('master_pos_auth_token', data.token);
        localStorage.setItem('master_pos_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Gagal login dengan akun Google.' };
      }
    } catch (err) {
      return { success: false, error: 'Koneksi Google gagal: ' + err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('master_pos_auth_token');
    localStorage.removeItem('master_pos_user');
    setToken('');
    setUser(null);
    setIsAuthenticated(false);
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Gagal memperbarui password.' };
      }
    } catch (err) {
      return { success: false, error: 'Koneksi gagal: ' + err.message };
    }
  };

  // Auto attach Bearer token to all /api fetch calls
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      let url = typeof input === 'string' ? input : (input?.url || '');
      if (url.startsWith('/api') && !url.startsWith('/api/auth/login') && !url.startsWith('/api/auth/register') && !url.startsWith('/api/auth/google') && token) {
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
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isAdmin,
      isSales,
      isLoading,
      login,
      register,
      loginWithGoogle,
      logout,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
