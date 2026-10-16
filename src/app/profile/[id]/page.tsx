'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  User as UserIcon, 
  Star, 
  Clock, 
  Film, 
  Sparkles, 
  MessageSquare, 
  Heart, 
  Award, 
  UserPlus, 
  UserCheck, 
  ChevronLeft, 
  Loader2, 
  Layers, 
  BarChart3, 
  TrendingUp,
  Bookmark
} from 'lucide-react';
import { User, UserAnalytics, Review } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import { useAuth } from '@/lib/AuthContext';
import ErrorMessage from '@/components/ErrorMessage';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowUpdating, setIsFollowUpdating] = useState(false);

  const isOwnProfile = Boolean(currentUser && currentUser.user_id === parseInt(userId, 10));

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          setUser(null);
          return;
        }
        throw new Error(data.error || 'Failed to load user profile');
      }
      setUser(data.user);
      setAnalytics(data.analytics);
      setReviews(data.reviews || []);
      setRecommendations(data.recommendations || []);
      setFollowersCount(data.analytics?.followers_count || 0);

      // Check follow status
      if (!isOwnProfile && currentUser) {
        const followRes = await fetch(`/api/users/${userId}/follow?currentUserId=${currentUser.user_id}`);
        const followData = await followRes.json();
        setIsFollowing(followData.isFollowing);
        if (followData.followersCount !== undefined) {
          setFollowersCount(followData.followersCount);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchUserProfile();
  }, [userId, currentUser]);

  const handleToggleFollow = async () => {
    if (isOwnProfile) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setIsFollowUpdating(true);

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.user_id }),
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFollowUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse pb-20">
        <div className="h-48 bg-cv-shell rounded-2xl border border-cv-border/30" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-cv-shell rounded-2xl border border-cv-border/30" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="py-20 text-center space-y-4 max-w-xl mx-auto">
        <ErrorMessage message={error} onRetry={fetchUserProfile} />
        <Link href="/" className="text-cv-moss hover:underline text-xs font-mono">
          ← Return to Discover
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center space-y-4 max-w-xl mx-auto">
        <h1 className="text-xl font-serif font-bold text-cv-text">Member Not Found</h1>
        <Link href="/" className="text-cv-moss hover:underline text-xs font-mono">
          ← Return to Discover
        </Link>
      </div>
    );
  }

  const initials = (user.display_name || user.username || 'CV')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const ratingDist = analytics?.rating_distribution || {};
  const maxDistCount = Math.max(1, ...Object.values(ratingDist).map(Number));

  return (
    <div className="space-y-8 pb-24">
      
      {/* Profile Header & Banner */}
      <div className="rounded-2xl bg-cv-shell border border-cv-border/30 overflow-hidden shadow-xl">
        {/* Banner */}
        <div 
          className="h-44 sm:h-52 w-full bg-cover bg-center relative"
          style={{ 
            backgroundImage: `url(${user.banner_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=3270&auto=format&fit=crop'})` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-cv-shell via-black/40 to-black/20" />
        </div>

        {/* Profile Card Body */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative z-10 -mt-14 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            
            {/* Avatar & Names */}
            <div className="flex items-end gap-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-cv-shell shadow-2xl bg-cv-surface"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-cv-surface-2 border-4 border-cv-shell shadow-2xl flex items-center justify-center font-mono text-2xl font-bold text-cv-text">
                  {initials}
                </div>
              )}

              <div className="mb-1">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-cv-text">
                  {user.display_name}
                </h1>
                <div className="text-xs font-mono text-cv-muted">
                  @{user.username}
                </div>
              </div>
            </div>

            {/* Follow Actions & Counters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-cv-surface border border-cv-border/30 text-xs font-mono">
                <div>
                  <span className="font-bold text-cv-text">{followersCount}</span>
                  <span className="text-cv-muted ml-1">Followers</span>
                </div>
                <span className="text-cv-border">•</span>
                <div>
                  <span className="font-bold text-cv-text">{analytics?.following_count || 0}</span>
                  <span className="text-cv-muted ml-1">Following</span>
                </div>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={handleToggleFollow}
                  disabled={isFollowUpdating}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isFollowing
                      ? 'bg-cv-surface hover:bg-cv-danger/20 hover:text-cv-danger hover:border-cv-danger/40 border border-cv-border/40 text-cv-text'
                      : 'bg-cv-moss hover:bg-cv-moss/90 text-cv-ink'
                  }`}
                >
                  {isFollowUpdating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-xs sm:text-sm text-cv-muted max-w-2xl leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* 4 Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-cv-border/20">
            <div className="p-3.5 rounded-xl bg-cv-surface/70 border border-cv-border/30">
              <div className="text-[11px] font-mono uppercase text-cv-muted">Films Logged</div>
              <div className="text-xl font-mono font-bold text-cv-text mt-0.5">
                {analytics?.total_reviews || reviews.length}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cv-surface/70 border border-cv-border/30">
              <div className="text-[11px] font-mono uppercase text-cv-muted">Average Rating</div>
              <div className="text-xl font-mono font-bold text-cv-moss mt-0.5 flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" />
                <span>{analytics?.avg_rating || '—'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cv-surface/70 border border-cv-border/30">
              <div className="text-[11px] font-mono uppercase text-cv-muted">Estimated Runtime</div>
              <div className="text-xl font-mono font-bold text-cv-text mt-0.5">
                {analytics?.total_runtime_hours || 0} hrs
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cv-surface/70 border border-cv-border/30">
              <div className="text-[11px] font-mono uppercase text-cv-muted">Collections</div>
              <div className="text-xl font-mono font-bold text-cv-text mt-0.5">
                {analytics?.total_watchlists || 0}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Analytics & Cinephile Taste (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Favorite Genres Card */}
        <div className="p-6 rounded-2xl bg-cv-shell border border-cv-border/30 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-cv-border/20">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cv-text">
              <TrendingUp className="w-3.5 h-3.5 text-cv-moss" />
              <span>Genre Affinity</span>
            </div>
            <span className="text-[10px] font-mono text-cv-muted">
              v_user_genre_affinity
            </span>
          </div>

          {!analytics?.top_genres || analytics.top_genres.length === 0 ? (
            <p className="text-xs text-cv-muted italic py-4">No genre data logged yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.top_genres.slice(0, 5).map((g) => {
                const count = g.count;
                const pct = Math.min(100, Math.round((count / (analytics.total_reviews || 1)) * 100));
                return (
                  <div key={g.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-cv-text">{g.name}</span>
                      <span className="text-cv-muted">{count} films ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-cv-surface-2 overflow-hidden border border-cv-border/20">
                      <div 
                        className="h-full bg-cv-moss rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 10-Point Rating Distribution Histogram */}
        <div className="p-6 rounded-2xl bg-cv-shell border border-cv-border/30 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-cv-border/20">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cv-text">
              <BarChart3 className="w-3.5 h-3.5 text-cv-moss" />
              <span>Rating Distribution (1–10★)</span>
            </div>
            <span className="text-[10px] font-mono text-cv-muted">
              fn_get_user_analytics
            </span>
          </div>

          <div className="h-32 flex items-end justify-between gap-1.5 pt-4 px-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
              const count = Number(ratingDist[star] || 0);
              const heightPct = count > 0 ? Math.max(15, Math.round((count / maxDistCount) * 100)) : 4;
              return (
                <div key={star} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="w-full flex items-end justify-center h-24">
                    <div
                      className={`w-full rounded-t transition-all ${
                        count > 0 ? 'bg-cv-moss hover:bg-cv-moss/80' : 'bg-cv-surface-2'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`${count} reviews rated ${star}★`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-cv-muted group-hover:text-cv-text">
                    {star}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Recommended Films (fn_recommend_movies) */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cv-moss" />
              <h2 className="text-lg font-serif font-bold text-cv-text">
                Recommended for {user.display_name.split(' ')[0]}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cv-muted">
              Computed via fn_recommend_movies()
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendations.map((movie: any) => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Review History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-cv-text">
            Film Reviews & Ratings ({reviews.length})
          </h2>
          <span className="text-[10px] font-mono text-cv-muted">
            Directly joins reviews & movies
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-cv-shell border border-cv-border/30 space-y-2">
            <p className="text-sm font-serif text-cv-text">No reviews published yet.</p>
            <p className="text-xs text-cv-muted">Ratings submitted by {user.display_name} will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.review_id}
                className="p-5 rounded-2xl bg-cv-shell border border-cv-border/30 hover:border-cv-border/60 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {rev.poster_url && (
                      <img
                        src={rev.poster_url}
                        alt={rev.movie_title || ''}
                        className="w-10 h-14 rounded-lg object-cover border border-cv-border/40 shrink-0 shadow-sm"
                      />
                    )}
                    <div>
                      <Link
                        href={`/movies/${rev.movie_id}`}
                        className="text-sm font-serif font-bold text-cv-text hover:text-cv-moss transition-colors"
                      >
                        {rev.movie_title || `Film #${rev.movie_id}`}
                      </Link>
                      <div className="text-[11px] font-mono text-cv-muted flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-cv-muted/60" />
                        <span>{new Date(rev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-cv-moss/10 border border-cv-moss/30 text-cv-moss text-xs font-bold font-mono">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{Number(rev.rating).toFixed(1)}</span>
                  </div>
                </div>

                {rev.review_text && (
                  <p className="text-xs text-cv-muted/90 leading-relaxed italic bg-cv-surface/50 p-3 rounded-xl border border-cv-border/20">
                    &ldquo;{rev.review_text}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
