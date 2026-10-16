'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Compass, 
  Activity, 
  Layers, 
  Users, 
  Terminal, 
  Plus, 
  Star, 
  ArrowUpRight, 
  Search, 
  MoreHorizontal,
  LogOut,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface SidebarProps {
  onOpenSearch: () => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({ onOpenSearch, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, login } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AR';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const navItemClass = (active: boolean) => `
    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all
    ${active 
      ? 'bg-[#3b4836] text-[#efece3] shadow-sm font-semibold' 
      : 'text-[#aeb9a8] hover:text-[#efece3] hover:bg-[#253023]/70'
    }
  `;

  return (
    <aside className="w-full h-full flex flex-col justify-between text-[#efece3] select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link 
            href="/" 
            onClick={onCloseMobile}
            className="flex items-center gap-1.5 group"
          >
            <span className="text-xl font-black tracking-tighter text-[#efece3] group-hover:text-white transition-colors">
              CINEVERSE
            </span>
            <span className="w-2 h-2 rounded-full bg-[#f2685e] inline-block -mt-1.5" />
          </Link>
        </div>

        {/* Search Trigger Input */}
        <div className="px-1">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#161d15] hover:bg-[#222c1f] border border-[#374433] text-left text-xs text-[#8d9b87] hover:text-[#efece3] transition-colors group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-3.5 h-3.5 text-[#8d9b87] group-hover:text-[#efece3]" />
              <span className="truncate">Search movies...</span>
            </div>
            <kbd className="text-[10px] font-mono text-[#768470] border border-[#374433] rounded px-1.5 py-0.5 group-hover:border-[#52634d] transition-colors shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Nav Section: EXPLORE */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#768470] font-semibold mb-2">
            Explore
          </div>
          <Link
            href="/"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/'))}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Discover</span>
          </Link>

          <Link
            href="/feed"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/feed'))}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>Activity Feed</span>
          </Link>

          <Link
            href="/lists"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/lists'))}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Collections</span>
          </Link>

          <Link
            href="/community"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/community'))}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Community</span>
          </Link>
        </div>

        {/* Nav Section: THE STUDIO */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#768470] font-semibold mb-2">
            The Studio
          </div>
          <Link
            href="/dbms-console"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/dbms-console'))}
          >
            <Terminal className="w-4 h-4 shrink-0 text-[#a9cc92]" />
            <span>Projection Room</span>
          </Link>
        </div>

        {/* Nav Section: YOUR LIBRARY */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#768470] font-semibold mb-2">
            Your Library
          </div>
          <Link
            href="/lists?create=1"
            onClick={onCloseMobile}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-[#aeb9a8] hover:text-[#efece3] hover:bg-[#253023]/70 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Create a list</span>
          </Link>

          {user && (
            <>
              <Link
                href={`/profile/${user.user_id}#reviews`}
                onClick={onCloseMobile}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-[#aeb9a8] hover:text-[#efece3] hover:bg-[#253023]/70 transition-colors"
              >
                <Star className="w-3.5 h-3.5 shrink-0" />
                <span>Your reviews</span>
              </Link>

              <Link
                href={`/profile/${user.user_id}`}
                onClick={onCloseMobile}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-[#aeb9a8] hover:text-[#efece3] hover:bg-[#253023]/70 transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>Your profile</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* User Card at Bottom */}
      <div className="pt-4 border-t border-[#303c2c]/60 relative">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#161d15]/80 border border-[#34412f]/50">
            <Link 
              href={`/profile/${user.user_id}`}
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-[#3d4c38] text-[#efece3] border border-[#56654f] flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                {getInitials(user.display_name)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs font-semibold text-[#efece3] truncate">
                  {user.display_name}
                </div>
                <div className="text-[10px] text-[#8e9c88] truncate font-mono">
                  @{user.username}
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-[#8e9c88] hover:text-[#efece3] hover:bg-[#253023] rounded-lg transition-colors ml-1 shrink-0"
              aria-label="User menu"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#3b4836] hover:bg-[#465541] text-[#efece3] text-xs font-semibold transition-colors"
          >
            <span>Sign In</span>
          </Link>
        )}

        {/* Profile Dropdown Menu */}
        {isMenuOpen && user && (
          <div className="absolute bottom-16 left-0 right-0 p-1.5 rounded-2xl bg-[#1d251b] border border-[#3d4c39] shadow-2xl space-y-1 z-50 animate-fade-in text-xs">
            <Link
              href={`/profile/${user.user_id}`}
              onClick={() => { setIsMenuOpen(false); onCloseMobile?.(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#efece3] hover:bg-[#273324] transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#aeb9a8]" />
              <span>View Profile</span>
            </Link>

            <button
              type="button"
              onClick={async () => {
                setIsMenuOpen(false);
                // Quick switch to Sophia
                const nextEmail = user.email === 'alex@cineverse.io' ? 'sophia@cineverse.io' : 'alex@cineverse.io';
                await login(nextEmail, 'password123');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#efece3] hover:bg-[#273324] transition-colors text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#a9cc92]" />
              <span>Switch Demo Profile</span>
            </button>

            <div className="h-px bg-[#323f2f] my-1" />

            <button
              type="button"
              onClick={async () => {
                setIsMenuOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#d56b70] hover:bg-[#2e2324] transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
