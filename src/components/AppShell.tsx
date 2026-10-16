'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import SearchModal from './SearchModal';
import DbmsInspectorDrawer from './DbmsInspectorDrawer';
import { X } from 'lucide-react';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auth redirection in useEffect
  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.push('/login');
    }
  }, [isLoading, user, isLoginPage, router]);

  // Login page: render children directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0b0e0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#384634] border-t-[#a9cc92] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e0a] text-[#efece3] p-1.5 sm:p-3 lg:p-5 flex flex-col items-center justify-center font-sans selection:bg-[#3d4c38] selection:text-[#efece3]">
      {/* Framed Application Canvas — The Private Screening Room */}
      <div className="w-full max-w-[1600px] h-[calc(100vh-0.75rem)] sm:h-[calc(100vh-1.5rem)] lg:h-[calc(100vh-2.5rem)] max-h-[1050px] bg-[#161d15] rounded-[20px] sm:rounded-[28px] border border-[#3e4c3a]/50 flex flex-col lg:flex-row overflow-hidden shadow-2xl relative">
        
        {/* Desktop Left Rail Sidebar */}
        <div className="hidden lg:flex w-[240px] xl:w-[255px] bg-[#1d241c] border-r border-[#323d2f]/70 shrink-0 p-4 xl:p-5 overflow-y-auto">
          <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-[280px] max-w-[80vw] h-full bg-[#1d241c] border-r border-[#323d2f] p-5 overflow-y-auto relative">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-[#aeb9a8] hover:text-[#efece3] rounded-lg"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              <Sidebar 
                onOpenSearch={() => { setIsMobileMenuOpen(false); setIsSearchOpen(true); }}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
              />
            </div>
            <div 
              className="flex-1"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        )}

        {/* Main Screening Content Area */}
        <main className="flex-1 h-full overflow-y-auto bg-[#161d15] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 flex flex-col relative">
          <TopBar 
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
          />

          <div className="flex-1 pt-4 pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* Global Modals & Lens */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
      <DbmsInspectorDrawer />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellContent>{children}</AppShellContent>
    </AuthProvider>
  );
}
