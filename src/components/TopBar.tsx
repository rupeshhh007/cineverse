'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface TopBarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

export default function TopBar({ onOpenMobileMenu, onOpenSearch }: TopBarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getBreadcrumb = () => {
    if (pathname === '/') return 'CONTINUE EXPLORING ›';
    if (pathname.startsWith('/movies/')) return 'DISCOVER / FILM DETAILS ›';
    if (pathname === '/dbms-console') return 'THE PROJECTION ROOM / POSTGRESQL ›';
    if (pathname === '/feed') return 'THE SOCIAL SCREENING ROOM ›';
    if (pathname === '/lists') return 'YOUR LIBRARY / COLLECTIONS ›';
    if (pathname.startsWith('/lists/')) return 'COLLECTIONS / CURATED WATCHLIST ›';
    if (pathname === '/community') return 'COMMUNITY / CINEPHILE RANKINGS ›';
    if (pathname.startsWith('/profile/')) return 'COMMUNITY / MEMBER PROFILE ›';
    return 'CINEVERSE ›';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AR';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="flex items-center justify-between pb-5 select-none shrink-0 border-b border-[#2a3526]/40">
      {/* Left Breadcrumb & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-[#1e261b] border border-[#374633] text-[#aeb9a8] hover:text-[#efece3]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="text-[11px] font-mono tracking-widest uppercase text-[#8d9c87] font-semibold">
          {getBreadcrumb()}
        </div>
      </div>

      {/* Right Side Header Items */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="lg:hidden p-2 rounded-xl bg-[#1e261b] border border-[#374633] text-[#aeb9a8] hover:text-[#efece3]"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <span className="hidden sm:inline-block text-[11px] font-mono tracking-wider uppercase text-[#768470] font-semibold">
          The Cineverse Collection
        </span>

        {user && (
          <Link
            href={`/profile/${user.user_id}`}
            className="w-8 h-8 rounded-full bg-[#3d4c38] text-[#efece3] border border-[#56654f] flex items-center justify-center font-bold text-xs tracking-wider hover:opacity-90 transition-opacity"
            title={user.display_name}
          >
            {getInitials(user.display_name)}
          </Link>
        )}
      </div>
    </header>
  );
}
