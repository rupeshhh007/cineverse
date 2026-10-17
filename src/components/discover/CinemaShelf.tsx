'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  GitBranch, 
  ArrowUpRight, 
  SlidersHorizontal,
  LayoutGrid,
  Layers,
  Film
} from 'lucide-react';
import { Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';

interface CinemaShelfProps {
  movies: Movie[];
  onOpenTrailer: (movie: Movie) => void;
}

export default function CinemaShelf({ movies, onOpenTrailer }: CinemaShelfProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'shelf' | 'grid'>('shelf');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const shelfContainerRef = useRef<HTMLDivElement>(null);

  const selectedMovie = movies[selectedIndex] || movies[0];

  // Keyboard navigation Left/Right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only navigate if not inside an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (viewMode !== 'shelf') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : movies.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < movies.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movies.length, viewMode]);

  // Pointer drag handling for touch & mouse swiping
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    setIsDragging(false);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const diff = dragStartX.current - e.clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Dragged left -> advance
        setSelectedIndex((prev) => (prev < movies.length - 1 ? prev + 1 : 0));
      } else {
        // Dragged right -> back
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : movies.length - 1));
      }
      setIsDragging(true);
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-5 select-none">
      {/* Shelf Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#dd7058] shadow-[0_0_8px_#dd7058]" />
          <h2 className="text-lg font-bold text-[#f4eee6] tracking-tight m-0">
            The Cinema Shelf
          </h2>
          <span className="text-xs font-mono text-[#a99c91]">
            / {movies.length} archived titles
          </span>
        </div>

        {/* Controls: Mode Switcher & Navigation */}
        <div className="flex items-center gap-2">
          {viewMode === 'shelf' && (
            <div className="flex items-center gap-1 bg-[#1a1816] border border-[#54433b] rounded-lg p-1">
              <button
                type="button"
                onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : movies.length - 1))}
                className="w-7 h-7 flex items-center justify-center rounded text-[#a99c91] hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Previous film"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-[#f4eee6] px-2 font-semibold">
                {selectedIndex + 1} / {movies.length}
              </span>
              <button
                type="button"
                onClick={() => setSelectedIndex((prev) => (prev < movies.length - 1 ? prev + 1 : 0))}
                className="w-7 h-7 flex items-center justify-center rounded text-[#a99c91] hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Next film"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Shelf vs Grid View Toggle */}
          <div className="flex items-center bg-[#1a1816] border border-[#54433b] rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('shelf')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'shelf' 
                  ? 'bg-[#dd7058] text-[#140e0c] font-bold shadow-sm' 
                  : 'text-[#a99c91] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3D Shelf</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-[#dd7058] text-[#140e0c] font-bold shadow-sm' 
                  : 'text-[#a99c91] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: 3D INTERACTIVE CINEMA SHELF (Bencho Album Shelf inspired) */}
      {viewMode === 'shelf' ? (
        <div className="space-y-6">
          {/* 3D Perspective Card Carousel Track */}
          <div 
            ref={shelfContainerRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="relative py-6 px-4 bg-gradient-to-b from-[#1b1715]/80 via-[#141211]/90 to-[#100f0e] border border-[#54433b]/60 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            style={{ perspective: '1200px' }}
          >
            {/* Ambient Projector Light Cone Behind Focus */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-[#dd7058]/10 blur-3xl pointer-events-none rounded-full" />

            <div className="flex items-center justify-center gap-3 sm:gap-5 min-h-[260px] sm:min-h-[300px]">
              {movies.map((movie, idx) => {
                const offset = idx - selectedIndex;
                const isSelected = offset === 0;

                // Only render items within window distance of 4 to keep DOM lean & smooth
                if (Math.abs(offset) > 4) return null;

                const rotateY = offset * -14;
                const scale = isSelected ? 1.08 : Math.max(0.78, 1 - Math.abs(offset) * 0.08);
                const opacity = isSelected ? 1 : Math.max(0.4, 0.9 - Math.abs(offset) * 0.18);
                const zIndex = 20 - Math.abs(offset);

                return (
                  <motion.div
                    key={movie.movie_id}
                    layout
                    onClick={() => {
                      if (!isDragging) setSelectedIndex(idx);
                    }}
                    animate={{
                      scale,
                      opacity,
                      rotateY,
                      z: isSelected ? 80 : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 280,
                      damping: 24,
                    }}
                    className={`relative w-[130px] sm:w-[160px] md:w-[180px] aspect-[2/3] shrink-0 rounded-xl overflow-hidden cursor-pointer transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-[#dd7058] shadow-[0_18px_45px_rgba(221,112,88,0.25)]'
                        : 'border border-[#54433b]/40 hover:border-white/30'
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      zIndex,
                    }}
                  >
                    {/* Poster Image */}
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover filter contrast-110"
                      loading="lazy"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                    {/* Badge & Quick Info on Poster */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-none">
                      <div className="text-[12px] sm:text-[13px] font-bold text-white truncate leading-tight">
                        {movie.title}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#cfc2b6] mt-0.5 font-mono">
                        <span className="text-[#dd7058] font-bold">
                          ★ {Number(movie.avg_rating || 0).toFixed(1)}
                        </span>
                        <span>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'Cinema'}</span>
                      </div>
                    </div>

                    {/* Focus Marker */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#dd7058] text-[#140e0c] text-[9px] font-mono font-black tracking-wider uppercase shadow-md">
                        ACTIVE
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Instruction footnote */}
            <div className="text-center pt-2 text-[10px] font-mono text-[#8c7f73] flex items-center justify-center gap-2">
              <span>Drag / Swipe</span>
              <span>•</span>
              <span>Use ← → Arrow Keys</span>
              <span>•</span>
              <span>Click to Focus</span>
            </div>
          </div>

          {/* ACTIVE FILM PREVIEW CONSOLE */}
          {selectedMovie && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMovie.movie_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-5 sm:p-7 rounded-2xl bg-[#171615] border border-[#54433b] shadow-xl relative overflow-hidden"
              >
                {/* Background Artwork Watermark */}
                <div className="absolute top-0 right-0 w-2/3 h-full opacity-10 pointer-events-none overflow-hidden">
                  <img
                    src={selectedMovie.backdrop_url || selectedMovie.poster_url}
                    alt=""
                    className="w-full h-full object-cover object-right filter blur-sm"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#171615]/80 to-[#171615]" />
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Essential Meta & Ratings */}
                  <div className="md:col-span-8 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#dd7058]/15 border border-[#dd7058]/30 text-[#dd7058] font-bold">
                        SELECTED SCREENING
                      </span>
                      {selectedMovie.genres && selectedMovie.genres.length > 0 && (
                        <span className="text-[11px] font-mono text-[#a99c91]">
                          {selectedMovie.genres.map((g) => g.name).join(' • ')}
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight m-0">
                      {selectedMovie.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#cfc2b6] font-mono">
                      <div className="flex items-center gap-1 text-[#dd7058] font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{Number(selectedMovie.avg_rating || 0).toFixed(1)} / 10</span>
                      </div>
                      <span>•</span>
                      <span>{selectedMovie.review_count || 0} reviews</span>
                      <span>•</span>
                      <span>{selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : '2010'}</span>
                      {selectedMovie.runtime && (
                        <>
                          <span>•</span>
                          <span>{selectedMovie.runtime} min</span>
                        </>
                      )}
                      {selectedMovie.director && (
                        <>
                          <span>•</span>
                          <span>Dir. {selectedMovie.director}</span>
                        </>
                      )}
                    </div>

                    {selectedMovie.overview && (
                      <p className="text-xs sm:text-sm text-[#d5cec4] leading-relaxed max-w-2xl">
                        {selectedMovie.overview}
                      </p>
                    )}

                    {/* Interactive CTAs */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <Link
                        href={`/movies/${selectedMovie.movie_id}`}
                        className="px-4 py-2.5 rounded-xl bg-[#dd7058] hover:bg-[#e47d66] text-[#16100e] text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>View Film Archive →</span>
                      </Link>

                      <Link
                        href={`/countercut?movieId=${selectedMovie.movie_id}`}
                        className="px-4 py-2.5 rounded-xl bg-[#221f1c] hover:bg-[#2b2723] border border-[#54433b] hover:border-[#dd7058] text-[#f4eee6] text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#dd7058]" />
                        <span>Investigate in Countercut</span>
                      </Link>

                      <Link
                        href={`/trace?movieId=${selectedMovie.movie_id}`}
                        className="px-4 py-2.5 rounded-xl bg-[#221f1c] hover:bg-[#2b2723] border border-[#54433b] hover:border-emerald-500/50 text-[#f4eee6] text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                        <span>CineTrace Mutation</span>
                      </Link>

                      {selectedMovie.trailer_url && (
                        <button
                          type="button"
                          onClick={() => onOpenTrailer(selectedMovie)}
                          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Trailer</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Database Provenance Facts */}
                  <div className="md:col-span-4 p-4 rounded-xl bg-[#201d1a] border border-[#54433b]/80 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#dd7058] font-bold">
                      DATABASE PROVENANCE
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-[#a99c91]">Internal Movie ID</span>
                        <span className="font-mono text-white">#{selectedMovie.movie_id}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-[#a99c91]">Trigger-Cached Avg</span>
                        <span className="font-mono text-[#dd7058] font-bold">
                          {Number(selectedMovie.avg_rating || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-[#a99c91]">Review Audit Total</span>
                        <span className="font-mono text-white">
                          {selectedMovie.review_count || 0} rows
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-[#a99c91]">Bayesian Prior Status</span>
                        <span className="font-mono text-emerald-400">ACTIVE IN VIEW</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      ) : (
        /* VIEW MODE 2: CLASSIC EXPANDED POSTER GRID */
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3.5">
          {movies.map((movie) => (
            <MovieCard key={movie.movie_id} movie={movie} />
          ))}
        </section>
      )}
    </div>
  );
}
