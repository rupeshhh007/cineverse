'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  Loader2
} from 'lucide-react';
import { User, UserAnalytics, Review } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import { useAuth } from '@/lib/AuthContext';
import ErrorMessage from '@/components/ErrorMessage';
import { useRouter } from 'next/navigation';

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
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-48 bg-gray-900 rounded-3xl" />
        <div className="h-32 bg-gray-900 rounded-3xl" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-4">
        <ErrorMessage message={error} onRetry={fetchUserProfile} />
        <div className="text-center">
          <Link href="/" className="text-gray-400 hover:underline text-xs">
            Return to Discover
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">User Not Found</h1>
        <Link href="/" className="text-gray-400 hover:underline text-xs">
          Return to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      
      {/* Banner */}
      <div className="relative w-full h-48 sm:h-64 overflow-hidden border-b border-gray-900 bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${user.banner_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200'})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10">
        <div className="p-6 sm:p-7 rounded-3xl bg-gray-900 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
          
          <div className="flex items-center gap-5">
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-gray-800 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{user.display_name}</h1>
                <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-900">
                  ID: #{user.user_id}
                </span>
              </div>
              <div className="text-xs text-gray-500">@{user.username}</div>
              {user.bio && (
                <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-lg leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Social Stats & Working Follow Button */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-5 text-center">
              <div>
                <div className="text-base font-bold text-white font-mono">{followersCount}</div>
                <div className="text-[10px] text-gray-500 uppercase">Followers</div>
              </div>
              <div className="h-6 w-px bg-gray-900" />
              <div>
                <div className="text-base font-bold text-white font-mono">{analytics?.following_count || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase">Following</div>
              </div>
            </div>

            {!isOwnProfile && (
              <button
                onClick={handleToggleFollow}
                disabled={isFollowUpdating}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isFollowing
                    ? 'bg-gray-800 hover:bg-rose-500/20 text-black hover:text-rose-300 border border-gray-800'
                    : 'bg-white hover:bg-gray-200 text-black shadow-sm'
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
                    <span>Follow User</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Analytics Stats Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          
          <div className="p-4 rounded-2xl bg-gray-900 border border-gray-900 space-y-1">
            <div className="text-gray-400 text-xs flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-gray-400" /> Films Logged
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{analytics?.total_reviews || 0}</div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-900 border border-gray-900 space-y-1">
            <div className="text-gray-400 text-xs flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-white fill-current" /> Avg Rating Given
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{analytics?.avg_rating || 0.0}</div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-900 border border-gray-900 space-y-1">
            <div className="text-gray-400 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white" /> Watch Time
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{analytics?.total_runtime_hours || 0} hrs</div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-900 border border-gray-900 space-y-1">
            <div className="text-gray-400 text-xs flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-white" /> Curated Lists
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{analytics?.total_watchlists || 0}</div>
          </div>

        </div>
      </section>

      {/* Top Genres & Spread */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <div className="p-5 rounded-2xl bg-gray-900 border border-gray-900 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-white" /> Favorite Genres (SQL Aggregation)
          </h3>
          <div className="space-y-2">
            {analytics?.top_genres && analytics.top_genres.length > 0 ? (
              analytics.top_genres.map((tg) => (
                <div key={tg.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-medium">{tg.name}</span>
                    <span className="text-gray-500 font-mono">{tg.count} films</span>
                  </div>
                  <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min((tg.count / 8) * 100, 100)}%` }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">No genre data available yet.</p>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900 border border-gray-900 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-white fill-current" /> Rating Spread
          </h3>
          <div className="flex items-end gap-1.5 h-28 pt-2">
            {Object.entries(analytics?.rating_distribution || {}).map(([score, count]) => (
              <div key={score} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="text-[9px] font-mono text-gray-500">{count as number}</div>
                <div className="w-full bg-gray-900 rounded-t h-full flex items-end overflow-hidden">
                  <div
                    style={{ height: `${Math.max(((count as number) / 6) * 100, 4)}%` }}
                    className="w-full bg-gradient-to-t from-white to-white rounded-t transition-all"
                  />
                </div>
                <span className="text-[9px] font-mono text-gray-400">{score}★</span>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-white" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Recommended for {user.display_name}
            </h2>
            <span className="text-[11px] font-mono text-gray-500">
              (PL/pgSQL <code className="text-white">fn_recommend_movies</code>)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.movie_id} className="p-3 rounded-2xl bg-gray-900 border border-gray-900 space-y-2">
                <Link href={`/movies/${rec.movie_id}`} className="block aspect-[2/3] rounded-xl overflow-hidden">
                  <img src={rec.poster_url} alt={rec.title} className="w-full h-full object-cover" />
                </Link>
                <div className="text-xs font-semibold text-white truncate">{rec.title}</div>
                <div className="text-[10px] text-gray-400 line-clamp-2 leading-tight">
                  {rec.recommendation_reason}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Review History */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <span>Review History ({reviews.length})</span>
        </h2>

        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.review_id} className="p-4 rounded-2xl bg-gray-900 border border-gray-900 flex items-start gap-4">
              {r.poster_url && (
                <img
                  src={r.poster_url}
                  alt={r.movie_title || ''}
                  className="w-12 h-16 rounded-xl object-cover border border-gray-800"
                />
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Link href={`/movies/${r.movie_id}`} className="text-sm font-bold text-white hover:text-gray-400 transition-colors">
                    {r.movie_title}
                  </Link>
                  <div className="flex items-center gap-1 text-white font-mono font-bold text-xs bg-gray-800 px-2 py-0.5 rounded-full border border-gray-800">
                    <Star className="w-3 h-3 fill-current" /> {Number(r.rating).toFixed(1)}
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {r.review_text}
                </p>
                <div className="text-[10px] text-gray-500 pt-1">
                  Logged on {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
