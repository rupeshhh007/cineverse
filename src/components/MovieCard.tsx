'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Film } from 'lucide-react';
import { Movie } from '@/lib/types';

interface MovieCardProps {
  movie: Movie;
  priority?: boolean;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [imgSrc, setImgSrc] = useState(movie.poster_url);
  const [hasError, setHasError] = useState(false);

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '—';
  const rating = Number(movie.avg_rating || 0);

  return (
    <Link 
      href={`/movies/${movie.movie_id}`} 
      className="group flex flex-col space-y-2 select-none"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#161d15] rounded-2xl border border-[#374433] shadow-md group-hover:border-[#53644f] transition-all duration-300">
        {!hasError && imgSrc ? (
          <img
            src={imgSrc}
            alt={movie.title}
            onError={() => {
              setHasError(true);
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[#73836f] bg-[#1a2218]">
            <Film className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs font-semibold line-clamp-2 text-[#aeb9a8]">{movie.title}</span>
          </div>
        )}

        {/* Small C• Logo Watermark Badge in Top Left */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono font-bold text-white shadow-sm">
          <span>C</span>
          <span className="w-1 h-1 rounded-full bg-[#f2685e] inline-block" />
        </div>

        {/* Hover vignette */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* Metadata Underneath */}
      <div className="space-y-0.5 px-0.5">
        <h4 className="text-xs font-semibold text-[#efece3] group-hover:text-white truncate tracking-tight transition-colors">
          {movie.title}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-[#8d9c87]">
          <span>{year}</span>
          {rating > 0 ? (
            <div className="flex items-center gap-1 font-mono text-[#a9cc92] font-medium">
              <Star className="w-3 h-3 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
          ) : (
            <span className="font-mono text-[#687664]">—</span>
          )}
        </div>
      </div>
    </Link>
  );
}
