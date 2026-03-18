import { createContext, useContext, useState, useEffect } from 'react';
import { Api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('april_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await Api.me();
      if (res.success) {
        setUser(res.usuario);
      } else {
        localStorage.removeItem('april_token');
      }
    } catch (err) {
      localStorage.removeItem('april_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await Api.login(email, password);
      if (res.success && res.token) {
        localStorage.setItem('april_token', res.token);
        setUser(res.usuario);
        return { success: true };
      }
      return { success: false, message: res.message || 'Error de credenciales' };
    } catch (err) {
      return { success: false, message: err.message || 'Error al conectar' };
    }
  };

  const logout = () => {
    localStorage.removeItem('april_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, checkAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
