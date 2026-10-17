'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, ArrowUpRight, Star } from 'lucide-react';
import { Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import TrailerModal from '@/components/TrailerModal';

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<Movie | null>(null);
  const [recentEvent, setRecentEvent] = useState<any>(null);

  useEffect(() => {
    const fetchMoviesAndEvent = async () => {
      try {
        const [moviesRes, eventRes] = await Promise.all([
          fetch('/api/movies?sortBy=trending&limit=30'),
          fetch('/api/feed?limit=1'),
        ]);

        const moviesData = await moviesRes.json();
        if (moviesData.movies && moviesData.movies.length > 0) {
          setMovies(moviesData.movies);
        }

        const eventData = await eventRes.json();
        if (eventData.activities && eventData.activities.length > 0) {
          setRecentEvent(eventData.activities[0]);
        }
      } catch (err) {
        console.error('Failed to load discover data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoviesAndEvent();
  }, []);

  // Selection logic matching 01-new-discover.png:
  // Inception as feature hero, Blade Runner 2049 & Interstellar as tall cards
  const heroMovie = movies.find(m => m.title.toLowerCase().includes('inception')) || movies[0] || null;
  const remaining = movies.filter(m => m.movie_id !== heroMovie?.movie_id);
  const sideMovie1 = remaining.find(m => m.title.toLowerCase().includes('blade runner')) || remaining[0] || null;
  const sideMovie2 = remaining.find(m => m.title.toLowerCase().includes('interstellar') && m.movie_id !== sideMovie1?.movie_id) || remaining.find(m => m.movie_id !== sideMovie1?.movie_id) || null;
  
  // Shelf row films
  const shelfMovies = movies.filter(m => 
    m.movie_id !== heroMovie?.movie_id && 
    m.movie_id !== sideMovie1?.movie_id && 
    m.movie_id !== sideMovie2?.movie_id
  ).slice(0, 8);

  const handleOpenTrailer = (movie: Movie) => {
    setActiveTrailerMovie(movie);
    setIsTrailerOpen(true);
  };

  // Day of week edition label
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayEdition = `${days[new Date().getDay()]} EDITION`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-xs font-mono tracking-widest uppercase text-[#a9a19a] animate-pulse">
          Opening screening room...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#f4eee6]">
      {/* Editorial Lead Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-[29px] font-bold text-[#f4eee6] tracking-[-1px] leading-tight m-0">
            A little cinema for tonight.
          </h1>
          <p className="text-xs sm:text-[13px] text-[#a9a19b] mt-1.5 mb-0">
            Explore films, reviews, and collections chosen by the community.
          </p>
        </div>
        <div className="text-[11px] font-sans font-bold tracking-[1.1px] text-[#a49a92] flex items-center gap-1.5 self-start sm:self-auto">
          <span>{todayEdition}</span>
          <span className="text-[#dd7058]">●</span>
        </div>
      </div>

      {/* Hero Grid Module: Feature Card + 2 Tall Cards */}
      {heroMovie && (
        <section className="grid grid-cols-1 lg:grid-cols-[2.5fr_0.76fr_0.76fr] gap-3.5 lg:h-[370px]">
          {/* Main Landscape Feature Card */}
          <div className="relative rounded-[17px] overflow-hidden border border-[#766252]/40 bg-[#161717] flex flex-col justify-end group shadow-xl p-6 sm:p-8 min-h-[320px] lg:min-h-0">
            {/* Backdrop Artwork */}
            <div className="absolute inset-0 z-0">
              <img
                src={heroMovie.backdrop_url || heroMovie.poster_url}
                alt={heroMovie.title}
                className="w-full h-full object-cover object-right filter contrast-125 saturate-90 opacity-75 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0e0d0df5] via-[#0c0c0ccd] to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14100b] via-[#14100b]/40 to-transparent" />
            </div>

            {/* Feature Copy */}
            <div className="relative z-10 max-w-xl space-y-3">
              <div className="text-[10px] font-sans tracking-[2px] uppercase text-[#e79178] font-bold">
                FILM OF THE MOMENT <span className="text-[#a39589] mx-1">/</span> 01
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-black uppercase text-white tracking-[-2px] leading-none m-0">
                {heroMovie.title}
              </h2>

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#d0c7bd]">
                <span className="font-bold text-[#ffb08d]">
                  ★ {Number(heroMovie.avg_rating || 9.6).toFixed(1)}
                </span>
                <span>•</span>
                <span>{heroMovie.release_date ? new Date(heroMovie.release_date).getFullYear() : '2010'}</span>
                {heroMovie.genres && heroMovie.genres.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{heroMovie.genres.map(g => g.name).slice(0, 2).join(' / ')}</span>
                  </>
                )}
                {heroMovie.runtime && (
                  <>
                    <span>•</span>
                    <span>{heroMovie.runtime} min</span>
                  </>
                )}
              </div>

              {heroMovie.overview && (
                <p className="text-xs sm:text-[13px] text-[#d5cec4] line-clamp-2 leading-[1.5] max-w-md">
                  {heroMovie.overview}
                </p>
              )}

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenTrailer(heroMovie)}
                  className="px-4 py-2.5 rounded-[9px] bg-[#f3ece5] hover:bg-white text-[#161310] text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Watch trailer</span>
                </button>
                <Link
                  href={`/movies/${heroMovie.movie_id}`}
                  className="px-4 py-2.5 rounded-[9px] bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-[#f5f0ea] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>View film →</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Tall Card 1 */}
          {sideMovie1 && (
            <Link
              href={`/movies/${sideMovie1.movie_id}`}
              className="relative rounded-[17px] overflow-hidden border border-[#766252]/40 bg-[#181513] group shadow-lg min-h-[220px] lg:min-h-0 block"
            >
              <img
                src={sideMovie1.poster_url}
                alt={sideMovie1.title}
                className="w-full h-full object-cover filter brightness-[0.78] saturate-[0.88] group-hover:scale-105 group-hover:brightness-95 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070707dc] via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-3.5 right-3.5 z-10">
                <h3 className="text-[15px] font-bold text-white tracking-tight leading-snug mb-1 truncate">
                  {sideMovie1.title}
                </h3>
                <p className="text-[11px] text-[#c8c3bb] m-0 flex items-center gap-1">
                  <span className="text-[#f1ae91] font-semibold">★ {Number(sideMovie1.avg_rating || 9.8).toFixed(1)}</span>
                  <span>·</span>
                  <span>{sideMovie1.genres?.[0]?.name || (sideMovie1.director || 'Cinema')}</span>
                </p>
              </div>
            </Link>
          )}

          {/* Tall Card 2 */}
          {sideMovie2 && (
            <Link
              href={`/movies/${sideMovie2.movie_id}`}
              className="relative rounded-[17px] overflow-hidden border border-[#766252]/40 bg-[#181513] group shadow-lg min-h-[220px] lg:min-h-0 block"
            >
              <img
                src={sideMovie2.poster_url}
                alt={sideMovie2.title}
                className="w-full h-full object-cover filter brightness-[0.78] saturate-[0.88] group-hover:scale-105 group-hover:brightness-95 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070707dc] via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-3.5 right-3.5 z-10">
                <h3 className="text-[15px] font-bold text-white tracking-tight leading-snug mb-1 truncate">
                  {sideMovie2.title}
                </h3>
                <p className="text-[11px] text-[#c8c3bb] m-0 flex items-center gap-1">
                  <span className="text-[#f1ae91] font-semibold">★ {Number(sideMovie2.avg_rating || 9.7).toFixed(1)}</span>
                  <span>·</span>
                  <span>{sideMovie2.genres?.[0]?.name || (sideMovie2.director || 'Cinema')}</span>
                </p>
              </div>
            </Link>
          )}
        </section>
      )}

      {/* Section Heading */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-[#f4eee6] tracking-tight m-0">
          Worth your time <span className="text-[#957a6b] font-normal text-sm"> / Critically loved</span>
        </h2>
        <Link 
          href="/lists"
          className="text-xs font-semibold text-[#efa993] hover:text-white transition-colors"
        >
          Browse all films →
        </Link>
      </div>

      {/* Film Row Shelf */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3.5">
        {shelfMovies.map(movie => (
          <MovieCard key={movie.movie_id} movie={movie} />
        ))}
      </section>

      {/* Dynamic Action / Trace Dock (Appears when genuine recent activity exists) */}
      {recentEvent && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[840px] h-[52px] rounded-[15px] bg-[#2f2826]/90 border border-[#b49b89]/40 shadow-[0_15px_33px_rgba(0,0,0,0.45)] backdrop-blur-xl flex items-center gap-3.5 px-4 py-2 z-40 animate-slide-up">
          {recentEvent.movie_poster && (
            <img 
              src={recentEvent.movie_poster} 
              alt="" 
              className="w-7 h-7 rounded object-cover shrink-0 border border-white/10" 
            />
          )}
          <div className="min-w-0 flex-1 truncate">
            <strong className="text-[11px] text-[#f4eee6] font-bold block truncate">
              {recentEvent.display_name || recentEvent.username} rated {recentEvent.movie_title || 'a film'}
            </strong>
            <em className="text-[10px] text-[#aaa09a] not-italic block truncate">
              A review mutation was committed in PostgreSQL
            </em>
          </div>
          <span className="hidden md:inline-block text-[11px] text-[#b5aaa1] shrink-0">
            See what changed in PostgreSQL
          </span>
          <Link
            href={`/trace?movieId=${recentEvent.target_id || ''}`}
            className="px-3 py-1.5 rounded-[7px] bg-[#dd7058] hover:bg-[#e07f69] text-white text-[11px] font-bold shrink-0 transition-colors shadow-sm"
          >
            Trace action →
          </Link>
        </div>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={activeTrailerMovie?.trailer_url}
        title={activeTrailerMovie?.title || ''}
      />
    </div>
  );
}
