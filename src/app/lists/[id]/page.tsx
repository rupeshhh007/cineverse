'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ListOrdered, Heart, Film, ChevronLeft } from 'lucide-react';
import { Watchlist, Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';

export default function SingleListPage() {
  const params = useParams();
  const listId = params.id as string;

  const [list, setList] = useState<Watchlist | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/lists/${listId}`);
        const data = await res.json();
        setList(data.list);
        setMovies(data.movies || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (listId) fetchList();
  }, [listId]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-40 bg-gray-900 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">List Not Found</h1>
        <Link href="/lists" className="text-gray-400 hover:underline text-xs">
          Return to Lists
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      
      <Link
        href="/lists"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-900 text-xs font-semibold text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Lists
      </Link>

      {/* List Header Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gray-900 border border-gray-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ListOrdered className="w-3.5 h-3.5 text-gray-400" /> Curated Watchlist
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{list.name}</h1>
            {list.description && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1.5 max-w-2xl">{list.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-900 border border-gray-900">
            <img
              src={list.owner_avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={list.owner_display_name || ''}
              className="w-9 h-9 rounded-full object-cover border border-gray-800"
            />
            <div>
              <div className="text-xs font-bold text-white">{list.owner_display_name}</div>
              <div className="text-[10px] text-gray-500">@{list.owner_username}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-3 border-t border-gray-900 text-xs text-gray-500">
          <span className="font-mono text-white font-bold">{movies.length} Films</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-gray-400 font-semibold">
            <Heart className="w-3 h-3 fill-current" /> {list.likes_count} Likes
          </span>
          <span>•</span>
          <span>Created on {new Date(list.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Movies in List Grid */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Films in this list</h2>
        {movies.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-gray-900 border border-gray-900">
            <p className="text-xs text-gray-400">No films added to this list yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {movies.map((m) => (
              <MovieCard key={m.movie_id} movie={m} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
