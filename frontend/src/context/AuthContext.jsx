import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

// C3 fix: safe JSON.parse that handles corrupted/tampered localStorage
function safeParseUser() {
  try {
    const saved = localStorage.getItem('technova_user');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // Basic integrity check — must have id, email, role
    if (!parsed?.id || !parsed?.email || !parsed?.role) {
      localStorage.removeItem('technova_user');
      localStorage.removeItem('technova_token');
      return null;
    }
    return parsed;
  } catch {
    // Corrupted data — clear and force re-login
    localStorage.removeItem('technova_user');
    localStorage.removeItem('technova_token');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(safeParseUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('technova_token');
      if (token) {
        try {
          const { data } = await API.get('/auth/me');
          updateUser(data);
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 404) {
            logout();
          }
        }
      }
    };
    fetchUser();
  }, []);
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('technova_token', data.token);
      localStorage.setItem('technova_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true, role: data.user.role };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('technova_token');
    localStorage.removeItem('technova_user');
    setUser(null);
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('technova_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
