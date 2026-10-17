'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Compass, 
  Clock, 
  Layers, 
  Users, 
  Terminal, 
  Search, 
  MoreHorizontal,
  LogOut,
  User as UserIcon,
  Sparkles,
  GitBranch,
  Bookmark
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
    flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all select-none
    ${active 
      ? 'bg-[#655149]/40 text-white border border-[#bca18d]/20 shadow-sm font-semibold' 
      : 'text-[#c9c3bc] hover:text-[#ffffff] hover:bg-white/[0.04]'
    }
  `;

  return (
    <aside className="w-full h-full flex flex-col justify-between text-[#f4eee6] select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link 
            href="/" 
            onClick={onCloseMobile}
            className="flex items-center gap-0.5 group"
          >
            <span className="text-2xl font-black tracking-tighter text-[#f4eee6] group-hover:text-white transition-colors">
              CINEVERSE
            </span>
            <span className="text-2xl font-black text-[#dd7058]">.</span>
          </Link>
        </div>

        {/* Search Trigger Input */}
        <div className="px-1">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-[#54433b]/40 text-left text-xs text-[#a9a19a] hover:text-[#f4eee6] transition-colors group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-3.5 h-3.5 text-[#a9a19a] group-hover:text-[#f4eee6]" />
              <span className="truncate">Search films, people...</span>
            </div>
            <kbd className="text-[10px] font-mono text-[#a9a19a] border border-[#54433b]/60 rounded px-1.5 py-0.5 group-hover:border-[#826b59] transition-colors shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Nav Section: EXPLORE */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-sans uppercase tracking-[2px] text-[#968f87] font-bold mb-2">
            Explore
          </div>
          <Link
            href="/"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/'))}
          >
            <Compass className={`w-4 h-4 shrink-0 ${isActive('/') ? 'text-[#dd7058]' : 'text-[#b0a8a0]'}`} />
            <span>Discover</span>
          </Link>

          <Link
            href="/feed"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/feed'))}
          >
            <Clock className={`w-4 h-4 shrink-0 ${isActive('/feed') ? 'text-[#dd7058]' : 'text-[#b0a8a0]'}`} />
            <span>Activity</span>
          </Link>

          <Link
            href="/lists"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/lists'))}
          >
            <Layers className={`w-4 h-4 shrink-0 ${isActive('/lists') ? 'text-[#dd7058]' : 'text-[#b0a8a0]'}`} />
            <span>Collections</span>
          </Link>

          <Link
            href="/community"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/community'))}
          >
            <Users className={`w-4 h-4 shrink-0 ${isActive('/community') ? 'text-[#dd7058]' : 'text-[#b0a8a0]'}`} />
            <span>Community</span>
          </Link>
        </div>

        {/* Nav Section: DATABASE */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-sans uppercase tracking-[2px] text-[#968f87] font-bold mb-2">
            Database
          </div>
          <Link
            href="/trace"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/trace'))}
          >
            <GitBranch className={`w-4 h-4 shrink-0 ${isActive('/trace') ? 'text-[#dd7058]' : 'text-[#b0a8a0]'}`} />
            <span>CineTrace</span>
          </Link>

          <Link
            href="/dbms-console"
            onClick={onCloseMobile}
            className={navItemClass(isActive('/dbms-console'))}
          >
            <Terminal className={`w-4 h-4 shrink-0 ${isActive('/dbms-console') ? 'text-[#dd7058]' : 'text-[#b0a8a0]'}`} />
            <span>DB Studio</span>
          </Link>
        </div>
      </div>

      {/* User Card at Bottom */}
      <div className="pt-4 border-t border-white/[0.08] relative">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.02] border border-[#54433b]/30">
            <Link 
              href={`/profile/${user.user_id}`}
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-[#b66a4b] text-white border-2 border-[#826b59] flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                {getInitials(user.display_name)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs font-semibold text-[#f4eee6] truncate">
                  {user.display_name}
                </div>
                <div className="text-[11px] text-[#aba39b] truncate">
                  Your profile →
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-[#aba39b] hover:text-[#f4eee6] hover:bg-white/[0.05] rounded-lg transition-colors ml-1 shrink-0"
              aria-label="User menu"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#eee7dd] hover:bg-white text-[#161310] text-xs font-bold transition-colors"
          >
            <span>Sign In</span>
          </Link>
        )}

        {/* Profile Dropdown Menu */}
        {isMenuOpen && user && (
          <div className="absolute bottom-16 left-0 right-0 p-1.5 rounded-2xl bg-[#211e1b] border border-[#54433b] shadow-2xl space-y-1 z-50 animate-fade-in text-xs">
            <Link
              href={`/profile/${user.user_id}`}
              onClick={() => { setIsMenuOpen(false); onCloseMobile?.(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#f4eee6] hover:bg-white/[0.05] transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#b9aea4]" />
              <span>View Profile</span>
            </Link>

            <button
              type="button"
              onClick={async () => {
                setIsMenuOpen(false);
                const nextEmail = user.email === 'alex@cineverse.io' ? 'sophia@cineverse.io' : 'alex@cineverse.io';
                await login(nextEmail, 'password123');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#f4eee6] hover:bg-white/[0.05] transition-colors text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#dd7058]" />
              <span>Switch Demo Profile</span>
            </button>

            <div className="h-px bg-white/[0.08] my-1" />

            <button
              type="button"
              onClick={async () => {
                setIsMenuOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#e05555] hover:bg-[#e05555]/10 transition-colors text-left"
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
