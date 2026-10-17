'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, Star, Film } from 'lucide-react';
import { Movie } from '@/lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/movies?search=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.movies || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-[#1f1c1a] border border-[#54433b] rounded-2xl shadow-2xl overflow-hidden text-[#f4eee6]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] gap-3">
          <Search className="w-5 h-5 text-[#a9a19a] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search films by title or director..."
            className="flex-1 bg-transparent border-0 text-sm text-[#f4eee6] placeholder-[#7f7360] focus:outline-none"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-[#a9a19a] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-black/30 border border-[#54433b]/60 text-[#a9a19a]">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading && (
            <div className="py-8 text-center text-xs text-[#a9a19a] tracking-widest uppercase animate-pulse">
              Searching catalog...
            </div>
          )}

          {!isLoading && searchQuery.trim() && results.length === 0 && (
            <div className="py-8 text-center text-sm text-[#a9a19a]">
              No films matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}

          {!isLoading && !searchQuery.trim() && (
            <div className="py-8 px-4 text-center text-xs text-[#7f7360]">
              Type a film title or filmmaker name to search the catalog.
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((movie) => (
                <Link
                  key={movie.movie_id}
                  href={`/movies/${movie.movie_id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="w-10 h-14 bg-black/40 rounded-lg overflow-hidden shrink-0 border border-white/10">
                    {movie.poster_url ? (
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#7f7360]">
                        <Film className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#f4eee6] group-hover:text-white truncate">
                      {movie.title}
                    </h4>
                    <p className="text-xs text-[#a9a19a] truncate mt-0.5">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : '—'} · {movie.director || 'Cinema'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#ffb08d] shrink-0 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{Number(movie.avg_rating || 0).toFixed(1)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
