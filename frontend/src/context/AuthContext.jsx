import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = {
  python: {
    id: 'python_demo',
    email: 'python_demo@learnnote.ai',
    password: 'PythonDemo123!',
    name: 'Python Demo',
    description: 'Functions, OOP, Inheritance, Exceptions, and File Handling',
  },
  data: {
    id: 'data_demo',
    email: 'data_demo@learnnote.ai',
    password: 'DataDemo123!',
    name: 'Data Demo',
    description: 'NumPy, Pandas, Data Cleaning, DataFrames, and Visualizations',
  },
  cs: {
    id: 'cs_demo',
    email: 'cs_demo@learnnote.ai',
    password: 'CSDemo123!',
    name: 'CS Demo',
    description: 'DBMS, SQL JOINs, Operating Systems, Networks, and Normalization',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('learnnote_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('learnnote_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for 401 unauthorized session expiry
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Verify existing token on initial load
    async function checkAuth() {
      if (token) {
        try {
          const profile = await api.auth.me();
          setUser(profile);
          localStorage.setItem('learnnote_user', JSON.stringify(profile));
        } catch (err) {
          localStorage.removeItem('learnnote_token');
          localStorage.removeItem('learnnote_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [token]);

  const login = async (emailOrId, password) => {
    setError(null);
    try {
      const res = await api.auth.login({ email_or_unique_id: emailOrId, password });
      localStorage.setItem('learnnote_token', res.access_token);
      localStorage.setItem('learnnote_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const demoLogin = async (demoKey) => {
    const creds = DEMO_CREDENTIALS[demoKey];
    if (!creds) throw new Error('Unknown demo account');
    return login(creds.id, creds.password);
  };

  const register = async (uniqueId, email, password) => {
    setError(null);
    try {
      const res = await api.auth.register({ unique_id: uniqueId, email, password });
      localStorage.setItem('learnnote_token', res.access_token);
      localStorage.setItem('learnnote_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('learnnote_token');
    localStorage.removeItem('learnnote_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        demoLogin,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
