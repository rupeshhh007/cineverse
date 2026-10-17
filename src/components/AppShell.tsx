'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';
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
      <div className="min-h-screen bg-[#0c0b0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#54433b] border-t-[#dd7058] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0b0b] text-[#f4eee6] p-1.5 sm:p-4 lg:p-6 flex flex-col items-center justify-center font-sans selection:bg-[#655149] selection:text-white relative">
      {/* Warm Ambient Canvas Lighting */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: 'radial-gradient(ellipse at 85% 8%, rgba(58, 38, 32, 0.45), transparent 46%), radial-gradient(ellipse at 13% 95%, rgba(45, 37, 28, 0.35), transparent 45%)'
        }}
      />

      {/* Contained Framed Application Workspace */}
      <div className="w-full max-w-[1520px] h-[calc(100vh-0.75rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] max-h-[1000px] bg-gradient-to-r from-[#181716] via-[#10100f] to-[#1b1714] rounded-[24px] sm:rounded-[28px] border border-[#54433c] flex flex-col lg:flex-row overflow-hidden shadow-[0_27px_95px_rgba(0,0,0,0.85)] relative z-10">
        
        {/* Desktop Left Rail Sidebar */}
        <div className="hidden lg:flex w-[230px] xl:w-[240px] bg-gradient-to-b from-[#292321] via-[#1b1a18] to-[#241d1a] border-r border-[#4e443e]/40 shrink-0 p-5 overflow-y-auto">
          <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-[280px] max-w-[80vw] h-full bg-[#241d1a] border-r border-[#54433c] p-5 overflow-y-auto relative">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-[#a9a19a] hover:text-[#f4eee6] rounded-lg"
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
        <main className="flex-1 h-full overflow-y-auto bg-transparent px-4 sm:px-7 lg:px-9 py-4 sm:py-5 lg:py-6 flex flex-col relative">
          <TopBar 
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
          />

          <div className="flex-1 pt-3 pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Palette & Lens */}
      <CommandPalette 
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
