'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import DbmsInspectorDrawer from './DbmsInspectorDrawer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Login page renders immediately without auth check
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('cineverse_user');
      setIsAuthenticated(!!user);
    };
    
    checkAuth();
    
    // Listen for storage changes (sign in/out from other tabs or dispatched events)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Login page: render children directly (no navbar/footer)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Still loading auth state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-800 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated: redirect to login
  if (!isAuthenticated) {
    // Use replace to avoid back-button loops
    router.replace('/login');
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
