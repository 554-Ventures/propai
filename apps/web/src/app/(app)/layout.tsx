'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../components/auth-provider';
import AppShell from "../../components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to load before checking
    if (loading) return;
    
    if (!user) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [user, loading, router, pathname]);

  // Show nothing while loading auth
  if (loading) {
    return null;
  }

  // Show nothing if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
