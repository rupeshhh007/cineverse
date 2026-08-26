'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, X, Terminal, Clock, ArrowRight, Layers } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function DbmsInspectorDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [currentQueryMeta, setCurrentQueryMeta] = useState<{
    pageName: string;
    sql: string;
    concepts: string[];
    avgDuration: string;
  }>({
    pageName: 'Discover Hub',
    sql: `SELECT m.*, vtm.bayesian_score, json_agg(g.*) AS genres
FROM movies m
LEFT JOIN v_trending_movies vtm ON m.movie_id = vtm.movie_id
LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.genre_id
GROUP BY m.movie_id, vtm.bayesian_score
ORDER BY vtm.bayesian_score DESC;`,
    concepts: ['Materialized View (`v_trending_movies`)', 'Many-to-Many Aggregation (`json_agg`)', 'Bayesian Rating Score'],
    avgDuration: '2.8 ms'
  });

  useEffect(() => {
    if (pathname === '/') {
      setCurrentQueryMeta({
        pageName: 'Discover Hub',
        sql: `SELECT m.*, vtm.bayesian_score, json_agg(g.*) AS genres
FROM movies m
LEFT JOIN v_trending_movies vtm ON m.movie_id = vtm.movie_id
LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.genre_id
GROUP BY m.movie_id, vtm.bayesian_score
ORDER BY vtm.bayesian_score DESC;`,
        concepts: ['Materialized View (`v_trending_movies`)', 'Many-to-Many Aggregation (`json_agg`)', 'Bayesian Rating Score'],
        avgDuration: '2.8 ms'
      });
    } else if (pathname?.startsWith('/movies/')) {
      setCurrentQueryMeta({
        pageName: 'Film Details & Reviews',
        sql: `SELECT m.*, json_agg(DISTINCT p.*) AS cast, json_agg(r.*) AS reviews
FROM movies m
LEFT JOIN movie_cast mc ON m.movie_id = mc.movie_id
LEFT JOIN people p ON mc.person_id = p.person_id
LEFT JOIN reviews r ON m.movie_id = r.movie_id
WHERE m.movie_id = $1
GROUP BY m.movie_id;

-- Rating Histogram:
SELECT bucket.rating_val, COUNT(r.review_id)
FROM generate_series(1, 10) AS bucket(rating_val)
LEFT JOIN reviews r ON FLOOR(r.rating) = bucket.rating_val
GROUP BY bucket.rating_val;`,
        concepts: ['generate_series Subquery', '3-Way Relation Bridge', 'Trigger-Synced Averages'],
        avgDuration: '3.4 ms'
      });
    } else if (pathname === '/feed') {
      setCurrentQueryMeta({
        pageName: 'Activity Feed',
        sql: `SELECT al.*, u.username, u.avatar_url, m.title, m.poster_url
FROM activity_logs al
JOIN users u ON al.user_id = u.user_id
LEFT JOIN movies m ON al.target_id = m.movie_id
ORDER BY al.created_at DESC LIMIT 30;`,
        concepts: ['Audit Trail View', 'Event-Driven JSONB Metadata', 'Polymorphic Foreign Keys'],
        avgDuration: '1.9 ms'
      });
    } else if (pathname === '/community') {
      setCurrentQueryMeta({
        pageName: 'Community Leaderboard',
        sql: `SELECT 
  u.user_id, u.username,
  COUNT(r.review_id) AS total_reviews,
  SUM(r.likes_count) AS total_likes,
  DENSE_RANK() OVER (ORDER BY COUNT(r.review_id) DESC) AS rank
FROM users u
LEFT JOIN reviews r ON u.user_id = r.user_id
GROUP BY u.user_id;`,
        concepts: ['Window Function (`DENSE_RANK() OVER (...)`)', 'Aggregate SUM & COUNT', 'Left Outer Join'],
        avgDuration: '2.4 ms'
      });
    } else if (pathname === '/lists') {
      setCurrentQueryMeta({
        pageName: 'Curated Lists',
        sql: `SELECT w.*, u.username, COUNT(wi.movie_id) AS movie_count
FROM watchlists w
JOIN users u ON w.user_id = u.user_id
LEFT JOIN watchlist_items wi ON w.watchlist_id = wi.watchlist_id
WHERE w.is_public = TRUE
GROUP BY w.watchlist_id, u.user_id;`,
        concepts: ['Parent-Child Collection Integrity', 'Composite Key Join', 'Foreign Key Cascades'],
        avgDuration: '2.7 ms'
      });
    }
  }, [pathname]);

  return (
    <>
      {/* Minimalist Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black hover:bg-gray-900 text-white text-xs font-semibold border border-gray-800 shadow-2xl transition-all"
        >
          <Database className="w-4 h-4 text-white" />
          <span>DBMS Inspector</span>
        </button>
      </div>

      {/* Slide-in Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-black border-l border-gray-800 h-full overflow-y-auto p-8 flex flex-col justify-between shadow-2xl">
            
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-gray-900">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center border border-gray-800">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white tracking-tight">Live Query Profiler</h3>
                    <div className="text-sm text-gray-500">PostgreSQL 16 Engine</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full bg-black border border-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* View Context */}
              <div className="mt-8 p-4 rounded-2xl bg-gray-900/50 border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-400">Active View: </span>
                  <strong className="text-sm font-medium text-white">{currentQueryMeta.pageName}</strong>
                </div>
                <div className="flex items-center gap-2 text-white font-mono text-sm">
                  <Clock className="w-4 h-4" /> {currentQueryMeta.avgDuration}
                </div>
              </div>

              {/* Concepts */}
              <div className="mt-8">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Relational Architecture Highlights
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentQueryMeta.concepts.map((c, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-gray-300 text-xs font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active SQL */}
              <div className="mt-8">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">
                  Underlying Raw SQL Query
                </div>
                <div className="rounded-2xl bg-gray-900/30 border border-gray-800 p-6 font-mono text-sm text-gray-300 overflow-x-auto">
                  <pre className="whitespace-pre-wrap leading-loose">{currentQueryMeta.sql}</pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 mt-8">
              <Link
                href="/dbms-console"
                onClick={() => setIsOpen(false)}
                className="w-full py-4 rounded-full bg-white hover:bg-gray-200 text-black text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span>Launch Interactive Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
