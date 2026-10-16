'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Play, Star, Bookmark, Share2, ChevronLeft } from 'lucide-react';
import { Movie, Person, Review } from '@/lib/types';
import TrailerModal from '@/components/TrailerModal';
import AddToWatchlistModal from '@/components/AddToWatchlistModal';
import RatingModal from '@/components/RatingModal';
import ErrorMessage from '@/components/ErrorMessage';

export default function MovieDetailsPage() {
  const params = useParams();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<Person[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

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
        throw new Error(data.error || 'Failed to load movie details');
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

  const handleReviewAdded = () => {
    fetch(`/api/movies/${movieId}`)
      .then(res => res.json())
      .then(data => {
        if (data.movie) {
          setMovie(data.movie);
          setReviews(data.reviews || []);
        }
      })
      .catch((err) => console.error(err));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <div className="text-white text-xs tracking-widest uppercase font-mono">Loading Film Details...</div>
      </div>
    );
  }

  if (error && !movie) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 space-y-4 max-w-xl mx-auto">
        <ErrorMessage message={error} onRetry={fetchMovieData} />
        <Link href="/" className="text-gray-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Return to Discover
        </Link>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 space-y-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Movie Not Found</h1>
        <p className="text-xs text-gray-500">The requested film ID does not exist in the database catalog.</p>
        <Link href="/" className="text-gray-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Return to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen pb-32">
      {/* Cinematic Hero */}
      <div className="relative w-full h-[70vh] sm:h-[80vh]">
        <div className="absolute inset-0">
          <img
            src={movie.backdrop_url || movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-12 lg:px-24 max-w-[1600px] mx-auto pb-16">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {/* Poster */}
            <div className="hidden md:block w-64 shrink-0 rounded-lg overflow-hidden shadow-2xl relative group">
              <img src={movie.poster_url} alt={movie.title} className="w-full h-auto object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-white">
                {movie.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-300">
                <span className="px-3 py-1 bg-white text-black font-bold rounded-sm">
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                </span>
                <span>{movie.runtime} min</span>
                <span>Directed by {movie.director}</span>
                <div className="flex items-center gap-1.5 text-white bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{Number(movie.avg_rating || 0).toFixed(1)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button 
                  onClick={() => setIsTrailerOpen(true)}
                  className="bg-white text-black px-8 py-4 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  <Play className="w-5 h-5 fill-black" /> Trailer
                </button>
                <button
                  onClick={() => setIsWatchlistOpen(true)}
                  className="bg-gray-900 text-white px-6 py-4 rounded-full font-semibold flex items-center gap-2 border border-gray-800 hover:bg-gray-800 transition-colors"
                >
                  <Bookmark className="w-5 h-5" /> Save
                </button>
                <button
                  onClick={() => setIsRatingOpen(true)}
                  className="bg-gray-900 text-white px-6 py-4 rounded-full font-semibold flex items-center gap-2 border border-gray-800 hover:bg-gray-800 transition-colors"
                >
                  <Star className="w-5 h-5" /> Rate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="px-6 sm:px-12 lg:px-24 max-w-[1600px] mx-auto mt-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-16">
          <section>
            <h2 className="text-xl font-bold tracking-tight text-white mb-4">Synopsis</h2>
            <p className="text-lg text-gray-400 font-light leading-relaxed">
              {movie.overview}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-tight text-white mb-6">Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {cast.map((p: any) => (
                <div key={p.person_id} className="group">
                  <div className="aspect-square rounded-full overflow-hidden bg-gray-900 mb-3">
                    <img 
                      src={p.profile_path || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'} 
                      alt={p.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-white text-sm">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.character_name || p.job_role || p.known_for_department}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight text-white">Reviews</h2>
              <span className="text-sm text-gray-500">{movie.review_count} entries</span>
            </div>
            
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="text-gray-500 font-light">No reviews yet. Be the first to log this film.</div>
              ) : (
                reviews.map((r) => (
                  <div key={r.review_id} className="border-b border-gray-900 pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={r.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                          alt={r.display_name || 'User'} 
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                        <div>
                          <div className="font-medium text-white text-sm">{r.display_name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < Math.floor((r.rating || 0) / 2) ? 'fill-white text-white' : 'text-gray-700'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.has_spoilers ? (
                      <div className="p-4 bg-gray-900 rounded text-sm text-gray-400">
                        This review contains spoilers.
                      </div>
                    ) : (
                      <p className="text-gray-400 font-light text-sm leading-relaxed">
                        {r.review_text}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="p-6 bg-gray-900 rounded-2xl">
            <h3 className="text-sm font-bold tracking-wide text-white uppercase mb-4">Metadata</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Director</span>
                <span className="text-white font-medium">{movie.director}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Release Date</span>
                <span className="text-white font-medium">{movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'TBA'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Runtime</span>
                <span className="text-white font-medium">{movie.runtime} mins</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Language</span>
                <span className="text-white font-medium uppercase">EN</span>
              </div>
            </div>
          </div>
        </div>

      </div>

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
        onSuccess={handleReviewAdded}
      />
    </div>
  );
}
