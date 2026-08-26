'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, ArrowRight, Star } from 'lucide-react';
import { Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import TrailerModal from '@/components/TrailerModal';

export default function Home() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch('/api/movies');
        const data = await res.json();
        
        if (data.movies && data.movies.length > 0) {
          setTrendingMovies(data.movies);
          setHeroMovie(data.movies[0]); // First movie as hero
        }
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm tracking-widest uppercase">Loading...</div>;
  }

  return (
    <div className="bg-black min-h-screen selection:bg-white selection:text-black pb-32">
      {/* Hero Section - Apple/Netflix Style */}
      {heroMovie && (
        <div className="relative h-[85vh] w-full flex items-end pb-24 group">
          <div className="absolute inset-0">
            <img 
              src={heroMovie.backdrop_url || heroMovie.poster_url} 
              alt={heroMovie.title}
              onError={(e) => { e.currentTarget.src = `https://placehold.co/1920x1080/111111/FFFFFF/png?text=${encodeURIComponent(heroMovie.title)}&font=montserrat`; }}
              className="w-full h-full object-cover opacity-60 transition-opacity duration-700"
            />
            {/* Smooth fade to black at the bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent" />
          </div>

          <div className="relative z-10 px-6 sm:px-12 lg:px-24 w-full max-w-7xl mx-auto flex flex-col items-start space-y-6 animate-slide-up">
            <div className="flex items-center gap-3 text-xs tracking-widest uppercase font-semibold text-gray-300">
              <span className="bg-white text-black px-2 py-1 font-bold">{heroMovie.release_date ? new Date(heroMovie.release_date).getFullYear() : 'NEW'}</span>
              <span>{heroMovie.director}</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-white leading-[0.9]">
              {heroMovie.title}
            </h1>
            
            <p className="max-w-2xl text-lg sm:text-xl text-gray-400 font-light leading-relaxed">
              {heroMovie.overview}
            </p>

            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={() => setIsTrailerOpen(true)}
                className="bg-white text-black px-8 py-4 rounded-full font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Play className="w-5 h-5 fill-black" /> Watch Trailer
              </button>
              <Link 
                href={`/movies/${heroMovie.movie_id}`}
                className="bg-gray-900/50 backdrop-blur-md border border-gray-800 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors"
              >
                Details
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Trending Section */}
      <div className="px-6 sm:px-12 lg:px-24 max-w-[1600px] mx-auto mt-12">
        <div className="flex items-end justify-between mb-8 border-b border-gray-900 pb-4">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Trending Now
          </h2>
          <Link href="/feed" className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
          {trendingMovies.slice(1).map(movie => (
            <MovieCard key={movie.movie_id} movie={movie} />
          ))}
        </div>
      </div>

      {heroMovie && (
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          trailerUrl={heroMovie.trailer_url}
          title={heroMovie.title}
        />
      )}
    </div>
  );
}
