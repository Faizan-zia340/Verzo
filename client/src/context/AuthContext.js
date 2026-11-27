import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Returns the response data as-is: the caller (Login) decides what to
  // do with it — a plain sign-in returns { user }, a two-step sign-in
  // returns { requires2FA, email } and no session is created yet.
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  };

  // Second step of sign-in: verifies the 6-digit code and, on success,
  // signs the user in exactly as login() used to.
  const verifyTwoFactor = async (email, code) => {
    const { data } = await api.post('/auth/2fa/verify', { email, code });
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  // Turns two-step verification on or off for the signed-in user.
  const toggleTwoFactor = async (enabled) => {
    const { data } = await api.post('/auth/2fa/toggle', { enabled });
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, verifyTwoFactor, toggleTwoFactor }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
