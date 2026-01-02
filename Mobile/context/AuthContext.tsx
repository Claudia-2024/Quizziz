import React, { createContext, useContext, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { saveToken as storageSaveToken, clearToken as storageClearToken } from '@/lib/storage';

export type ClassInfo = {
  classId: number;
  level: string;
  department?: string;
};

export type Student = {
  matricule: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
  classId: number;
  class?: ClassInfo;
};

export type LoginSuccess = {
  message?: string;
  token: string;
  student: Student;
};

type AuthState = {
  token: string | null;
  student: Student | null;
};

type AuthContextValue = AuthState & {
  setAuthFromLogin: (payload: LoginSuccess) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);

  const setAuthFromLogin = async (payload: LoginSuccess) => {
    try {
      setToken(payload.token);
      setStudent(payload.student);
      // write-through to storage for api.ts to pick up
      await storageSaveToken(payload.token);
    } catch (_) {
      // noop
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setStudent(null);
      await storageClearToken();
    } finally {
      // redirect to login screen
      router.replace('/auth/login');
    }
  };

  const value = useMemo<AuthContextValue>(() => ({ token, student, setAuthFromLogin, logout }), [token, student]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
