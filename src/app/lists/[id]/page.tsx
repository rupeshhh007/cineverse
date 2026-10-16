'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ListOrdered, Heart, Film, ChevronLeft, Trash2, X, Loader2 } from 'lucide-react';
import { Watchlist, Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import { useAuth } from '@/lib/AuthContext';
import ErrorMessage from '@/components/ErrorMessage';

export default function SingleListPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const listId = params.id as string;

  const [list, setList] = useState<Watchlist | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [removingMovieId, setRemovingMovieId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lists/${listId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load list');
      }
      setList(data.list);
      setMovies(data.movies || []);
    } catch (err: any) {
      setError(err.message || 'Error loading list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (listId) fetchList();
  }, [listId]);

  const isOwner = Boolean(user && list && user.user_id === list.user_id);

  const handleDeleteList = async () => {
    if (!isOwner) return;
    setIsDeletingList(true);
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete list');
      }
      router.push('/lists');
    } catch (err: any) {
      setError(err.message || 'Error deleting list');
      setIsDeletingList(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRemoveMovie = async (movieId: number) => {
    if (!isOwner) return;
    setRemovingMovieId(movieId);
    try {
      const res = await fetch(`/api/lists/${listId}?movieId=${movieId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove movie');
      }
      setMovies((prev) => prev.filter((m) => m.movie_id !== movieId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove movie');
    } finally {
      setRemovingMovieId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-40 bg-gray-900 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !list) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-4">
        <ErrorMessage message={error} onRetry={fetchList} />
        <div className="text-center">
          <Link href="/lists" className="text-gray-400 hover:underline text-xs">
            Return to Lists
          </Link>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">List Not Found</h1>
        <Link href="/lists" className="text-gray-400 hover:underline text-xs">
          Return to Lists
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/lists"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-900 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Lists
        </Link>

        {isOwner && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete List
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={fetchList} />
        </div>
      )}

      {/* List Header Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gray-900 border border-gray-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ListOrdered className="w-3.5 h-3.5 text-gray-400" /> Curated Watchlist
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{list.name}</h1>
            {list.description && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1.5 max-w-2xl">{list.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-900 border border-gray-900">
            <img
              src={list.owner_avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={list.owner_display_name || ''}
              className="w-9 h-9 rounded-full object-cover border border-gray-800"
            />
            <div>
              <div className="text-xs font-bold text-white">{list.owner_display_name}</div>
              <div className="text-[10px] text-gray-500">@{list.owner_username}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-3 border-t border-gray-900 text-xs text-gray-500">
          <span className="font-mono text-white font-bold">{movies.length} Films</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-gray-400 font-semibold">
            <Heart className="w-3 h-3 fill-current" /> {list.likes_count} Likes
          </span>
          <span>•</span>
          <span>Created on {new Date(list.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Movies in List Grid */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Films in this list</h2>
        {movies.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-gray-900 border border-gray-900">
            <p className="text-xs text-gray-400">No films added to this list yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {movies.map((m) => (
              <div key={m.movie_id} className="relative group">
                <MovieCard movie={m} />
                {isOwner && (
                  <button
                    onClick={() => handleRemoveMovie(m.movie_id)}
                    disabled={removingMovieId === m.movie_id}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                    title="Remove from list"
                  >
                    {removingMovieId === m.movie_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-sm w-full p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Watchlist?</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to delete <span className="text-white font-semibold">"{list.name}"</span>? This will remove the collection and cannot be undone.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingList}
                className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteList}
                disabled={isDeletingList}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                {isDeletingList ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
