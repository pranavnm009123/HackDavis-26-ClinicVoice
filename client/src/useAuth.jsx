import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API = 'http://localhost:3001';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cv_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cv_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('cv_token'));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('cv_user', JSON.stringify(data.user));
        } else {
          setToken(null);
          setUser(null);
          localStorage.removeItem('cv_token');
          localStorage.removeItem('cv_user');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const persist = useCallback((tok, usr) => {
    setToken(tok);
    setUser(usr);
    localStorage.setItem('cv_token', tok);
    localStorage.setItem('cv_user', JSON.stringify(usr));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const signup = useCallback(async (email, password, name) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_user');
  }, []);

  const updateProfile = useCallback(async (fields) => {
    const res = await fetch(`${API}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    const updated = { ...user, profile: data.profile, email: data.email };
    setUser(updated);
    localStorage.setItem('cv_user', JSON.stringify(updated));
    return data;
  }, [token, user]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res = await fetch(`${API}/api/profile/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password change failed');
    return data;
  }, [token]);

  const changeEmail = useCallback(async (newEmail, password) => {
    const res = await fetch(`${API}/api/profile/email`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Email change failed');
    const updated = { ...user, email: data.email };
    setUser(updated);
    localStorage.setItem('cv_user', JSON.stringify(updated));
    return data;
  }, [token, user]);

  return (
    <AuthContext.Provider value={{ token, user, loading, isLoggedIn: !!token && !!user, login, signup, logout, updateProfile, changePassword, changeEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
