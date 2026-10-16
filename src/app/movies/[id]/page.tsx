'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Play, Star, Plus, ThumbsUp, ArrowUpRight, ChevronLeft, ShieldCheck, User } from 'lucide-react';
import { Movie, MovieCastMember, Review } from '@/lib/types';
import TrailerModal from '@/components/TrailerModal';
import AddToWatchlistModal from '@/components/AddToWatchlistModal';
import RatingModal from '@/components/RatingModal';
import ErrorMessage from '@/components/ErrorMessage';

export default function MovieDetailsPage() {
  const params = useParams();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<MovieCastMember[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Spoilers visibility map
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});

  const fetchMovieData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/movies/${movieId}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          setMovie(null);
          return;
        }
        throw new Error(data.error || 'Failed to load film details');
      }
      setMovie(data.movie);
      setCast(data.cast || []);
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message || 'Error communicating with database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (movieId) fetchMovieData();
  }, [movieId]);

  const handleReviewSuccess = () => {
    fetchMovieData();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CR';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-xs font-mono tracking-widest uppercase text-[#8d9c87] animate-pulse">
          Retrieving film reel...
        </div>
      </div>
    );
  }

  if (error && !movie) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4 max-w-xl mx-auto my-12 text-center">
        <ErrorMessage message={error} onRetry={fetchMovieData} />
        <Link href="/" className="text-xs font-mono text-[#aeb9a8] hover:text-[#efece3] flex items-center gap-1.5 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Return to Discover
        </Link>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4 my-16 text-center text-[#efece3]">
        <h1 className="text-2xl font-serif font-bold text-[#efece3] tracking-tight">Film Not Found</h1>
        <p className="text-xs text-[#aeb9a8]">The requested film ID does not exist in the database catalog.</p>
        <Link href="/" className="text-xs font-mono text-[#a9cc92] hover:underline flex items-center gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Return to Discover
        </Link>
      </div>
    );
  }

  const ratingVal = Number(movie.avg_rating || 0);
  const featuredReview = reviews[0] || null;

  return (
    <div className="space-y-6 animate-fade-in text-[#efece3]">
      {/* Cinematic Hero Card */}
      <div className="relative rounded-3xl overflow-hidden border border-[#3e4c3a]/60 bg-[#182117] min-h-[380px] sm:min-h-[440px] p-6 sm:p-9 flex flex-col justify-end shadow-xl group">
        {/* Backdrop Artwork */}
        <div className="absolute inset-0 z-0">
          <img
            src={movie.backdrop_url || movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10160f] via-[#10160f]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#10160f]/90 via-[#10160f]/50 to-transparent" />
        </div>

        {/* Feature Info */}
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="text-[11px] font-mono tracking-widest uppercase text-[#aeb9a8] font-semibold">
            {movie.director ? movie.director.toUpperCase() : 'DIRECTOR'} &nbsp;/&nbsp; {movie.release_date ? new Date(movie.release_date).getFullYear() : '2024'}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif text-[#efece3] tracking-tight leading-tight">
            {movie.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#aeb9a8]">
            <span className="flex items-center gap-1 text-[#a9cc92] font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{ratingVal.toFixed(1)} / 10</span>
            </span>
            <span>•</span>
            <span>{movie.runtime} min</span>
            {movie.genres && movie.genres.length > 0 && (
              <>
                <span>•</span>
                <span>{movie.genres.map(g => g.name).join(' · ')}</span>
              </>
            )}
          </div>

          {movie.overview && (
            <p className="text-xs sm:text-sm text-[#c0ceba] line-clamp-2 leading-relaxed max-w-xl">
              {movie.overview}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsTrailerOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#efece3] hover:bg-white text-[#152016] text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Watch trailer</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWatchlistOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#202b1e]/80 hover:bg-[#2a3827] text-[#efece3] border border-[#3e4c3a] text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save to a list</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRatingOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#202b1e]/80 hover:bg-[#2a3827] text-[#efece3] border border-[#3e4c3a] text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Star className="w-3.5 h-3.5 text-[#a9cc92]" />
              <span>Rate &amp; review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Story & Craft | Community Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Story & Craft Column (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-[#182117] border border-[#344230] space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#293527]">
            <h2 className="text-base font-serif font-bold text-[#efece3]">
              Story &amp; craft
            </h2>
            <div className="text-[10px] font-mono border border-[#384835] bg-[#1a2318] text-[#a9cc92] px-2.5 py-0.5 rounded-full font-semibold">
              SPOILER-FREE
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#c0ceba] leading-relaxed">
            {movie.overview}
          </p>

          {/* Cast & Crew Avatars */}
          <div className="space-y-3 pt-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#798873] font-semibold">
              Cast and Crew
            </div>

            {cast.length > 0 ? (
              <div className="flex flex-wrap items-center gap-4">
                {cast.slice(0, 6).map((person) => (
                  <div key={person.person_id} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#293627] text-[#efece3] border border-[#445540] flex items-center justify-center font-mono font-bold text-xs tracking-wider shrink-0">
                      {getInitials(person.name)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#efece3] leading-tight">
                        {person.name}
                      </div>
                      <div className="text-[10px] text-[#8d9c87] truncate max-w-[120px]">
                        {person.character_name || person.job_role || 'Cast'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#8d9c87]">Cast records currently unlisted.</div>
            )}
          </div>
        </div>

        {/* Community Verdict Column (5 Cols) */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-[#182117] border border-[#344230] space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#293527]">
              <h2 className="text-base font-serif font-bold text-[#efece3]">
                Community verdict
              </h2>
              {ratingVal >= 8.5 && (
                <span className="text-[10px] font-mono border border-[#3e5039] bg-[#22301f] text-[#a9cc92] px-2.5 py-0.5 rounded-full font-semibold">
                  Highly rated
                </span>
              )}
            </div>

            {/* Score Big Display */}
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-4xl sm:text-5xl font-black text-[#efece3]">
                {ratingVal.toFixed(1)}
              </span>
              <span className="text-sm text-[#798873]">/10</span>
              <span className="text-xs text-[#8d9c87] ml-3">
                ({movie.review_count || reviews.length} community ratings)
              </span>
            </div>

            {/* Top Review Quote */}
            {featuredReview && (
              <div className="p-4 rounded-2xl bg-[#141b13] border border-[#2b3728] space-y-2">
                <p className="text-xs text-[#c0ceba] italic leading-relaxed">
                  &ldquo;{featuredReview.review_text || 'An exceptional cinematic achievement that rewards rewatches.'}&rdquo;
                </p>
                <div className="text-[11px] font-mono text-[#aeb9a8] flex items-center justify-between pt-1">
                  <span>{featuredReview.display_name}</span>
                  <span className="text-[#a9cc92] font-semibold">★ {Number(featuredReview.rating).toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Full Reviews Section */}
          <div className="space-y-3 pt-3 border-t border-[#293527]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#798873] font-semibold">
              Member Reviews ({reviews.length})
            </div>

            {reviews.length === 0 ? (
              <div className="text-xs text-[#8d9c87]">
                No critiques logged yet. Be the first to review this film.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {reviews.map((r) => {
                  const isSpoilerHidden = r.has_spoilers && !revealedSpoilers[r.review_id];
                  return (
                    <div key={r.review_id} className="p-3 rounded-xl bg-[#141b13] border border-[#2b3728] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-semibold text-[#efece3]">{r.display_name}</span>
                        <span className="text-[#a9cc92] font-bold">★ {Number(r.rating).toFixed(1)}</span>
                      </div>

                      {isSpoilerHidden ? (
                        <button
                          type="button"
                          onClick={() => setRevealedSpoilers(prev => ({ ...prev, [r.review_id]: true }))}
                          className="w-full text-left p-2 rounded bg-[#1e271d] text-[11px] text-[#aeb9a8] hover:text-[#efece3] transition-colors"
                        >
                          ⚠️ Contains spoilers. Click to reveal.
                        </button>
                      ) : (
                        <p className="text-xs text-[#c0ceba] leading-relaxed">
                          {r.review_text || <em>Rating-only entry.</em>}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={movie.trailer_url}
        title={movie.title}
      />

      <AddToWatchlistModal
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        movieId={movie.movie_id}
        movieTitle={movie.title}
      />

      <RatingModal
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        movieId={movie.movie_id}
        movieTitle={movie.title}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
}
