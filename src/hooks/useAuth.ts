import { useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from '@/lib/storage';

// Simple hash function for demo purposes
// In production, this should be done server-side with proper bcrypt
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

interface StoredUser extends User {
  passwordHash: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStorageItem<User>(STORAGE_KEYS.USER);
    if (storedUser) {
      setAuthState({
        user: storedUser,
        isAuthenticated: true,
      });
    }
    setIsLoading(false);
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: '유효한 이메일 주소를 입력해주세요.' };
    }

    // Validate password
    if (password.length < 8) {
      return { error: '비밀번호는 최소 8자 이상이어야 합니다.' };
    }

    // Check if user exists
    const users = getStorageItem<StoredUser[]>('learnflow_users') || [];
    if (users.some(u => u.email === email)) {
      return { error: '이미 등록된 이메일입니다.' };
    }

    // Create new user
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      email,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    setStorageItem('learnflow_users', users);

    // Auto login
    const { passwordHash, ...userWithoutPassword } = newUser;
    setStorageItem(STORAGE_KEYS.USER, userWithoutPassword);
    setAuthState({
      user: userWithoutPassword,
      isAuthenticated: true,
    });

    return {};
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    const users = getStorageItem<StoredUser[]>('learnflow_users') || [];
    const user = users.find(u => u.email === email);

    if (!user || user.passwordHash !== simpleHash(password)) {
      return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }

    const { passwordHash, ...userWithoutPassword } = user;
    setStorageItem(STORAGE_KEYS.USER, userWithoutPassword);
    setAuthState({
      user: userWithoutPassword,
      isAuthenticated: true,
    });

    return {};
  }, []);

  const logout = useCallback(() => {
    removeStorageItem(STORAGE_KEYS.USER);
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
  }, []);

  return {
    ...authState,
    isLoading,
    register,
    login,
    logout,
  };
}
