'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListOrdered, Plus, Heart, Film, X, Check, Loader2, LogIn, AlertCircle } from 'lucide-react';
import { Watchlist, Movie } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import ErrorMessage from '@/components/ErrorMessage';

export default function ListsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<Watchlist[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form State
  const [listName, setListName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMovieIds, setSelectedMovieIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchLists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lists');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load watchlists');
      setLists(data.lists || []);
    } catch (err: any) {
      setError(err.message || 'Error loading watchlists');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/movies?limit=50');
      const data = await res.json();
      setAllMovies(data.movies || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLists();
    fetchMovies();
  }, []);

  const toggleMovieSelection = (movieId: number) => {
    setSelectedMovieIds((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;

    if (!user) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.user_id,
          name: listName.trim(),
          description: description.trim(),
          movieIds: selectedMovieIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create list');
      }

      setIsCreateModalOpen(false);
      setListName('');
      setDescription('');
      setSelectedMovieIds([]);
      fetchLists();
    } catch (err: any) {
      setSubmitError(err.message || 'Error creating list');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-900">
        <div>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <ListOrdered className="w-3.5 h-3.5 text-gray-400" /> Curated Collections
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Film Watchlists & Tier Lists
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Relational tables: <code className="text-white font-mono">watchlists</code> & <code className="text-white font-mono">watchlist_items</code>
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-gray-200 text-black text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New List</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6">
          <ErrorMessage message={error} onRetry={fetchLists} />
        </div>
      )}

      {/* Lists Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-gray-900 border border-gray-900 animate-pulse" />
          ))
        ) : (
          lists.map((list) => (
            <Link
              key={list.watchlist_id}
              href={`/lists/${list.watchlist_id}`}
              className="group flex flex-col rounded-3xl bg-gray-900 border border-gray-900 hover:border-gray-700 p-5 transition-all space-y-4"
            >
              {/* Posters Fan Deck */}
              <div className="relative h-32 w-full rounded-2xl bg-gray-900 overflow-hidden flex items-center justify-center p-2 border border-gray-900">
                {list.movies && list.movies.length > 0 ? (
                  <div className="flex -space-x-7 items-center justify-center py-2">
                    {list.movies.slice(0, 5).map((m, idx) => (
                      <img
                        key={m.movie_id}
                        src={m.poster_url}
                        alt={m.title}
                        style={{ zIndex: 5 - idx, transform: `rotate(${(idx - 2) * 4}deg)` }}
                        className="w-16 h-24 object-cover rounded-lg border border-gray-800 shadow-md transition-transform group-hover:scale-105"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Film className="w-4 h-4" /> Empty Collection
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-bold text-white group-hover:text-gray-400 transition-colors">
                  {list.name}
                </h3>
                {list.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {list.description}
                  </p>
                )}
              </div>

              {/* Author & Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-900 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <img
                    src={list.owner_avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={list.owner_display_name || ''}
                    className="w-5 h-5 rounded-full object-cover border border-gray-800"
                  />
                  <span className="text-gray-500">{list.owner_display_name}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-900">
                    {list.movie_count || 0} films
                  </span>
                  <span className="flex items-center gap-1 text-gray-400 font-semibold text-xs">
                    <Heart className="w-3 h-3 fill-current" /> {list.likes_count}
                  </span>
                </div>
              </div>

            </Link>
          ))
        )}
      </div>

      {/* CREATE LIST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-gray-900 border border-gray-800 shadow-modal p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-900">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-gray-400" />
                <span>Create New Film List</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full bg-gray-900 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">
                  List Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterpieces of Psychological Horror"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Curator notes or criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white resize-none"
                />
              </div>

              {/* Movie Picker */}
              <div>
                <label className="text-xs font-semibold text-gray-400 flex items-center justify-between mb-2">
                  <span>Include Films ({selectedMovieIds.length} chosen)</span>
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-black rounded-2xl border border-gray-900">
                  {allMovies.map((m) => {
                    const isSelected = selectedMovieIds.includes(m.movie_id);
                    return (
                      <button
                        type="button"
                        key={m.movie_id}
                        onClick={() => toggleMovieSelection(m.movie_id)}
                        className={`relative rounded-xl overflow-hidden border text-left transition-all ${
                          isSelected
                            ? 'border-white ring-1 ring-white'
                            : 'border-gray-900 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={m.poster_url} alt={m.title} className="w-full aspect-[2/3] object-cover" />
                        <div className="p-1 text-[9px] font-semibold truncate text-white bg-gray-900">
                          {m.title}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center text-black">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !listName.trim()}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-gray-200 text-black font-semibold text-xs sm:text-sm transition-colors disabled:opacity-40"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save & Publish List'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
