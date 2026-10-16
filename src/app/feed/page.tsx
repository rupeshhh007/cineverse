'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Star, 
  ListOrdered, 
  Clock, 
  Bookmark,
  Heart,
  UserPlus,
  LogIn
} from 'lucide-react';
import { ActivityLog } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import ErrorMessage from '@/components/ErrorMessage';

export default function FeedPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userParam = user ? `&userId=${user.user_id}` : '';
      const res = await fetch(`/api/feed?filter=${filter}${userParam}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load activity feed');
      }
      setActivities(data.activities || []);
    } catch (err: any) {
      setError(err.message || 'Error loading timeline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [filter, user]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-900">
        <div>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-gray-400" /> Community Timeline
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Social Activity Feed
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time events auto-logged via PostgreSQL triggers <code className="text-white font-mono">trg_log_review_activity</code> and <code className="text-white font-mono">trg_log_watchlist_add</code>
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-gray-900 border border-gray-900">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'following'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorMessage message={error} onRetry={fetchFeed} />
        </div>
      )}

      {/* Feed List */}
      <div className="mt-8 space-y-3">
        {filter === 'following' && !user ? (
          <div className="p-12 text-center rounded-3xl bg-gray-900 border border-gray-900 space-y-4">
            <p className="text-sm text-gray-300">Sign in to see activities from members you follow.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          </div>
        ) : isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-900 border border-gray-900 animate-pulse" />
          ))
        ) : activities.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-gray-900 border border-gray-900 space-y-2">
            <p className="text-sm text-gray-400">No activity logged in this stream yet.</p>
            <p className="text-xs text-gray-500">Write a review or follow friends to populate your timeline.</p>
          </div>
        ) : (
          activities.map((act) => {
            const meta = act.metadata || {};
            const isReview = act.activity_type === 'NEW_REVIEW';
            const isList = act.activity_type === 'CREATE_LIST';
            const isWatchlist = act.activity_type === 'WATCHLIST_ADD';
            const isFollow = act.activity_type === 'FOLLOW';
            const isLike = act.activity_type === 'LIKE_REVIEW';

            return (
              <div
                key={act.log_id}
                className="p-4 sm:p-5 rounded-2xl bg-gray-900 border border-gray-900 hover:border-gray-800 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  
                  {/* User Profile */}
                  <div className="flex items-start gap-3">
                    <Link href={`/profile/${act.user_id}`}>
                      <img
                        src={act.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={act.display_name}
                        className="w-9 h-9 rounded-full object-cover border border-gray-800"
                      />
                    </Link>
                    <div>
                      <div className="text-xs text-gray-400">
                        <Link href={`/profile/${act.user_id}`} className="font-semibold text-white hover:text-gray-300 transition-colors">
                          {act.display_name}
                        </Link>
                        <span className="text-gray-500"> (@{act.username}) </span>
                        {isReview && 'reviewed and rated'}
                        {isList && 'created a curated list'}
                        {isWatchlist && 'saved a film to watchlist'}
                        {isFollow && 'started following another cinephile'}
                        {isLike && 'liked a community review'}
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-gray-500 bg-black/50 px-2 py-0.5 rounded border border-gray-800">
                    LOG #{act.log_id}
                  </span>

                </div>

                {/* Content Banner */}
                {isReview && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800">
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      {act.movie_poster && (
                        <img
                          src={act.movie_poster}
                          alt={act.movie_title || ''}
                          className="w-9 h-12 rounded-lg object-cover border border-gray-800 flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/movies/${meta.movie_id || act.target_id}`}
                          className="text-xs font-semibold text-white hover:text-gray-300 transition-colors truncate block"
                        >
                          {act.movie_title || meta.movie_title || 'Film Review'}
                        </Link>
                        {meta.snippet && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 italic mt-0.5">
                            "{meta.snippet}..."
                          </p>
                        )}
                      </div>
                    </div>

                    {meta.rating && (
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-white text-xs font-bold font-mono flex-shrink-0">
                        <Star className="w-3 h-3 fill-current text-white" />
                        <span>{Number(meta.rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                )}

                {isWatchlist && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-white shrink-0">
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-gray-400">Added film to watchlist: </span>
                        <Link
                          href={`/movies/${meta.movie_id || act.target_id}`}
                          className="text-xs font-semibold text-white hover:underline"
                        >
                          {act.movie_title || meta.movie_title || `Film #${act.target_id}`}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {isList && (
                  <div className="p-3 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-white">{meta.list_name || 'Curated Collection'}</span>
                    </div>
                    <Link
                      href={act.target_id ? `/lists/${act.target_id}` : '/lists'}
                      className="text-xs font-semibold text-gray-400 hover:text-white hover:underline"
                    >
                      View List →
                    </Link>
                  </div>
                )}

                {isFollow && (
                  <div className="p-3 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-gray-400">
                        Followed member <span className="text-white font-semibold">#{act.target_id}</span>
                      </span>
                    </div>
                    <Link
                      href={`/profile/${act.target_id}`}
                      className="text-xs font-semibold text-gray-400 hover:text-white hover:underline"
                    >
                      View Profile →
                    </Link>
                  </div>
                )}

                {isLike && (
                  <div className="p-3 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500 fill-current" />
                      <span className="text-xs text-gray-400">Liked review #{act.target_id}</span>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
