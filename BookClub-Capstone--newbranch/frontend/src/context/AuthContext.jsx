// src/context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, loading: false };
    case 'LOADING':
      return { ...state, loading: true };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
  });

  useEffect(() => {
    // Check if user is already logged in (e.g., refresh page)
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/user/');
        dispatch({ type: 'LOGIN', payload: res.data });
      } catch (err) {
        dispatch({ type: 'LOGOUT' });
      }
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await api.post('/auth/login/', { username, password });
      dispatch({ type: 'LOGIN', payload: res.data });
    } catch (err) {
      dispatch({ type: 'LOGOUT' });
      throw new Error('Invalid credentials');
    }
  };

  const register = async (username, password) => {
    try {
      const res = await api.post('/auth/register/', { username, password });
      return res.data;
    } catch (err) {
      // Re-throw the error so RegisterForm can handle it
      throw err;
    }
  };

  const logout = async () => {
    await api.post('/auth/logout/');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);