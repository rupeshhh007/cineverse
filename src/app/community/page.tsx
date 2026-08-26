'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Trophy, Star, ThumbsUp, MessageSquare, ChevronRight } from 'lucide-react';

export default function CommunityPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      
      {/* Header */}
      <div className="pb-6 border-b border-gray-900 space-y-1">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
          <Award className="w-3.5 h-3.5 text-gray-400" /> Cinephile Rankings
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Community Leaderboard
        </h1>
        <p className="text-xs text-gray-500">
          Dynamic ranking evaluated via SQL: <code className="text-white font-mono">DENSE_RANK() OVER (ORDER BY total_reviews DESC, total_likes_received DESC)</code>
        </p>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="mt-8 space-y-2.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-900 border border-gray-900 animate-pulse" />
          ))
        ) : (
          users.map((u) => {
            const isTop3 = u.rank <= 3;
            return (
              <div
                key={u.user_id}
                className={`p-3.5 sm:p-4 rounded-2xl bg-gray-900 border flex items-center justify-between gap-4 transition-colors hover:border-gray-700 ${
                  u.rank === 1
                    ? 'border-gray-700 bg-gradient-to-r from-white/5 to-gray-900'
                    : 'border-gray-900'
                }`}
              >
                {/* Rank & User */}
                <div className="flex items-center gap-3.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-mono ${
                    u.rank === 1
                      ? 'bg-white text-black'
                      : u.rank === 2
                      ? 'bg-slate-300 text-black'
                      : u.rank === 3
                      ? 'bg-amber-800 text-black'
                      : 'bg-gray-900 text-gray-400 border border-gray-900'
                  }`}>
                    {u.rank === 1 ? <Trophy className="w-3.5 h-3.5" /> : `#${u.rank}`}
                  </div>

                  <Link href={`/profile/${u.user_id}`} className="flex items-center gap-2.5 group">
                    <img
                      src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={u.display_name}
                      className="w-9 h-9 rounded-full object-cover border border-gray-800 group-hover:border-white transition-colors"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-gray-400 transition-colors">
                        {u.display_name}
                      </div>
                      <div className="text-[10px] text-gray-500">@{u.username}</div>
                    </div>
                  </Link>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 sm:gap-8">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-1 justify-center">
                      <MessageSquare className="w-3 h-3 text-gray-400" />
                      <span>{u.total_reviews}</span>
                    </div>
                    <div className="text-[9px] text-gray-500 uppercase">Reviews</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-1 justify-center">
                      <ThumbsUp className="w-3 h-3 text-white" />
                      <span>{u.total_likes_received}</span>
                    </div>
                    <div className="text-[9px] text-gray-500 uppercase">Helpful</div>
                  </div>

                  <div className="text-center hidden sm:block">
                    <div className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-1 justify-center">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{u.avg_rating_given}</span>
                    </div>
                    <div className="text-[9px] text-gray-500 uppercase">Avg Rating</div>
                  </div>

                  <Link
                    href={`/profile/${u.user_id}`}
                    className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
