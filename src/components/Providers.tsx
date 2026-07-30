'use client';

import { AuthProvider } from '@/lib/auth-context';
import FeedbackButton from '@/components/ui/FeedbackButton';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <FeedbackButton />
    </AuthProvider>
  );
}
