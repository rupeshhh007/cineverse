'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Star, 
  ListOrdered, 
  Clock, 
  Bookmark,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { ActivityLog } from '@/lib/types';

export default function FeedPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = typeof window !== 'undefined'
    ? parseInt(localStorage.getItem('cineverse_current_user') || '1', 10)
    : 1;

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/feed?filter=${filter}&userId=${currentUserId}`);
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [filter]);

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
            Real-time events auto-logged via PostgreSQL trigger <code className="text-white font-mono">trg_log_review_activity</code>
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-gray-900 border border-gray-900">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-black'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'following'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-black'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="mt-8 space-y-3">
        {isLoading ? (
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
                        <Link href={`/profile/${act.user_id}`} className="font-semibold text-white hover:text-gray-400 transition-colors">
                          {act.display_name}
                        </Link>
                        <span className="text-gray-500"> (@{act.username}) </span>
                        {isReview && 'reviewed and rated'}
                        {isList && 'created a curated list'}
                        {isWatchlist && 'added to watchlist'}
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-900">
                    LOG #{act.log_id}
                  </span>

                </div>

                {/* Content Banner */}
                {isReview && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-900">
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
                          className="text-xs font-semibold text-white hover:text-gray-400 transition-colors truncate block"
                        >
                          {act.movie_title || meta.movie_title}
                        </Link>
                        {meta.snippet && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 italic mt-0.5">
                            "{meta.snippet}..."
                          </p>
                        )}
                      </div>
                    </div>

                    {meta.rating && (
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-800 border border-gray-800 text-white text-xs font-bold font-mono flex-shrink-0">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{Number(meta.rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                )}

                {isList && (
                  <div className="p-3 rounded-xl bg-gray-900 border border-gray-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-white">{meta.list_name}</span>
                    </div>
                    <Link
                      href="/lists"
                      className="text-xs font-semibold text-gray-400 hover:underline"
                    >
                      View Lists →
                    </Link>
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
