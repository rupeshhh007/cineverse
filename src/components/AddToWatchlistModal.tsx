'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, X, Plus, Check, LogIn, AlertCircle } from 'lucide-react';
import { Watchlist } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

interface AddToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: number;
  movieTitle: string;
}

export default function AddToWatchlistModal({ isOpen, onClose, movieId, movieTitle }: AddToWatchlistModalProps) {
  const { user } = useAuth();
  const [lists, setLists] = useState<Watchlist[]>([]);
  const [activeListIds, setActiveListIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchLists();
    } else if (isOpen && !user) {
      setIsLoading(false);
    }
  }, [isOpen, user]);

  const fetchLists = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lists?userId=${user.user_id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load watchlists');
      setLists(data.lists || []);
      
      // Determine which lists already contain this movie
      const active = (data.lists || []).filter((l: any) => 
        l.movies?.some((m: any) => m.movie_id === movieId)
      ).map((l: any) => l.watchlist_id);
      
      setActiveListIds(active);
    } catch (err: any) {
      setError(err.message || 'Error loading watchlists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleList = async (listId: number) => {
    setIsUpdating(listId);
    setError(null);
    try {
      const isCurrentlyInList = activeListIds.includes(listId);
      const url = isCurrentlyInList 
        ? `/api/lists/${listId}?movieId=${movieId}` 
        : `/api/lists/${listId}`;

      const res = await fetch(url, {
        method: isCurrentlyInList ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: isCurrentlyInList ? JSON.stringify({ movieId }) : JSON.stringify({ movieId, action: 'add' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update list');
      }

      if (isCurrentlyInList) {
        setActiveListIds(prev => prev.filter(id => id !== listId));
      } else {
        setActiveListIds(prev => [...prev, listId]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update list');
    } finally {
      setIsUpdating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-black border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-900 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Save to List</h2>
            <p className="text-xs text-gray-500 truncate max-w-[250px]">{movieTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-y-auto p-4 space-y-2">
          {!user ? (
            <div className="text-center py-6 space-y-4">
              <p className="text-sm text-gray-400">
                You must be signed in to add films to curated lists.
              </p>
              <Link
                href="/login"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading your lists...</div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-gray-400 text-sm">You haven't created any lists yet.</p>
              <Link
                href="/lists"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs font-semibold text-white border border-gray-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create a Watchlist
              </Link>
            </div>
          ) : (
            lists.map(list => {
              const isActive = activeListIds.includes(list.watchlist_id);
              return (
                <button
                  key={list.watchlist_id}
                  onClick={() => handleToggleList(list.watchlist_id)}
                  disabled={isUpdating === list.watchlist_id}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-white text-black font-medium' 
                      : 'bg-gray-900 text-white hover:bg-gray-800 border border-gray-800'
                  }`}
                >
                  <span className="truncate text-sm font-medium">{list.name}</span>
                  {isUpdating === list.watchlist_id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isActive ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
