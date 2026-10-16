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
  LogIn,
  Users,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { ActivityLog } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import ErrorMessage from '@/components/ErrorMessage';

const FEATURED_CINEPHILES = [
  { id: 1, name: 'Alex Rivera', username: 'alex', initials: 'AR', role: 'Filmmaker & Cinephile', films: 3 },
  { id: 2, name: 'Sophia Chen', username: 'sophia', initials: 'SC', role: 'Film Critic', films: 4 },
  { id: 3, name: 'Marcus Vance', username: 'marcus', initials: 'MV', role: 'Screenwriter', films: 2 },
];

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

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-cv-shell border border-cv-border/30 shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-cv-muted text-[11px] font-mono uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 text-cv-moss" /> The Screening Journal
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-cv-text mt-1">
            Activity Feed
          </h1>
          <p className="text-xs text-cv-muted mt-1 max-w-xl">
            Real-time cinephile activity, logged and synchronized through PostgreSQL event triggers <code className="text-cv-moss font-mono">trg_log_review_activity</code> and <code className="text-cv-moss font-mono">trg_log_watchlist_add</code>.
          </p>
        </div>

        {/* Filter Pill Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-cv-surface border border-cv-border/40 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-cv-moss text-cv-ink font-bold shadow-sm'
                : 'text-cv-muted hover:text-cv-text'
            }`}
          >
            All activity
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'following'
                ? 'bg-cv-moss text-cv-ink font-bold shadow-sm'
                : 'text-cv-muted hover:text-cv-text'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={fetchFeed} />
      )}

      {/* 2-Column Layout: Main Feed (Col 8) + Sidebar (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-4">
          {filter === 'following' && !user ? (
            <div className="p-12 text-center rounded-2xl bg-cv-shell border border-cv-border/30 space-y-4">
              <p className="text-sm text-cv-muted">Sign in to see activities from cinephiles you follow.</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cv-moss text-cv-ink font-bold text-xs hover:bg-cv-moss/90 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            </div>
          ) : isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-cv-shell border border-cv-border/30 animate-pulse" />
            ))
          ) : activities.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-cv-shell border border-cv-border/30 space-y-2">
              <p className="text-sm text-cv-text font-serif">No activity logged in this stream yet.</p>
              <p className="text-xs text-cv-muted">Rate a film or follow friends to populate your timeline.</p>
            </div>
          ) : (
            activities.map((act) => {
              const meta = act.metadata || {};
              const isReview = act.activity_type === 'NEW_REVIEW';
              const isList = act.activity_type === 'CREATE_LIST';
              const isWatchlist = act.activity_type === 'WATCHLIST_ADD';
              const isFollow = act.activity_type === 'FOLLOW';
              const isLike = act.activity_type === 'LIKE_REVIEW';

              const initials = (act.display_name || act.username || 'CV')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={act.log_id}
                  className="p-5 rounded-2xl bg-cv-shell border border-cv-border/30 hover:border-cv-border/60 transition-colors space-y-3.5 shadow-sm"
                >
                  {/* Top Bar: User + Action Header + Log Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${act.user_id}`} className="shrink-0">
                        {act.avatar_url ? (
                          <img
                            src={act.avatar_url}
                            alt={act.display_name}
                            className="w-10 h-10 rounded-full object-cover border border-cv-border/40"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-cv-surface border border-cv-border/40 flex items-center justify-center font-mono text-xs font-bold text-cv-text">
                            {initials}
                          </div>
                        )}
                      </Link>

                      <div>
                        <div className="text-xs text-cv-muted">
                          <Link 
                            href={`/profile/${act.user_id}`} 
                            className="font-bold text-cv-text hover:text-cv-moss transition-colors"
                          >
                            {act.display_name}
                          </Link>
                          <span className="text-cv-muted/70"> @{act.username} </span>
                          <span className="text-cv-text/90">
                            {isReview && 'reviewed and rated'}
                            {isList && 'created a curated list'}
                            {isWatchlist && 'saved a film to watchlist'}
                            {isFollow && 'followed another cinephile'}
                            {isLike && 'liked a community review'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[11px] text-cv-muted/70 mt-0.5 font-mono">
                          <Clock className="w-3 h-3 text-cv-muted/50" />
                          <span>{formatRelativeTime(act.created_at)}</span>
                          <span>•</span>
                          <span>{new Date(act.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-cv-muted bg-cv-surface px-2.5 py-1 rounded-lg border border-cv-border/30 shrink-0">
                      LOG #{act.log_id}
                    </span>
                  </div>

                  {/* Body Content by Event Type */}
                  {isReview && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-cv-surface/70 border border-cv-border/40 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {act.movie_poster && (
                          <img
                            src={act.movie_poster}
                            alt={act.movie_title || ''}
                            className="w-12 h-16 rounded-lg object-cover border border-cv-border/40 shrink-0 shadow-sm"
                          />
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/movies/${meta.movie_id || act.target_id}`}
                            className="text-sm font-serif font-bold text-cv-text hover:text-cv-moss transition-colors truncate block"
                          >
                            {act.movie_title || meta.movie_title || 'Film Review'}
                          </Link>
                          {meta.snippet ? (
                            <p className="text-xs text-cv-muted/90 line-clamp-2 italic mt-1 leading-relaxed">
                              &ldquo;{meta.snippet}&rdquo;
                            </p>
                          ) : (
                            <p className="text-xs text-cv-muted/70 italic mt-0.5">
                              Rating recorded via PostgreSQL trigger.
                            </p>
                          )}
                        </div>
                      </div>

                      {meta.rating && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-cv-moss/10 border border-cv-moss/30 text-cv-moss text-xs font-bold font-mono shrink-0">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{Number(meta.rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isWatchlist && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-cv-surface/70 border border-cv-border/40">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-cv-surface-2 border border-cv-border/40 flex items-center justify-center text-cv-moss shrink-0">
                          <Bookmark className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-cv-muted">Saved to watchlist: </span>
                          <Link
                            href={`/movies/${meta.movie_id || act.target_id}`}
                            className="text-xs font-bold text-cv-text hover:text-cv-moss block truncate"
                          >
                            {act.movie_title || meta.movie_title || `Film #${act.target_id}`}
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {isList && (
                    <div className="p-3.5 rounded-xl bg-cv-surface/70 border border-cv-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cv-surface-2 border border-cv-border/40 flex items-center justify-center text-cv-moss shrink-0">
                          <ListOrdered className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-cv-muted">New Curated Collection</div>
                          <span className="text-xs font-bold text-cv-text">
                            {meta.list_name || 'Curated Collection'}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={act.target_id ? `/lists/${act.target_id}` : '/lists'}
                        className="text-xs font-bold text-cv-moss hover:underline flex items-center gap-1"
                      >
                        <span>View list</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {isFollow && (
                    <div className="p-3.5 rounded-xl bg-cv-surface/70 border border-cv-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-cv-muted">
                        <UserPlus className="w-4 h-4 text-cv-moss" />
                        <span>
                          Connected with cinephile <span className="text-cv-text font-bold">#{act.target_id}</span>
                        </span>
                      </div>
                      <Link
                        href={`/profile/${act.target_id}`}
                        className="text-xs font-bold text-cv-moss hover:underline flex items-center gap-1"
                      >
                        <span>Profile</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {isLike && (
                    <div className="p-3.5 rounded-xl bg-cv-surface/70 border border-cv-border/40 flex items-center justify-between text-xs text-cv-muted">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-cv-danger fill-current" />
                        <span>Upvoted community review #{act.target_id}</span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: Your Circle */}
          <div className="p-5 rounded-2xl bg-cv-shell border border-cv-border/30 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-cv-border/20">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cv-text">
                <Users className="w-3.5 h-3.5 text-cv-moss" />
                <span>Your Circle</span>
              </div>
              <span className="text-[10px] font-mono text-cv-muted">Active critics</span>
            </div>

            <div className="space-y-3">
              {FEATURED_CINEPHILES.map((person) => (
                <div key={person.id} className="flex items-center justify-between p-2.5 rounded-xl bg-cv-surface/50 border border-cv-border/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-cv-surface-2 border border-cv-border/40 flex items-center justify-center font-mono text-[11px] font-bold text-cv-text shrink-0">
                      {person.initials}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/profile/${person.id}`} className="text-xs font-bold text-cv-text hover:text-cv-moss block truncate">
                        {person.name}
                      </Link>
                      <div className="text-[10px] text-cv-muted truncate">
                        {person.role}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/profile/${person.id}`}
                    className="text-[11px] font-mono text-cv-moss hover:underline shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: How The Feed Works */}
          <div className="p-5 rounded-2xl bg-cv-shell border border-cv-border/30 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cv-text pb-2 border-b border-cv-border/20">
              <Database className="w-3.5 h-3.5 text-cv-moss" />
              <span>How The Feed Works</span>
            </div>

            <p className="text-xs text-cv-muted leading-relaxed">
              Every card in this timeline is an immutable event stored in the PostgreSQL <code className="text-cv-text font-mono">activity_logs</code> table.
            </p>

            <div className="p-3 rounded-xl bg-cv-surface-2 border border-cv-border/30 space-y-2 text-[11px] font-mono text-cv-muted">
              <div>
                <strong className="text-cv-moss">trg_log_review_activity</strong>
                <div className="text-cv-muted/80 text-[10px]">Fired on reviews INSERT/UPDATE</div>
              </div>
              <div>
                <strong className="text-cv-moss">trg_log_watchlist_add</strong>
                <div className="text-cv-muted/80 text-[10px]">Fired on watchlist_items INSERT</div>
              </div>
            </div>

            <p className="text-[11px] text-cv-muted/80">
              Zero client-side simulation. Query results directly reflect database state.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
