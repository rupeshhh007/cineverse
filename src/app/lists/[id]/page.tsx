'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ListOrdered, 
  Heart, 
  Film, 
  ChevronLeft, 
  Trash2, 
  X, 
  Loader2, 
  Share2, 
  Check, 
  Clock, 
  Lock, 
  Globe 
} from 'lucide-react';
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
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse pb-20">
        <div className="h-64 bg-cv-shell rounded-2xl border border-cv-border/30" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-cv-shell rounded-2xl border border-cv-border/30" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !list) {
    return (
      <div className="py-20 space-y-4 max-w-xl mx-auto text-center">
        <ErrorMessage message={error} onRetry={fetchList} />
        <Link href="/lists" className="text-cv-moss hover:underline text-xs font-mono">
          ← Return to Curated Collections
        </Link>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="py-20 text-center space-y-4 max-w-xl mx-auto">
        <h1 className="text-xl font-serif font-bold text-cv-text">Collection Not Found</h1>
        <p className="text-xs text-cv-muted">This list may have been deleted or made private.</p>
        <Link href="/lists" className="text-cv-moss hover:underline text-xs font-mono">
          ← Return to Collections
        </Link>
      </div>
    );
  }

  const backdropMovie = movies[0];
  const curatorInitials = (list.owner_display_name || list.owner_username || 'CU')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-8 pb-24">
      
      {/* Top Back Nav & Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/lists"
          className="inline-flex items-center gap-1.5 text-xs text-cv-muted hover:text-cv-text font-mono transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Collections</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cv-shell border border-cv-border/40 hover:bg-cv-surface text-xs font-semibold text-cv-text transition-colors shadow-sm"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-cv-moss" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link copied' : 'Share collection'}</span>
          </button>

          {isOwner && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cv-danger/10 hover:bg-cv-danger/20 border border-cv-danger/30 text-xs font-semibold text-cv-danger transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete collection</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Collection Header Card */}
      <div className="relative rounded-2xl bg-cv-shell border border-cv-border/40 overflow-hidden shadow-xl">
        {/* Background Film Backdrop */}
        {backdropMovie?.backdrop_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
            style={{ backgroundImage: `url(${backdropMovie.backdrop_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cv-shell via-cv-shell/80 to-transparent pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-cv-surface border border-cv-border/40 text-cv-moss">
              Curated Collection
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cv-surface-2 text-cv-muted border border-cv-border/30 flex items-center gap-1">
              {list.is_public ? <Globe className="w-3 h-3 text-cv-moss" /> : <Lock className="w-3 h-3" />}
              <span>{list.is_public ? 'Public' : 'Private'}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-cv-text">
            {list.name}
          </h1>

          {list.description && (
            <p className="text-sm text-cv-muted max-w-2xl leading-relaxed">
              {list.description}
            </p>
          )}

          {/* Curator Row + Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-cv-border/20">
            <div className="flex items-center gap-3">
              {list.owner_avatar_url ? (
                <img
                  src={list.owner_avatar_url}
                  alt={list.owner_display_name || ''}
                  className="w-10 h-10 rounded-full object-cover border border-cv-border/40"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-cv-surface text-xs font-mono font-bold flex items-center justify-center text-cv-text border border-cv-border/40">
                  {curatorInitials}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-cv-text">
                  Curated by {list.owner_display_name || list.owner_username}
                </div>
                <div className="text-[11px] text-cv-muted font-mono flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-cv-muted/60" />
                  <span>{new Date(list.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-cv-surface border border-cv-border/30 text-cv-text">
                <span className="text-cv-moss font-bold">{movies.length}</span> films
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-cv-surface border border-cv-border/30 text-cv-text flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-cv-vermilion fill-current" />
                <span>{list.likes_count || 0} likes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Films In This Collection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-cv-text">
            Films in this collection ({movies.length})
          </h2>
          {isOwner && (
            <span className="text-xs text-cv-muted font-mono">
              Hover to remove films
            </span>
          )}
        </div>

        {movies.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-cv-shell border border-cv-border/30 space-y-3">
            <Film className="w-8 h-8 text-cv-muted mx-auto" />
            <p className="text-sm text-cv-muted font-serif">No films in this collection yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <div key={movie.movie_id} className="relative group">
                <MovieCard movie={movie} />

                {isOwner && (
                  <button
                    onClick={() => handleRemoveMovie(movie.movie_id)}
                    disabled={removingMovieId === movie.movie_id}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-cv-danger text-cv-text opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-cv-border/40"
                    title="Remove film from collection"
                  >
                    {removingMovieId === movie.movie_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
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
          <div className="w-full max-w-sm rounded-2xl bg-cv-shell border border-cv-border p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-serif font-bold text-cv-text">
              Delete this collection?
            </h3>
            <p className="text-xs text-cv-muted leading-relaxed">
              This will permanently delete <strong className="text-cv-text">&ldquo;{list.name}&rdquo;</strong> and its associations from <code className="text-cv-moss font-mono">watchlists</code>.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-cv-surface hover:bg-cv-surface-2 text-cv-muted hover:text-cv-text text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteList}
                disabled={isDeletingList}
                className="px-4 py-1.5 rounded-xl bg-cv-danger hover:bg-cv-danger/90 text-white font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
