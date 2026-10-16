'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ListOrdered, 
  Plus, 
  Heart, 
  Film, 
  X, 
  Check, 
  Loader2, 
  LogIn, 
  Search,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
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
  const [movieSearch, setMovieSearch] = useState('');
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

  const filteredMovies = allMovies.filter(m => 
    m.title.toLowerCase().includes(movieSearch.toLowerCase()) ||
    m.director?.toLowerCase().includes(movieSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-cv-shell border border-cv-border/30 shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-cv-muted text-[11px] font-mono uppercase tracking-widest">
            <ListOrdered className="w-3.5 h-3.5 text-cv-moss" /> The Curation Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-cv-text mt-1">
            Curated Collections
          </h1>
          <p className="text-xs text-cv-muted mt-1 max-w-xl">
            Bespoke film canons and public watchlists assembled through PostgreSQL relational models <code className="text-cv-moss font-mono">watchlists</code> and <code className="text-cv-moss font-mono">watchlist_items</code>.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              router.push('/login');
            } else {
              setIsCreateModalOpen(true);
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-cv-moss hover:bg-cv-moss/90 text-cv-ink font-bold text-xs flex items-center gap-2 shadow-sm transition-colors shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create a list</span>
        </button>
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={fetchLists} />
      )}

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-cv-shell border border-cv-border/30 animate-pulse" />
          ))
        ) : lists.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-cv-shell border border-cv-border/30 space-y-3">
            <Film className="w-10 h-10 text-cv-muted mx-auto" />
            <h3 className="text-base font-serif font-bold text-cv-text">No collections curated yet</h3>
            <p className="text-xs text-cv-muted">Be the first to curate a cinematic watchlist for the community.</p>
          </div>
        ) : (
          lists.map((list) => {
            const previewMovies = list.movies?.slice(0, 3) || [];
            const curatorInitials = (list.owner_display_name || list.owner_username || 'CU')
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={list.watchlist_id}
                className="group flex flex-col justify-between rounded-2xl bg-cv-shell border border-cv-border/30 hover:border-cv-border/60 transition-all p-5 shadow-sm overflow-hidden"
              >
                <div>
                  {/* Layered Fanned Poster Stack */}
                  <div className="relative h-44 w-full mb-4 rounded-xl bg-cv-surface/60 border border-cv-border/30 flex items-center justify-center overflow-hidden">
                    {previewMovies.length > 0 ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {previewMovies.map((m, idx) => {
                          // Layered offset transformations
                          const offsets = [
                            'z-30 translate-x-0 scale-100 shadow-xl',
                            'z-20 -translate-x-12 rotate-[-6deg] scale-90 opacity-80',
                            'z-10 translate-x-12 rotate-[6deg] scale-90 opacity-80',
                          ];
                          return (
                            <img
                              key={m.movie_id}
                              src={m.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300'}
                              alt={m.title}
                              className={`absolute w-24 h-36 rounded-lg object-cover border border-cv-border/50 transition-transform duration-300 group-hover:scale-105 ${offsets[idx] || 'hidden'}`}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-cv-muted/60 text-xs font-mono">
                        Empty Collection
                      </div>
                    )}
                  </div>

                  {/* Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cv-surface border border-cv-border/40 text-cv-moss uppercase">
                      {list.is_public ? 'Public Collection' : 'Private'}
                    </span>
                    <span className="text-[10px] font-mono text-cv-muted">
                      {list.movie_count || previewMovies.length} films
                    </span>
                  </div>

                  {/* Title & Description */}
                  <Link href={`/lists/${list.watchlist_id}`}>
                    <h2 className="text-lg font-serif font-bold text-cv-text group-hover:text-cv-moss transition-colors line-clamp-1">
                      {list.name}
                    </h2>
                  </Link>

                  <p className="text-xs text-cv-muted line-clamp-2 mt-1.5 leading-relaxed">
                    {list.description || 'A hand-selected film collection for private screening.'}
                  </p>
                </div>

                {/* Footer: Curator & Link */}
                <div className="pt-4 mt-4 border-t border-cv-border/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {list.owner_avatar_url ? (
                      <img
                        src={list.owner_avatar_url}
                        alt={list.owner_display_name || ''}
                        className="w-6 h-6 rounded-full object-cover border border-cv-border/40"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-cv-surface text-[10px] font-mono font-bold flex items-center justify-center text-cv-text">
                        {curatorInitials}
                      </div>
                    )}
                    <span className="text-xs text-cv-muted truncate max-w-[120px]">
                      {list.owner_display_name || list.owner_username}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] font-mono text-cv-muted">
                      <Heart className="w-3.5 h-3.5 text-cv-vermilion fill-current" />
                      <span>{list.likes_count || 0}</span>
                    </div>

                    <Link
                      href={`/lists/${list.watchlist_id}`}
                      className="text-xs font-bold text-cv-moss hover:underline flex items-center gap-0.5"
                    >
                      <span>Explore</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* CREATE LIST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-cv-shell border border-cv-border/50 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-cv-border/30">
              <div>
                <h3 className="text-lg font-serif font-bold text-cv-text">Create a Curated List</h3>
                <p className="text-xs text-cv-muted">Assemble films into a shareable collection.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-cv-muted hover:text-cv-text hover:bg-cv-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-cv-danger/10 border border-cv-danger/20 text-xs text-cv-danger font-mono">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cv-text mb-1">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Essential 70s Neo-Noir"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="w-full bg-cv-surface border border-cv-border/40 rounded-xl px-3.5 py-2 text-xs text-cv-text placeholder-cv-muted/50 focus:outline-none focus:border-cv-moss font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cv-text mb-1">
                  Curator&apos;s Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What binds these films together?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-cv-surface border border-cv-border/40 rounded-xl p-3 text-xs text-cv-text placeholder-cv-muted/50 focus:outline-none focus:border-cv-moss leading-relaxed"
                />
              </div>

              {/* Film Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-cv-text">
                    Select Films ({selectedMovieIds.length} selected)
                  </label>
                  <span className="text-[10px] font-mono text-cv-moss">
                    Populates watchlist_items
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cv-muted" />
                  <input
                    type="text"
                    placeholder="Search films to include..."
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    className="w-full bg-cv-surface border border-cv-border/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-cv-text placeholder-cv-muted/50 focus:outline-none focus:border-cv-moss font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 rounded-xl bg-cv-surface-2 border border-cv-border/30">
                  {filteredMovies.slice(0, 18).map((movie) => {
                    const isSelected = selectedMovieIds.includes(movie.movie_id);
                    return (
                      <button
                        key={movie.movie_id}
                        type="button"
                        onClick={() => toggleMovieSelection(movie.movie_id)}
                        className={`p-2 rounded-lg text-left flex items-center gap-2 border transition-all ${
                          isSelected
                            ? 'bg-cv-moss/20 border-cv-moss text-cv-text'
                            : 'bg-cv-surface/60 border-cv-border/30 text-cv-muted hover:text-cv-text hover:bg-cv-surface'
                        }`}
                      >
                        <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0 border-cv-border">
                          {isSelected && <Check className="w-3 h-3 text-cv-moss" />}
                        </div>
                        <span className="text-xs truncate font-mono">{movie.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cv-border/30">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cv-surface hover:bg-cv-surface-2 text-cv-muted hover:text-cv-text text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !listName.trim()}
                  className="px-5 py-2 rounded-xl bg-cv-moss hover:bg-cv-moss/90 text-cv-ink font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Collection</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
