import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

interface User {
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface StoredUser {
  email: string;
  password: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const signup = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Validate inputs
    if (!email || !password) {
      return { success: false, error: '이메일과 비밀번호를 입력해주세요.' };
    }

    if (password.length < 6) {
      return { success: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' };
    }

    // Check if user already exists
    const users = getStorageItem<StoredUser[]>('learnflow_users') || [];
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      return { success: false, error: '이미 가입된 이메일입니다.' };
    }

    // Store new user
    users.push({ email, password });
    setStorageItem('learnflow_users', users);

    return { success: true };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Validate inputs
    if (!email || !password) {
      return { success: false, error: '이메일과 비밀번호를 입력해주세요.' };
    }

    // Check credentials
    const users = getStorageItem<StoredUser[]>('learnflow_users') || [];
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (!foundUser) {
      return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }

    // Set authenticated state
    setIsAuthenticated(true);
    setUser({ email: foundUser.email });

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, logout }}>
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
