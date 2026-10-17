'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Star, 
  Film, 
  UserPlus, 
  UserCheck, 
  ChevronLeft, 
  Loader2, 
  BarChart3, 
  Bookmark,
  GitBranch,
  Split
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
  const [filterRating, setFilterRating] = useState<number | null>(null);
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
      if (data.isFollowing !== undefined) {
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
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-xs font-mono tracking-widest uppercase text-[#a9a19a] animate-pulse">
          Opening member archive...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="py-20 text-center space-y-4 max-w-xl mx-auto text-[#f4eee6]">
        <h1 className="text-xl font-bold text-white">Member Not Found</h1>
        <Link href="/" className="text-[#dd7058] hover:underline text-xs font-bold">
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
    <div className="space-y-6 animate-fade-in text-[#f4eee6]">
      {/* Profile Header & Banner */}
      <div className="rounded-2xl bg-[#171615] border border-[#54433b]/40 overflow-hidden shadow-lg">
        {/* Banner */}
        <div 
          className="h-40 sm:h-48 w-full bg-cover bg-center relative"
          style={{ 
            backgroundImage: `url(${user.banner_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200'})` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#171615] via-black/40 to-transparent" />
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative z-10 -mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Avatar & Names */}
            <div className="flex items-end gap-3.5">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-[#171615] shadow-xl bg-black"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#785e4b] border-4 border-[#171615] shadow-xl flex items-center justify-center font-bold text-xl text-white">
                  {initials}
                </div>
              )}

              <div className="mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-[-1px] m-0">
                  {user.display_name}
                </h1>
                <div className="text-xs text-[#a99c91]">
                  @{user.username}
                </div>
              </div>
            </div>

            {/* Follow Actions & Counters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-black/30 border border-white/5 text-xs font-mono">
                <div>
                  <span className="font-bold text-white">{followersCount}</span>
                  <span className="text-[#a99c91] ml-1">Followers</span>
                </div>
                <span className="text-[#54433b]">·</span>
                <div>
                  <span className="font-bold text-white">{analytics?.following_count || 0}</span>
                  <span className="text-[#a99c91] ml-1">Following</span>
                </div>
              </div>

              {isOwnProfile && (
                <Link
                  href="/countercut"
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm bg-[#dd7058] hover:bg-[#e47d66] text-[#161310]"
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>Explore My Taste in Countercut →</span>
                </Link>
              )}

              {!isOwnProfile && (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={isFollowUpdating}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isFollowing
                      ? 'bg-white/[0.06] border border-white/10 text-white'
                      : 'bg-[#eee7dd] hover:bg-white text-[#161310]'
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
            <p className="text-xs sm:text-[13px] text-[#d5cec4] max-w-2xl leading-relaxed m-0">
              {user.bio}
            </p>
          )}

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.08]">
            <div className="p-3 rounded-xl bg-black/25 border border-white/[0.04]">
              <div className="text-[10px] uppercase tracking-wider text-[#a99c91]">Films Reviewed</div>
              <div className="text-xl font-black text-white mt-0.5">
                {analytics?.total_reviews || reviews.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/25 border border-white/[0.04]">
              <div className="text-[10px] uppercase tracking-wider text-[#a99c91]">Mean Score</div>
              <div className="text-xl font-black text-[#ffb08d] mt-0.5">
                ★ {analytics?.avg_rating || '—'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/25 border border-white/[0.04]">
              <div className="text-[10px] uppercase tracking-wider text-[#a99c91]">Watch Time</div>
              <div className="text-xl font-black text-white mt-0.5">
                {analytics?.total_runtime_hours || 0} hrs
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black/25 border border-white/[0.04]">
              <div className="text-[10px] uppercase tracking-wider text-[#a99c91]">Collections</div>
              <div className="text-xl font-black text-white mt-0.5">
                {analytics?.total_watchlists || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: Film Taste / Rating Histogram | Activity & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Rating Histogram & Top Genres (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#171615] border border-[#54433b]/40 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight m-0">
                  Rating Distribution (1-10)
                </h2>
                <p className="text-[10px] text-[#a99c91] mt-0.5 mb-0">
                  Click any score to filter reviews
                </p>
              </div>
              {filterRating !== null ? (
                <button
                  type="button"
                  onClick={() => setFilterRating(null)}
                  className="text-[10px] text-[#dd7058] hover:underline font-mono"
                >
                  Clear filter (★ {filterRating})
                </button>
              ) : (
                <span className="text-[10px] font-mono text-[#a99c91]">
                  fn_get_user_analytics
                </span>
              )}
            </div>

            {/* Histogram Interactive Bars */}
            <div className="space-y-1.5 pt-1">
              {Array.from({ length: 10 }).map((_, i) => {
                const score = 10 - i;
                const count = Number(ratingDist[String(score)] || 0);
                const pct = (count / maxDistCount) * 100;
                const isSelected = filterRating === score;

                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setFilterRating(isSelected ? null : score)}
                    className={`w-full flex items-center gap-2 text-xs py-1 px-2 rounded-lg transition-all text-left ${
                      isSelected
                        ? 'bg-[#dd7058]/20 ring-1 ring-[#dd7058]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                    title={`Click to filter reviews with rating ${score}`}
                  >
                    <span className={`w-5 text-right font-mono text-[11px] ${isSelected ? 'text-[#dd7058] font-bold' : 'text-[#a99c91]'}`}>
                      {score}
                    </span>
                    <div className="flex-1 h-3 rounded bg-black/40 overflow-hidden">
                      <div 
                        className={`h-full rounded transition-all duration-300 ${isSelected ? 'bg-[#ffb08d] shadow-[0_0_8px_#dd7058]' : 'bg-[#dd7058]'}`}
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    <span className={`w-5 font-mono text-[11px] text-right ${isSelected ? 'text-[#dd7058] font-bold' : 'text-[#a99c91]'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Top Genres */}
            {analytics?.top_genres && analytics.top_genres.length > 0 && (
              <div className="pt-3 border-t border-white/[0.08] space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#968f87]">
                  TOP GENRES
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analytics.top_genres.map((g: any, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-[#d5cec4]">
                      {g.genre_name} <strong className="text-[#ffb08d] font-mono ml-1">{g.movie_count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Reviews Logged by User (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-[#171615] border border-[#54433b]/40 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight m-0">
                  Logged Reviews ({filterRating !== null ? reviews.filter(r => Math.round(Number(r.rating)) === filterRating).length : reviews.length})
                </h2>
                {filterRating !== null && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#dd7058]/20 text-[#f2a280]">
                    ★ {filterRating} filter
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-[#a99c91]">
                Chronological
              </span>
            </div>

            {(() => {
              const displayed = filterRating !== null
                ? reviews.filter(r => Math.round(Number(r.rating)) === filterRating)
                : reviews;

              if (displayed.length === 0) {
                return (
                  <div className="p-8 text-center text-xs text-[#a99c91]">
                    {filterRating !== null
                      ? `No reviews found with rating ★ ${filterRating}. Click "Clear filter" to view all.`
                      : 'No film reviews logged by this member yet.'}
                  </div>
                );
              }

              return (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {displayed.map((r) => (
                  <div key={r.review_id} className="p-3.5 rounded-xl bg-black/25 border border-white/[0.04] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <Link 
                        href={`/movies/${r.movie_id}`}
                        className="font-bold text-white hover:text-[#dd7058] transition-colors truncate"
                      >
                        {r.movie_title || `Film #${r.movie_id}`}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#ffb08d]">
                          ★ {Number(r.rating).toFixed(1)}
                        </span>
                        <Link
                          href={`/trace?movieId=${r.movie_id}`}
                          className="text-[10px] text-[#dd7058] hover:underline font-semibold"
                        >
                          Trace →
                        </Link>
                      </div>
                    </div>

                    {r.review_text && (
                      <p className="text-xs text-[#d5cec4] leading-relaxed italic m-0">
                        &ldquo;{r.review_text}&rdquo;
                      </p>
                    )}

                    <div className="text-[10px] text-[#8f8075] font-mono">
                      {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          </div>
        </div>
      </div>
    </div>
  );
}
