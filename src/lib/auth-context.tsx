'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (phone: string, password: string) => Promise<{ error: string | null }>;
  signIn: (phone: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        useAppStore.getState().loadFromSupabase(session.user.id);
      } else {
        useAppStore.getState().clearData();
      }
      setLoading(false);
    });

    // 监听 auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        useAppStore.getState().loadFromSupabase(session.user.id);
      } else {
        useAppStore.getState().clearData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (phone: string, password: string) => {
    // 用手机号作为 email 格式：13800138000 -> 13800138000@acetrip.app
    const email = `${phone}@acetrip.app`;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.message.includes('already registered')) {
        return { error: '该手机号已注册，请直接登录' };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const signIn = async (phone: string, password: string) => {
    const email = `${phone}@acetrip.app`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: '手机号或密码错误' };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
