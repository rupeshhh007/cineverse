'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Award, 
  Trophy, 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  ChevronRight, 
  Medal, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

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

  const top3 = users.slice(0, 3);
  const remainingUsers = users.slice(3);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-cv-shell border border-cv-border/30 space-y-2 shadow-xl">
        <div className="flex items-center gap-1.5 text-cv-muted text-[11px] font-mono uppercase tracking-widest">
          <Award className="w-3.5 h-3.5 text-cv-moss" /> The Cinephile Guild
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-cv-text">
          Community Leaderboard
        </h1>
        <p className="text-xs text-cv-muted max-w-2xl leading-relaxed">
          Dynamic community standings evaluated via PostgreSQL window function: <br />
          <code className="text-cv-moss font-mono text-[11px]">DENSE_RANK() OVER (ORDER BY total_reviews DESC, total_likes_received DESC)</code>
        </p>
      </div>

      {/* Top 3 Featured Cinephiles Grid */}
      {!isLoading && top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((u, idx) => {
            const rankTitles = ['#01 Top Reviewer', '#02 Leading Critic', '#03 Dedicated Curator'];
            const rankTitle = rankTitles[idx] || `#0${u.rank} Rank`;
            const initials = (u.display_name || u.username || 'CV')
              .split(' ')
              .map((n: string) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const isFirst = u.rank === 1;

            return (
              <div
                key={u.user_id}
                className={`p-6 rounded-2xl border transition-all space-y-4 relative overflow-hidden flex flex-col justify-between ${
                  isFirst
                    ? 'bg-cv-surface border-cv-moss/50 shadow-xl ring-1 ring-cv-moss/20'
                    : 'bg-cv-shell border-cv-border/30 hover:border-cv-border/60'
                }`}
              >
                <div>
                  {/* Top Rank Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-cv-border/20">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cv-muted">
                      {rankTitle}
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                      isFirst
                        ? 'bg-cv-moss text-cv-ink'
                        : 'bg-cv-surface-2 border border-cv-border/40 text-cv-text'
                    }`}>
                      {isFirst ? <Trophy className="w-3.5 h-3.5" /> : `#${u.rank}`}
                    </div>
                  </div>

                  {/* User Profile Card */}
                  <div className="flex items-center gap-3.5 pt-2">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.display_name}
                        className="w-12 h-12 rounded-full object-cover border border-cv-border/40"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-cv-surface-2 border border-cv-border/40 flex items-center justify-center font-mono text-sm font-bold text-cv-text">
                        {initials}
                      </div>
                    )}
                    <div>
                      <Link
                        href={`/profile/${u.user_id}`}
                        className="text-base font-serif font-bold text-cv-text hover:text-cv-moss transition-colors block"
                      >
                        {u.display_name}
                      </Link>
                      <div className="text-[11px] font-mono text-cv-muted">
                        @{u.username}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 pt-4">
                    <div className="p-2.5 rounded-xl bg-cv-surface-2/60 border border-cv-border/20 text-center">
                      <div className="text-sm font-mono font-bold text-cv-text">
                        {u.total_reviews}
                      </div>
                      <div className="text-[9px] font-mono uppercase text-cv-muted">
                        Reviews
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-cv-surface-2/60 border border-cv-border/20 text-center">
                      <div className="text-sm font-mono font-bold text-cv-moss flex items-center justify-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{u.total_likes_received}</span>
                      </div>
                      <div className="text-[9px] font-mono uppercase text-cv-muted">
                        Helpful
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-cv-surface-2/60 border border-cv-border/20 text-center">
                      <div className="text-sm font-mono font-bold text-cv-text flex items-center justify-center gap-0.5">
                        <Star className="w-3 h-3 text-cv-moss fill-current" />
                        <span>{u.avg_rating_given}</span>
                      </div>
                      <div className="text-[9px] font-mono uppercase text-cv-muted">
                        Avg Score
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/profile/${u.user_id}`}
                  className="w-full py-2 rounded-xl bg-cv-surface-2 hover:bg-cv-shell text-xs font-semibold text-cv-text border border-cv-border/30 text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View Cinephile Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="rounded-2xl bg-cv-shell border border-cv-border/30 overflow-hidden shadow-xl">
        <div className="p-4 bg-cv-surface/70 border-b border-cv-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cv-text">
            <Medal className="w-4 h-4 text-cv-moss" />
            <span>Complete Guild Standings ({users.length} members)</span>
          </div>
          <span className="text-[10px] font-mono text-cv-muted">
            Ordered by DENSE_RANK()
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-cv-surface/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-cv-surface-2/80 border-b border-cv-border/30 text-cv-muted text-[11px]">
                  <th className="p-3.5 font-semibold text-center w-16">Rank</th>
                  <th className="p-3.5 font-semibold">Cinephile</th>
                  <th className="p-3.5 font-semibold text-center">Reviews Written</th>
                  <th className="p-3.5 font-semibold text-center">Helpful Votes</th>
                  <th className="p-3.5 font-semibold text-center">Avg Rating Given</th>
                  <th className="p-3.5 font-semibold text-right pr-5">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cv-border/20 bg-cv-shell">
                {users.map((u) => {
                  const initials = (u.display_name || u.username || 'CV')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={u.user_id} className="hover:bg-cv-surface/40 transition-colors">
                      <td className="p-3.5 text-center font-bold">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${
                          u.rank === 1
                            ? 'bg-cv-moss text-cv-ink font-bold'
                            : u.rank <= 3
                            ? 'bg-cv-surface text-cv-text border border-cv-border/40'
                            : 'text-cv-muted'
                        }`}>
                          {u.rank}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <Link href={`/profile/${u.user_id}`} className="flex items-center gap-3 group">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.display_name}
                              className="w-8 h-8 rounded-full object-cover border border-cv-border/40"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-cv-surface-2 border border-cv-border/40 flex items-center justify-center font-mono text-[10px] font-bold text-cv-text">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-cv-text group-hover:text-cv-moss transition-colors font-sans">
                              {u.display_name}
                            </div>
                            <div className="text-[10px] text-cv-muted">@{u.username}</div>
                          </div>
                        </Link>
                      </td>

                      <td className="p-3.5 text-center font-bold text-cv-text">
                        {u.total_reviews}
                      </td>

                      <td className="p-3.5 text-center font-bold text-cv-moss">
                        {u.total_likes_received}
                      </td>

                      <td className="p-3.5 text-center text-cv-muted font-bold">
                        ★ {u.avg_rating_given}
                      </td>

                      <td className="p-3.5 text-right pr-5">
                        <Link
                          href={`/profile/${u.user_id}`}
                          className="inline-flex items-center gap-1 text-xs text-cv-moss hover:underline"
                        >
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
