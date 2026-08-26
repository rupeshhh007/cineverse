'use client';

import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Movie } from '@/lib/types';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [imgSrc, setImgSrc] = React.useState(movie.poster_url);

  return (
    <Link href={`/movies/${movie.movie_id}`} className="group flex flex-col space-y-3">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-900 rounded-lg">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={movie.title}
            onError={() => setImgSrc(`https://placehold.co/600x900/111111/FFFFFF/png?text=${encodeURIComponent(movie.title)}&font=montserrat`)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold uppercase tracking-widest text-xs">
            No Image
          </div>
        )}
        
        {/* Overlay that appears on hover (very subtle) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white tracking-tight truncate group-hover:text-gray-300 transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}</span>
          <div className="flex items-center gap-1 font-medium">
            <Star className="w-3 h-3 fill-current" />
            <span>{Number(movie.avg_rating || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
