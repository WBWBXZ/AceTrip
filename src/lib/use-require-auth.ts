'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * 需要登录才能执行的操作
 * 未登录时跳转到登录页
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const router = useRouter();

  const requireAuth = useCallback(
    (action: () => void) => {
      if (!user) {
        router.push('/login');
        return;
      }
      action();
    },
    [user, router]
  );

  return { user, requireAuth };
}
