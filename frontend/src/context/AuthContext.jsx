import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = loading, null = not logged in, object = logged in user
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setUser(data))
      .catch(() => setUser(null));
  }, []);

  const login = (userData) => setUser(userData);

  const logout = () => {
    fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' })
      .finally(() => setUser(null));
  };

  const refreshUser = () => {
    fetch(`${API_BASE}/api/auth/me`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setUser(data))
      .catch(() => setUser(null));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
