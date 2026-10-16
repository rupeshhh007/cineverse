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
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RotateCcw
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
  const [allowWrite, setAllowWrite] = useState(false);
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
        body: JSON.stringify({ sql: sqlInput, allowWrite }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Query failed');
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

  // Keyboard shortcut ⌘+Enter to run query
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isExecuting && sqlInput.trim()) {
        handleExecuteSql();
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-cv-shell border border-cv-border/30 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cv-muted text-[11px] font-mono uppercase tracking-widest">
              <Database className="w-3.5 h-3.5 text-cv-moss" /> The Projection Room / PostgreSQL Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-cv-text mt-1">
              Database Query & Architecture Console
            </h1>
            <p className="text-xs text-cv-muted mt-1 max-w-2xl">
              Inspect normalized 3NF schemas, execute live parameterized queries with millisecond profiling, and verify PostgreSQL triggers in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-cv-surface border border-cv-moss/30 text-cv-moss text-xs font-mono font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cv-moss animate-pulse" />
              <span>PostgreSQL 16 Engine Active</span>
            </div>
          </div>
        </div>

        {/* Schema Architecture Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-cv-border/20 text-xs">
          <div className="p-3 rounded-xl bg-cv-surface/70 border border-cv-border/30">
            <div className="text-cv-muted text-[11px]">Schema Model</div>
            <div className="text-sm sm:text-base font-bold text-cv-text font-mono mt-0.5">13 Tables (3NF)</div>
          </div>
          <div className="p-3 rounded-xl bg-cv-surface/70 border border-cv-border/30">
            <div className="text-cv-muted text-[11px]">Registered Triggers</div>
            <div className="text-sm sm:text-base font-bold text-cv-text font-mono mt-0.5">4 PL/pgSQL Triggers</div>
          </div>
          <div className="p-3 rounded-xl bg-cv-surface/70 border border-cv-border/30">
            <div className="text-cv-muted text-[11px]">Stored Procedures</div>
            <div className="text-sm sm:text-base font-bold text-cv-text font-mono mt-0.5">2 Functions</div>
          </div>
          <div className="p-3 rounded-xl bg-cv-surface/70 border border-cv-border/30">
            <div className="text-cv-muted text-[11px]">Analytical Views</div>
            <div className="text-sm sm:text-base font-bold text-cv-muted font-mono mt-0.5">4 SQL Views</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-cv-border/30 pb-3 overflow-x-auto">
        {[
          { id: 'console', label: 'Query editor', icon: Terminal },
          { id: 'triggers', label: 'Trigger lab', icon: Zap },
          { id: 'schema', label: 'Schema & ER', icon: TableIcon },
          { id: 'catalog', label: 'Functions & views', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-cv-moss text-cv-ink font-bold'
                  : 'bg-cv-shell border border-cv-border/30 text-cv-muted hover:text-cv-text hover:bg-cv-surface'
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
        <div className="space-y-4">
          
          {/* Preset Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-cv-shell border border-cv-border/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-cv-text">
              <Sparkles className="w-3.5 h-3.5 text-cv-moss" />
              <span>Grading Query Presets:</span>
            </div>
            <select
              onChange={(e) => {
                const found = PRESET_QUERIES.find((q) => q.name === e.target.value);
                if (found) setSqlInput(found.sql);
              }}
              className="bg-cv-surface border border-cv-border/50 rounded-xl px-3 py-1.5 text-xs text-cv-text focus:outline-none focus:border-cv-moss font-mono"
            >
              {PRESET_QUERIES.map((q) => (
                <option key={q.name} value={q.name}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>

          {/* Editor Container */}
          <div className="rounded-2xl bg-cv-shell border border-cv-border/40 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-cv-surface/80 border-b border-cv-border/30">
              <div className="flex items-center gap-2 font-mono text-xs text-cv-muted">
                <Terminal className="w-3.5 h-3.5 text-cv-moss" />
                <span>PostgreSQL SQL Editor</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-cv-muted hidden sm:inline">
                  Press ⌘+Enter to execute
                </span>
                <button
                  onClick={() => copyToClipboard(sqlInput)}
                  className="flex items-center gap-1 text-xs text-cv-muted hover:text-cv-text transition-colors"
                >
                  {copiedQuery ? <Check className="w-3.5 h-3.5 text-cv-moss" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQuery ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-4 bg-[#0d130d] font-mono text-xs sm:text-sm text-cv-text focus:outline-none resize-y leading-relaxed border-0"
              spellCheck={false}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-cv-surface border-t border-cv-border/30">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAllowWrite(!allowWrite)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-colors border ${
                    allowWrite
                      ? 'bg-cv-danger/10 border-cv-danger/30 text-cv-danger'
                      : 'bg-cv-moss/10 border-cv-moss/30 text-cv-moss'
                  }`}
                  title={allowWrite ? "Write Mode: DML/DDL execution enabled" : "Read-Only Mode: Only SELECT queries permitted"}
                >
                  {allowWrite ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>{allowWrite ? 'Write Mode (Active)' : 'Read-Only Mode (Safe)'}</span>
                </button>
                <span className="text-[11px] text-cv-muted hidden sm:inline">
                  {allowWrite ? 'DML statements will mutate state' : 'Safe query sandbox'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSqlInput('')}
                  className="px-3 py-1.5 rounded-xl bg-cv-surface-2 hover:bg-cv-shell text-cv-muted hover:text-cv-text text-xs border border-cv-border/30 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleExecuteSql}
                  disabled={isExecuting || !sqlInput.trim()}
                  className="px-5 py-2 rounded-xl bg-cv-moss hover:bg-cv-moss/90 text-cv-ink font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-cv-danger/10 border border-cv-danger/20 text-cv-danger flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="font-mono text-xs">{error}</div>
              </div>
              {error.includes('Read-only') && (
                <button
                  onClick={() => {
                    setAllowWrite(true);
                    setTimeout(handleExecuteSql, 50);
                  }}
                  className="px-3 py-1 bg-cv-danger/20 hover:bg-cv-danger/30 text-cv-text rounded-lg text-xs font-medium shrink-0"
                >
                  Enable Write & Retry
                </button>
              )}
            </div>
          )}

          {/* Output Table */}
          {queryResult && (
            <div className="rounded-2xl bg-cv-shell border border-cv-border/40 overflow-hidden space-y-3 p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-cv-border/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cv-moss" />
                  <span className="text-xs font-semibold text-cv-text">
                    Results ({queryResult.rowCount} rows)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadCSV}
                    className="flex items-center gap-1 text-[11px] text-cv-muted hover:text-cv-text transition-colors"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                  <div className="text-xs font-mono text-cv-moss bg-cv-moss/10 px-2.5 py-0.5 rounded-full border border-cv-moss/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {queryResult.durationMs} ms
                  </div>
                </div>
              </div>

              {queryResult.rows.length === 0 ? (
                <div className="p-6 text-center text-xs text-cv-muted font-mono">
                  Query executed successfully (0 rows returned).
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 rounded-xl border border-cv-border/30">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-cv-surface border-b border-cv-border/30 text-cv-muted sticky top-0">
                        {queryResult.columns.map((col: string) => (
                          <th key={col} className="p-2.5 font-semibold text-cv-text whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cv-border/20 bg-[#0d130d]">
                      {queryResult.rows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-cv-surface/40 transition-colors">
                          {queryResult.columns.map((col: string) => {
                            const val = row[col];
                            return (
                              <td key={col} className="p-2.5 text-cv-muted whitespace-nowrap max-w-xs truncate">
                                {val === null ? (
                                  <span className="text-cv-muted/40 italic">NULL</span>
                                ) : typeof val === 'object' ? (
                                  JSON.stringify(val)
                                ) : (
                                  String(val)
                                )}
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
        <div className="space-y-4">
          
          <div className="p-6 rounded-2xl bg-cv-shell border border-cv-border/30 space-y-4 shadow-xl">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-cv-muted">
                The Projection Room / PL/pgSQL Triggers
              </div>
              <h2 className="text-lg font-serif font-bold text-cv-text mt-0.5 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cv-moss fill-current" />
                <span>Real-Time Trigger Verification Lab</span>
              </h2>
              <p className="text-xs text-cv-muted leading-relaxed mt-1">
                Trigger <code className="text-cv-moss font-mono">trg_update_movie_rating</code> recalculates <code className="text-cv-text font-mono">avg_rating</code> and <code className="text-cv-text font-mono">review_count</code> on review insert/update. Trigger <code className="text-cv-moss font-mono">trg_log_review_activity</code> automatically writes an immutable audit record to <code className="text-cv-text font-mono">activity_logs</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-cv-text block mb-1">Target Film</label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="w-full bg-cv-surface border border-cv-border/40 rounded-xl px-3 py-2 text-xs text-cv-text focus:outline-none focus:border-cv-moss font-mono"
                >
                  <option value="1">1 - Inception</option>
                  <option value="2">2 - Interstellar</option>
                  <option value="3">3 - The Dark Knight</option>
                  <option value="4">4 - Dune: Part Two</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-cv-text block mb-1">Inject Rating Score</label>
                <select
                  value={injectedRating}
                  onChange={(e) => setInjectedRating(e.target.value)}
                  className="w-full bg-cv-surface border border-cv-border/40 rounded-xl px-3 py-2 text-xs text-cv-text font-mono font-bold focus:outline-none focus:border-cv-moss"
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
                  className="w-full py-2.5 rounded-xl bg-cv-moss hover:bg-cv-moss/90 text-cv-ink font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{isTriggerTesting ? 'Testing Trigger...' : 'Execute Test Trigger Mutation'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cv-surface-2 border border-cv-border/30 text-[11px] text-cv-muted flex items-center gap-2">
              <span className="text-cv-moss">ℹ Note:</span>
              <span>This triggers real PL/pgSQL database code, executing live DML on the active database engine to verify real-time trigger synchronization.</span>
            </div>
          </div>

          {triggerDemoResult && (
            <div className="p-6 rounded-2xl bg-cv-shell border border-cv-border/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-cv-border/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cv-moss" />
                  <h3 className="text-xs font-bold text-cv-text uppercase tracking-wider font-mono">
                    Trigger Trace: {triggerDemoResult.targetMovie}
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cv-moss/10 border border-cv-moss/30 text-cv-moss">
                  Triggers Fired Successfully
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                
                {/* 1. Before */}
                <div className="p-4 rounded-xl bg-cv-surface border border-cv-border/30 space-y-2">
                  <div className="text-[11px] text-cv-muted font-mono uppercase tracking-wider">
                    1. Before Mutation
                  </div>
                  <div className="font-mono space-y-1">
                    <div className="text-cv-muted text-xs">
                      Avg: <strong className="text-cv-text text-sm">{triggerDemoResult.step1_before.avg_rating}</strong>
                    </div>
                    <div className="text-cv-muted text-xs">
                      Reviews: <strong className="text-cv-text text-sm">{triggerDemoResult.step1_before.review_count}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. DML Mutation */}
                <div className="p-4 rounded-xl bg-cv-surface border border-cv-border/30 space-y-2">
                  <div className="text-[11px] text-cv-muted font-mono uppercase tracking-wider">
                    2. DML Mutation Executed
                  </div>
                  <div className="font-mono space-y-1">
                    <div className="text-cv-muted text-xs">
                      Operation: <span className="text-cv-moss font-bold">{triggerDemoResult.step2_action.operation}</span>
                    </div>
                    <div className="text-cv-muted text-xs">
                      Rating Injected: <span className="text-cv-text font-bold">{triggerDemoResult.step2_action.injectedRating}★</span>
                    </div>
                  </div>
                </div>

                {/* 3. After */}
                <div className="p-4 rounded-xl bg-cv-moss/10 border border-cv-moss/30 space-y-2">
                  <div className="text-[11px] text-cv-moss font-mono uppercase tracking-wider font-bold">
                    3. After Trigger Sync
                  </div>
                  <div className="font-mono space-y-1">
                    <div className="text-cv-muted text-xs">
                      New Avg: <strong className="text-cv-moss text-sm">{triggerDemoResult.step3_after.avg_rating}</strong>
                    </div>
                    <div className="text-cv-muted text-xs">
                      New Count: <strong className="text-cv-text text-sm">{triggerDemoResult.step3_after.review_count}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* 4. Audit Log Entry */}
              {triggerDemoResult.step4_trigger_audit_log && (
                <div className="p-4 rounded-xl bg-[#0d130d] border border-cv-border/40 space-y-2">
                  <div className="text-[11px] uppercase font-mono font-bold text-cv-muted flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-cv-moss" />
                    <span>Audit Log Record Created via <code className="text-cv-text">trg_log_review_activity</code>:</span>
                  </div>
                  <pre className="font-mono text-xs text-cv-moss overflow-x-auto leading-relaxed">
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
        <div>
          <InteractiveErDiagram />
        </div>
      )}

      {/* TAB 4: PROCEDURES & VIEWS */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          
          <div className="p-6 rounded-2xl bg-cv-shell border border-cv-border/30 space-y-4 shadow-xl">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-cv-muted">
                The Projection Room / Architecture Catalog
              </div>
              <h2 className="text-lg font-serif font-bold text-cv-text mt-0.5 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cv-moss" /> Registered PL/pgSQL Triggers
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {schemaData?.triggers?.map((trg: any) => (
                <div key={trg.name} className="p-4 rounded-xl bg-cv-surface border border-cv-border/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="font-mono font-bold text-xs text-cv-text">{trg.name}</div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cv-surface-2 text-cv-moss border border-cv-border/30">
                      {trg.events}
                    </span>
                  </div>
                  <div className="text-[11px] text-cv-muted font-mono">Target: {trg.table}</div>
                  <p className="text-xs text-cv-muted leading-relaxed">{trg.purpose}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-cv-shell border border-cv-border/30 space-y-4 shadow-xl">
            <div>
              <h2 className="text-lg font-serif font-bold text-cv-text flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cv-moss" /> Stored Functions & Analytical Views
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {schemaData?.procedures?.map((proc: any) => (
                <div key={proc.name} className="p-4 rounded-xl bg-cv-surface border border-cv-border/30 space-y-1.5">
                  <div className="font-mono font-bold text-xs text-cv-text">{proc.name}</div>
                  <p className="text-xs text-cv-muted leading-relaxed">{proc.purpose}</p>
                </div>
              ))}
              {schemaData?.views?.map((view: any) => (
                <div key={view.name} className="p-4 rounded-xl bg-cv-surface border border-cv-border/30 space-y-1.5">
                  <div className="font-mono font-bold text-xs text-cv-text">{view.name}</div>
                  <p className="text-xs text-cv-muted leading-relaxed">{view.purpose}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
