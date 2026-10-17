'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Play, Star, Plus, ChevronLeft, GitBranch, Film } from 'lucide-react';
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
        <div className="text-xs font-mono tracking-widest uppercase text-[#a9a19a] animate-pulse">
          Retrieving film reel...
        </div>
      </div>
    );
  }

  if (error && !movie) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4 max-w-xl mx-auto my-12 text-center">
        <ErrorMessage message={error} onRetry={fetchMovieData} />
        <Link href="/" className="text-xs text-[#b9aea4] hover:text-white flex items-center gap-1.5 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Return to Discover
        </Link>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4 my-16 text-center text-[#f4eee6]">
        <h1 className="text-2xl font-bold text-white tracking-tight">Film Not Found</h1>
        <p className="text-xs text-[#a9a19a]">The requested film ID does not exist in the database catalog.</p>
        <Link href="/" className="text-xs text-[#dd7058] hover:underline flex items-center gap-1.5 font-bold">
          <ChevronLeft className="w-4 h-4" /> Return to Discover
        </Link>
      </div>
    );
  }

  const ratingVal = Number(movie.avg_rating || 0);
  const featuredReview = reviews[0] || null;

  return (
    <div className="space-y-6 animate-fade-in text-[#f4eee6]">
      {/* Cinematic Hero Feature */}
      <div className="relative rounded-2xl overflow-hidden border border-[#54433c] bg-[#161717] min-h-[350px] sm:min-h-[400px] p-6 sm:p-8 flex flex-col justify-end shadow-xl group">
        {/* Backdrop Artwork */}
        <div className="absolute inset-0 z-0">
          <img
            src={movie.backdrop_url || movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover filter contrast-125 saturate-90 opacity-60 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e0d0df5] via-[#0c0c0ccd] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14100b] via-[#14100b]/40 to-transparent" />
        </div>

        {/* Feature Info */}
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#e79178]">
            {movie.director ? movie.director.toUpperCase() : 'DIRECTOR'} &nbsp;/&nbsp; {movie.release_date ? new Date(movie.release_date).getFullYear() : '2024'}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-[-2px] leading-tight m-0">
            {movie.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#d0c7bd]">
            <span className="font-bold text-[#ffb08d] flex items-center gap-1">
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
            <p className="text-xs sm:text-[13px] text-[#d5cec4] line-clamp-3 leading-relaxed max-w-xl">
              {movie.overview}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsTrailerOpen(true)}
              className="px-4 py-2.5 rounded-[9px] bg-[#f3ece5] hover:bg-white text-[#161310] text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Watch trailer</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWatchlistOpen(true)}
              className="px-4 py-2.5 rounded-[9px] bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-[#f5f0ea] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save to a list</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRatingOpen(true)}
              className="px-4 py-2.5 rounded-[9px] bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-[#f5f0ea] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Star className="w-3.5 h-3.5 text-[#ffb08d]" />
              <span>Rate &amp; review</span>
            </button>

            <Link
              href={`/trace?movieId=${movie.movie_id}`}
              className="px-4 py-2.5 rounded-[9px] bg-[#dd7058]/20 hover:bg-[#dd7058]/30 border border-[#dd7058]/40 text-[#f0c5a3] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#dd7058]" />
              <span>CineTrace Provenance</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Story & Cast | Community Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Story & Cast Column (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#171615] border border-[#54433b]/40 space-y-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h2 className="text-base font-bold text-white tracking-tight m-0">
              Story &amp; craft
            </h2>
            <div className="text-[10px] font-mono border border-[#54433b] bg-white/[0.02] text-[#f0c5a3] px-2.5 py-0.5 rounded-full font-semibold">
              SPOILER-FREE
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-[#d5cec4] leading-relaxed">
            {movie.overview}
          </p>

          {/* Cast & Crew */}
          <div className="space-y-3 pt-2">
            <div className="text-[10px] font-sans font-bold uppercase tracking-[1.5px] text-[#968f87]">
              Cast and Crew
            </div>

            {cast.length > 0 ? (
              <div className="flex flex-wrap items-center gap-4">
                {cast.slice(0, 6).map((person) => (
                  <div key={person.person_id} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#785e4b] text-white border border-[#b09681] flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                      {getInitials(person.name)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#f4eee6] leading-tight">
                        {person.name}
                      </div>
                      <div className="text-[10px] text-[#a9a19a] truncate max-w-[120px]">
                        {person.character_name || person.job_role || 'Cast'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#a9a19a]">Cast records unlisted in database.</div>
            )}
          </div>
        </div>

        {/* Community Verdict & Reviews Column (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#171615] border border-[#54433b]/40 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white tracking-tight m-0">
                Community verdict
              </h2>
              {ratingVal >= 8.5 && (
                <span className="text-[10px] font-mono border border-[#8a6a59] bg-[#4a2b22]/30 text-[#f0c5a3] px-2.5 py-0.5 rounded-full font-bold">
                  Critically loved
                </span>
              )}
            </div>

            {/* Big Rating Number */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-white tracking-tight">
                {ratingVal.toFixed(1)}
              </span>
              <span className="text-xs text-[#a9a19a]">/ 10</span>
              <span className="text-xs text-[#a9a19a] ml-3">
                ({movie.review_count || reviews.length} ratings)
              </span>
            </div>

            {/* Featured Quote */}
            {featuredReview && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[#54433b]/30 space-y-1.5">
                <p className="text-xs text-[#d5cec4] italic leading-relaxed">
                  &ldquo;{featuredReview.review_text || 'A stunning piece of cinematic craftsmanship.'}&rdquo;
                </p>
                <div className="text-[11px] text-[#a9a19a] flex items-center justify-between pt-1">
                  <span>{featuredReview.display_name}</span>
                  <span className="text-[#ffb08d] font-bold">★ {Number(featuredReview.rating).toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Member Reviews List with CineTrace Links */}
          <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[1.5px] text-[#968f87]">
              <span>Member Reviews ({reviews.length})</span>
              <Link href={`/trace?movieId=${movie.movie_id}`} className="text-[#dd7058] hover:underline font-sans normal-case text-xs">
                Trace reviews →
              </Link>
            </div>

            {reviews.length === 0 ? (
              <div className="text-xs text-[#a9a19a] py-2">
                No critiques logged yet. Be the first to review this film.
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {reviews.map((r) => {
                  const isSpoilerHidden = r.has_spoilers && !revealedSpoilers[r.review_id];
                  return (
                    <div key={r.review_id} className="p-3 rounded-xl bg-white/[0.02] border border-[#54433b]/25 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-white">{r.display_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#ffb08d] font-bold">★ {Number(r.rating).toFixed(1)}</span>
                          <Link
                            href={`/trace?movieId=${movie.movie_id}`}
                            className="text-[10px] text-[#dd7058] hover:underline font-semibold flex items-center gap-0.5"
                            title="Trace review mutation in PostgreSQL"
                          >
                            <span>Trace →</span>
                          </Link>
                        </div>
                      </div>

                      {isSpoilerHidden ? (
                        <button
                          type="button"
                          onClick={() => setRevealedSpoilers(prev => ({ ...prev, [r.review_id]: true }))}
                          className="w-full text-left p-2 rounded bg-black/30 text-[10px] text-[#a9a19a] hover:text-white transition-colors"
                        >
                          ⚠️ Contains spoilers. Click to reveal.
                        </button>
                      ) : (
                        <p className="text-xs text-[#c8c3bb] leading-relaxed m-0">
                          {r.review_text || <em className="text-[#7f7360]">Rating-only entry.</em>}
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
