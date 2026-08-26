'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark, X, Plus, Check } from 'lucide-react';
import { Watchlist } from '@/lib/types';

interface AddToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: number;
  movieTitle: string;
}

export default function AddToWatchlistModal({ isOpen, onClose, movieId, movieTitle }: AddToWatchlistModalProps) {
  const [lists, setLists] = useState<Watchlist[]>([]);
  const [activeListIds, setActiveListIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  
  const currentUserId = typeof window !== 'undefined'
    ? parseInt(localStorage.getItem('cineverse_current_user') || '1', 10)
    : 1;

  useEffect(() => {
    if (isOpen) {
      fetchLists();
    }
  }, [isOpen]);

  const fetchLists = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/lists?userId=${currentUserId}`);
      const data = await res.json();
      setLists(data.lists || []);
      
      // Determine which lists already contain this movie
      const active = (data.lists || []).filter((l: any) => 
        l.movies?.some((m: any) => m.movie_id === movieId)
      ).map((l: any) => l.watchlist_id);
      
      setActiveListIds(active);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleList = async (listId: number) => {
    setIsUpdating(listId);
    try {
      const isCurrentlyInList = activeListIds.includes(listId);
      const res = await fetch(`/api/lists/${listId}`, {
        method: isCurrentlyInList ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId }),
      });

      if (res.ok) {
        if (isCurrentlyInList) {
          setActiveListIds(prev => prev.filter(id => id !== listId));
        } else {
          setActiveListIds(prev => [...prev, listId]);
        }
      }
    } catch (err) {
      console.error(err);
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
            <h2 className="text-xl font-bold text-white tracking-tight">Save to...</h2>
            <p className="text-sm text-gray-500 truncate max-w-[250px]">{movieTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading lists...</div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">You haven't created any lists yet.</div>
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
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  <span className="truncate">{list.name}</span>
                  {isUpdating === list.watchlist_id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isActive ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              )
            })
          )}
        </div>

      </div>
    </div>
  );
}
