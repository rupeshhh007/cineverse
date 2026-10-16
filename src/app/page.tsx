'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, ArrowUpRight, Star, ChevronDown, Database, Activity } from 'lucide-react';
import { Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import TrailerModal from '@/components/TrailerModal';

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<Movie | null>(null);
  const [sortBy, setSortBy] = useState<'trending' | 'rating' | 'release_date'>('trending');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`/api/movies?sortBy=${sortBy}&limit=30`);
        const data = await res.json();
        if (data.movies && data.movies.length > 0) {
          setMovies(data.movies);
        }
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [sortBy]);

  const heroMovie = movies[0] || null;
  const sideMovie1 = movies[1] || null;
  const sideMovie2 = movies[2] || null;
  const railMovies = movies.slice(0, 18);

  const handleOpenTrailer = (movie: Movie) => {
    setActiveTrailerMovie(movie);
    setIsTrailerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-xs font-mono tracking-widest uppercase text-[#8d9c87] animate-pulse">
          Opening screening room...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-[#efece3]">
      {/* Editorial Headline Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#a9cc92] font-semibold mb-1">
            Your Personal Cinema
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#efece3] tracking-tight">
            A good film stays with you.
          </h1>
        </div>
        <Link
          href="/lists"
          className="text-xs font-mono text-[#aeb9a8] hover:text-[#efece3] flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>Handpicked from the Cineverse archive</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Hero Module (Feature Card + Two Tall Portrait Cards) */}
      {heroMovie && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Main Feature Card (8 Cols) */}
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-[#3e4c3a]/60 bg-[#182117] min-h-[380px] sm:min-h-[420px] p-6 sm:p-9 flex flex-col justify-end group shadow-xl">
            {/* Backdrop Artwork */}
            <div className="absolute inset-0 z-0">
              <img
                src={heroMovie.backdrop_url || heroMovie.poster_url}
                alt={heroMovie.title}
                className="w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10160f] via-[#10160f]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#10160f]/90 via-[#10160f]/40 to-transparent" />
            </div>

            {/* Feature Content */}
            <div className="relative z-10 space-y-4 max-w-2xl">
              <div className="text-[11px] font-mono tracking-widest uppercase text-[#aeb9a8] font-semibold">
                FEATURED FILM &nbsp;/&nbsp; {heroMovie.genres?.[0]?.name ? heroMovie.genres[0].name.toUpperCase() : (heroMovie.director ? heroMovie.director.toUpperCase() : 'CINEMA')}
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#efece3] tracking-tight leading-none">
                {heroMovie.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#aeb9a8] font-mono">
                <span className="flex items-center gap-1 text-[#a9cc92] font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{Number(heroMovie.avg_rating || 9.5).toFixed(1)} community score</span>
                </span>
                <span>•</span>
                <span>{heroMovie.release_date ? new Date(heroMovie.release_date).getFullYear() : '2024'}</span>
                {heroMovie.genres && heroMovie.genres.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{heroMovie.genres.map(g => g.name).slice(0, 2).join(' · ')}</span>
                  </>
                )}
              </div>

              {heroMovie.overview && (
                <p className="text-xs sm:text-sm text-[#c0ceba] line-clamp-2 leading-relaxed max-w-xl">
                  {heroMovie.overview}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenTrailer(heroMovie)}
                  className="px-5 py-2.5 rounded-full bg-[#efece3] hover:bg-white text-[#152016] text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Watch trailer</span>
                </button>

                <Link
                  href={`/movies/${heroMovie.movie_id}`}
                  className="px-5 py-2.5 rounded-full bg-[#202b1e]/80 hover:bg-[#2a3827] text-[#efece3] border border-[#3e4c3a] text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <span>Film details</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#aeb9a8]" />
                </Link>
              </div>
            </div>
          </div>

          {/* Tall Portrait Card 1 (2 Cols) */}
          {sideMovie1 && (
            <Link
              href={`/movies/${sideMovie1.movie_id}`}
              className="lg:col-span-2 hidden lg:flex flex-col justify-end relative rounded-3xl overflow-hidden border border-[#3e4c3a]/60 bg-[#182117] p-5 group hover:border-[#53644f] transition-all shadow-xl"
            >
              <img
                src={sideMovie1.poster_url || sideMovie1.backdrop_url}
                alt={sideMovie1.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10160f] via-[#10160f]/40 to-transparent" />
              
              <div className="relative z-10 space-y-1">
                <h3 className="text-sm font-bold tracking-tight text-[#efece3] group-hover:text-white uppercase truncate font-sans">
                  {sideMovie1.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#aeb9a8]">
                  <span className="text-[#a9cc92] flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{Number(sideMovie1.avg_rating || 0).toFixed(1)}</span>
                  </span>
                  <span>·</span>
                  <span>{sideMovie1.genres?.[0]?.name || 'Film'}</span>
                </div>
              </div>
            </Link>
          )}

          {/* Tall Portrait Card 2 (2 Cols) */}
          {sideMovie2 && (
            <Link
              href={`/movies/${sideMovie2.movie_id}`}
              className="lg:col-span-2 hidden lg:flex flex-col justify-end relative rounded-3xl overflow-hidden border border-[#3e4c3a]/60 bg-[#182117] p-5 group hover:border-[#53644f] transition-all shadow-xl"
            >
              <img
                src={sideMovie2.poster_url || sideMovie2.backdrop_url}
                alt={sideMovie2.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10160f] via-[#10160f]/40 to-transparent" />
              
              <div className="relative z-10 space-y-1">
                <h3 className="text-sm font-bold tracking-tight text-[#efece3] group-hover:text-white uppercase truncate font-sans">
                  {sideMovie2.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#aeb9a8]">
                  <span className="text-[#a9cc92] flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{Number(sideMovie2.avg_rating || 0).toFixed(1)}</span>
                  </span>
                  <span>·</span>
                  <span>{sideMovie2.genres?.[0]?.name || 'Film'}</span>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Rail Section: New & Noteworthy */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-[#2a3526]/40 pb-3">
          <h3 className="text-base font-serif font-bold text-[#efece3]">
            New &amp; noteworthy
          </h3>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs text-[#8d9c87]">
              Sort:
            </label>
            <div className="relative">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-[#1a2318] border border-[#374533] text-xs text-[#efece3] rounded-xl px-3 py-1.5 pr-7 focus:outline-none focus:border-[#52634d] cursor-pointer"
              >
                <option value="trending">trending</option>
                <option value="rating">highest rated</option>
                <option value="release_date">release date</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8d9c87] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Poster Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {railMovies.map((movie) => (
            <MovieCard key={movie.movie_id} movie={movie} />
          ))}
        </div>
      </div>

      {/* The Community Cut Banner Callout */}
      <div className="p-5 rounded-2xl bg-[#1d261c] border border-[#344230] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="text-[10px] font-mono text-[#a9cc92] uppercase tracking-widest font-semibold mb-1">
            The Community Cut
          </div>
          <p className="text-xs text-[#aeb9a8]">
            Because great films deserve great conversations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/feed"
            className="px-4 py-2 rounded-xl bg-[#253023] hover:bg-[#2f3d2c] border border-[#3d4c39] text-[#efece3] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-[#aeb9a8]" />
            <span>Explore activity</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#8d9c87]" />
          </Link>

          <Link
            href="/dbms-console"
            className="px-4 py-2 rounded-xl bg-[#253023] hover:bg-[#2f3d2c] border border-[#3d4c39] text-[#efece3] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-[#a9cc92]" />
            <span>DBMS INSPECTOR</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#8d9c87]" />
          </Link>
        </div>
      </div>

      {/* Trailer Modal */}
      {activeTrailerMovie && (
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={() => {
            setIsTrailerOpen(false);
            setActiveTrailerMovie(null);
          }}
          trailerUrl={activeTrailerMovie.trailer_url}
          title={activeTrailerMovie.title}
        />
      )}
    </div>
  );
}
