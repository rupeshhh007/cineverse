'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import DbmsInspectorDrawer from './DbmsInspectorDrawer';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  // Perform route redirection inside useEffect (NEVER during render)
  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.push('/login');
    }
  }, [isLoading, user, isLoginPage, router]);

  // Login page: render children directly (no chrome)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Still loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-800 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated: render blank loading while useEffect redirect executes
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-800 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Authenticated: show full app chrome
  return (
    <>
      <Navbar />
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
      <DbmsInspectorDrawer />
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellContent>{children}</AppShellContent>
    </AuthProvider>
  );
}
