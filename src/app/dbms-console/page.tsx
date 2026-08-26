'use client';

import React, { useState, useEffect } from 'react';
import InteractiveErDiagram from '@/components/InteractiveErDiagram';
import { 
  Database, 
  Terminal, 
  Play, 
  Zap, 
  Layers, 
  Clock, 
  Check, 
  Copy, 
  Download, 
  Table as TableIcon, 
  Code2, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Key,
  ShieldCheck
} from 'lucide-react';

const PRESET_QUERIES = [
  {
    name: '1. Multi-Table JOIN with Aggregation (Movies, Genres, Reviews)',
    sql: `SELECT 
    m.title,
    m.director,
    m.avg_rating,
    COUNT(r.review_id) AS total_reviews,
    string_agg(DISTINCT g.name, ', ') AS genres
FROM movies m
JOIN movie_genres mg ON m.movie_id = mg.movie_id
JOIN genres g ON mg.genre_id = g.genre_id
LEFT JOIN reviews r ON m.movie_id = r.movie_id
GROUP BY m.movie_id, m.title, m.director, m.avg_rating
HAVING COUNT(r.review_id) > 0
ORDER BY m.avg_rating DESC;`
  },
  {
    name: '2. Window Function: User Leaderboard with DENSE_RANK()',
    sql: `SELECT 
    u.user_id,
    u.username,
    u.display_name,
    COUNT(r.review_id) AS reviews_written,
    COALESCE(SUM(r.likes_count), 0) AS total_helpful_votes,
    COALESCE(ROUND(AVG(r.rating), 2), 0) AS avg_score_given,
    DENSE_RANK() OVER (ORDER BY COUNT(r.review_id) DESC, COALESCE(SUM(r.likes_count), 0) DESC) AS rank
FROM users u
LEFT JOIN reviews r ON u.user_id = r.user_id
GROUP BY u.user_id, u.username, u.display_name
ORDER BY rank ASC;`
  },
  {
    name: '3. Bayesian Weighted Rating CTE (v_trending_movies View logic)',
    sql: `WITH Stats AS (
    SELECT AVG(avg_rating) AS global_mean, 3.0 AS smoothing FROM movies
)
SELECT 
    m.title,
    m.avg_rating,
    m.review_count,
    ROUND(
        (
            (m.review_count / (m.review_count + s.smoothing)) * m.avg_rating +
            (s.smoothing / (m.review_count + s.smoothing)) * s.global_mean
        )::NUMERIC, 
        2
    ) AS bayesian_score
FROM movies m
CROSS JOIN Stats s
ORDER BY bayesian_score DESC
LIMIT 8;`
  },
  {
    name: '4. Correlated Subquery with EXISTS (Sci-Fi Director Query)',
    sql: `SELECT m.movie_id, m.title, m.director, m.release_date
FROM movies m
WHERE EXISTS (
    SELECT 1 
    FROM movie_genres mg
    JOIN genres g ON mg.genre_id = g.genre_id
    WHERE mg.movie_id = m.movie_id AND g.slug = 'sci-fi'
)
ORDER BY m.release_date DESC;`
  },
  {
    name: '5. Call PL/pgSQL Function: fn_get_user_analytics(1)',
    sql: `SELECT fn_get_user_analytics(1) AS user_1_analytics;`
  },
  {
    name: '6. Call Recommendation Procedure: fn_recommend_movies(1, 5)',
    sql: `SELECT * FROM fn_recommend_movies(1, 5);`
  },
  {
    name: '7. Relational Constraints & Keys Introspection',
    sql: `SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;`
  }
];

export default function DbmsConsolePage() {
  const [activeTab, setActiveTab] = useState<'console' | 'triggers' | 'schema' | 'catalog'>('console');
  const [sqlInput, setSqlInput] = useState(PRESET_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger Demo State
  const [selectedMovieId, setSelectedMovieId] = useState('1');
  const [injectedRating, setInjectedRating] = useState('10.0');
  const [triggerDemoResult, setTriggerDemoResult] = useState<any>(null);
  const [isTriggerTesting, setIsTriggerTesting] = useState(false);

  // Schema Introspection State
  const [schemaData, setSchemaData] = useState<any>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

  useEffect(() => {
    fetch('/api/dbms/schema')
      .then((res) => res.json())
      .then((data) => setSchemaData(data))
      .catch((err) => console.error(err));
  }, []);

  const handleExecuteSql = async () => {
    setIsExecuting(true);
    setError(null);
    try {
      const res = await fetch('/api/dbms/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Query failed');
      }
      setQueryResult(data);
    } catch (err: any) {
      setError(err.message);
      setQueryResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTestTrigger = async () => {
    setIsTriggerTesting(true);
    try {
      const res = await fetch('/api/dbms/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: selectedMovieId,
          rating: injectedRating,
        }),
      });
      const data = await res.json();
      setTriggerDemoResult(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsTriggerTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 1500);
  };

  const downloadCSV = () => {
    if (!queryResult || !queryResult.rows || queryResult.rows.length === 0) return;
    const cols = queryResult.columns;
    const header = cols.join(',');
    const rows = queryResult.rows.map((r: any) =>
      cols.map((c: string) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cineverse_query_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28">
      
      {/* Header */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gray-900 border border-gray-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-gray-400" /> PostgreSQL Engine & Architecture
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              DBMS Query & Architecture Console
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Inspect normalized 3NF schemas, execute live parameterized queries with millisecond profiling, and test PostgreSQL triggers in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PostgreSQL 16 Engine Active</span>
            </div>
          </div>
        </div>

        {/* Schema Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-900 text-xs">
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-900">
            <div className="text-gray-500">Schema Structure</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">12 Tables (3NF)</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-900">
            <div className="text-gray-500">Triggers Registered</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">3 PL/pgSQL Triggers</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-900">
            <div className="text-gray-500">Stored Functions</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">2 Functions</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-900">
            <div className="text-gray-500">Analytical Views</div>
            <div className="text-base font-bold text-gray-400 font-mono mt-0.5">4 SQL Views</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mt-6 border-b border-gray-900 pb-3 overflow-x-auto">
        {[
          { id: 'console', label: 'Interactive SQL Console', icon: Terminal },
          { id: 'triggers', label: 'Trigger Demonstrator', icon: Zap },
          { id: 'schema', label: 'Schema & ER Map', icon: TableIcon },
          { id: 'catalog', label: 'Procedures & Views', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-white text-black font-bold'
                  : 'bg-gray-900 border border-gray-900 text-gray-400 hover:text-black hover:bg-gray-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SQL CONSOLE */}
      {activeTab === 'console' && (
        <div className="mt-6 space-y-4 animate-fade-in">
          
          {/* Preset Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-900 border border-gray-900">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Grading Query Presets:</span>
            </div>
            <select
              onChange={(e) => {
                const found = PRESET_QUERIES.find((q) => q.name === e.target.value);
                if (found) setSqlInput(found.sql);
              }}
              className="bg-gray-800 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-medium"
            >
              {PRESET_QUERIES.map((q) => (
                <option key={q.name} value={q.name}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>

          {/* Editor */}
          <div className="rounded-3xl bg-gray-900 border border-gray-800 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-900">
              <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
                <Terminal className="w-3.5 h-3.5 text-gray-400" />
                <span>PostgreSQL SQL Editor</span>
              </div>
              <button
                onClick={() => copyToClipboard(sqlInput)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                {copiedQuery ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedQuery ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <textarea
              rows={7}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              className="w-full p-4 bg-black font-mono text-xs sm:text-sm text-gray-400 focus:outline-none resize-y leading-relaxed"
            />

            <div className="flex items-center justify-between p-3.5 bg-gray-900 border-t border-gray-900">
              <span className="text-[11px] text-gray-500">
                Executes directly against database client
              </span>
              <button
                onClick={handleExecuteSql}
                disabled={isExecuting || !sqlInput.trim()}
                className="px-5 py-2 rounded-xl bg-white hover:bg-gray-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isExecuting ? 'Executing...' : 'Run Query'}</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="font-mono text-xs">{error}</div>
            </div>
          )}

          {/* Output Table */}
          {queryResult && (
            <div className="rounded-3xl bg-gray-900 border border-gray-800 overflow-hidden space-y-3 p-5 shadow-xl animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">Results ({queryResult.rowCount} rows)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadCSV}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                  <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {queryResult.durationMs} ms
                  </div>
                </div>
              </div>

              {queryResult.rows.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 font-mono">
                  Query executed successfully (0 rows).
                </div>
              ) : (
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-900 border-b border-gray-900 text-gray-400">
                        {queryResult.columns.map((col: string) => (
                          <th key={col} className="p-2.5 font-semibold text-white whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {queryResult.rows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-gray-900 transition-colors">
                          {queryResult.columns.map((col: string) => {
                            const val = row[col];
                            return (
                              <td key={col} className="p-2.5 text-gray-400 whitespace-nowrap max-w-xs truncate">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? 'NULL')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: TRIGGER TESTER */}
      {activeTab === 'triggers' && (
        <div className="mt-6 space-y-4 animate-fade-in">
          
          <div className="p-5 rounded-3xl bg-gray-900 border border-gray-900 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-white fill-current" />
              <span>Interactive Trigger Execution Proof</span>
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Demonstrates real-time synchronization by firing <code className="text-white">trg_update_movie_rating</code> and audit log generation via <code className="text-white">trg_log_review_activity</code>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Target Film</label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                >
                  <option value="1">1 - Inception</option>
                  <option value="2">2 - Interstellar</option>
                  <option value="3">3 - The Dark Knight</option>
                  <option value="4">4 - Dune: Part Two</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Inject Score</label>
                <select
                  value={injectedRating}
                  onChange={(e) => setInjectedRating(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-white"
                >
                  <option value="10.0">10.0 ★ (Masterpiece)</option>
                  <option value="1.0">1.0 ★ (Lowest Score Stress-Test)</option>
                  <option value="7.5">7.5 ★ (Above Average)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleTestTrigger}
                  disabled={isTriggerTesting}
                  className="w-full py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs border border-gray-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-white fill-current" />
                  <span>{isTriggerTesting ? 'Testing...' : 'Execute Test Trigger'}</span>
                </button>
              </div>
            </div>
          </div>

          {triggerDemoResult && (
            <div className="p-5 rounded-3xl bg-gray-900 border border-gray-800 space-y-4 animate-fade-in shadow-xl">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Trace: {triggerDemoResult.targetMovie}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                
                <div className="p-3 rounded-2xl bg-gray-900 border border-gray-900 space-y-1.5">
                  <div className="text-gray-500 font-semibold">1. State Before Trigger</div>
                  <div className="font-mono">
                    <div>Avg: <strong className="text-white">{triggerDemoResult.step1_before.avg_rating}</strong></div>
                    <div>Count: <strong className="text-white">{triggerDemoResult.step1_before.review_count}</strong></div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-gray-900 border border-gray-800 space-y-1.5">
                  <div className="text-gray-400 font-semibold">2. DML Action Fired</div>
                  <div className="font-mono">
                    <div>Op: <span className="text-gray-400 font-bold">{triggerDemoResult.step2_action.operation}</span></div>
                    <div>Rating: <span className="text-white font-bold">{triggerDemoResult.step2_action.injectedRating}★</span></div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                  <div className="text-emerald-400 font-semibold">3. State After Trigger Sync</div>
                  <div className="font-mono">
                    <div>New Avg: <strong className="text-emerald-400">{triggerDemoResult.step3_after.avg_rating}</strong></div>
                    <div>Count: <strong className="text-white">{triggerDemoResult.step3_after.review_count}</strong></div>
                  </div>
                </div>

              </div>

              {triggerDemoResult.step4_trigger_audit_log && (
                <div className="p-3 rounded-2xl bg-black border border-gray-900 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-gray-500">
                    Audit Log Entry via <code className="text-white">trg_log_review_activity</code>:
                  </div>
                  <pre className="font-mono text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(triggerDemoResult.step4_trigger_audit_log, null, 2)}
                  </pre>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* TAB 3: SCHEMA & ER MAP */}
      {activeTab === 'schema' && (
        <div className="mt-6 space-y-4 animate-fade-in">
          <InteractiveErDiagram />
        </div>
      )}

      {/* TAB 4: PROCEDURES & VIEWS */}
      {activeTab === 'catalog' && (
        <div className="mt-6 space-y-4 animate-fade-in">
          
          <div className="p-5 rounded-3xl bg-gray-900 border border-gray-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-white" /> Registered PL/pgSQL Triggers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {schemaData?.triggers?.map((trg: any) => (
                <div key={trg.name} className="p-3.5 rounded-2xl bg-gray-900 border border-gray-900 space-y-1.5">
                  <div className="font-mono font-bold text-xs text-white">{trg.name}</div>
                  <div className="text-[10px] text-gray-500">On: {trg.table} ({trg.events})</div>
                  <p className="text-xs text-gray-400">{trg.purpose}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gray-900 border border-gray-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-gray-400" /> Stored Functions & Analytical Views
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {schemaData?.procedures?.map((proc: any) => (
                <div key={proc.name} className="p-3.5 rounded-2xl bg-gray-900 border border-gray-900 space-y-1">
                  <div className="font-mono font-bold text-xs text-white">{proc.name}</div>
                  <p className="text-xs text-gray-400">{proc.purpose}</p>
                </div>
              ))}
              {schemaData?.views?.map((view: any) => (
                <div key={view.name} className="p-3.5 rounded-2xl bg-gray-900 border border-gray-900 space-y-1">
                  <div className="font-mono font-bold text-xs text-gray-400">{view.name}</div>
                  <p className="text-xs text-gray-400">{view.purpose}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
