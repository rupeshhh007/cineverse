'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import InteractiveErDiagram from '@/components/InteractiveErDiagram';
import { 
  Terminal, 
  Play, 
  Layers, 
  Clock, 
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
  RotateCcw,
  GitBranch,
  Search,
  ExternalLink
} from 'lucide-react';

const PRESET_QUERIES = [
  {
    name: 'v_trending_movies (Bayesian weighted prior)',
    sql: `SELECT 
    m.title,
    m.avg_rating,
    m.review_count,
    v.bayesian_score
FROM movies m
LEFT JOIN v_trending_movies v ON m.movie_id = v.movie_id
ORDER BY v.bayesian_score DESC NULLS LAST
LIMIT 8;`
  },
  {
    name: 'Multi-Table JOIN with Aggregation (Movies, Genres, Reviews)',
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
    name: 'Window Function: Leaderboard with DENSE_RANK()',
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
    name: 'PL/pgSQL Function: fn_get_user_analytics(1)',
    sql: `SELECT fn_get_user_analytics(1) AS user_1_analytics;`
  },
  {
    name: 'PL/pgSQL Procedure: fn_recommend_movies(1, 5)',
    sql: `SELECT * FROM fn_recommend_movies(1, 5);`
  },
  {
    name: 'Information Schema: Relational Foreign Keys',
    sql: `SELECT 
    tc.table_name AS source_table, 
    kcu.column_name AS fk_column, 
    ccu.table_name AS target_table,
    ccu.column_name AS target_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;`
  }
];

export default function DbmsConsolePage() {
  const [activeTab, setActiveTab] = useState<'query' | 'schema' | 'triggers' | 'functions'>('query');
  const [sql, setSql] = useState(PRESET_QUERIES[0].sql);
  const [allowWrite, setAllowWrite] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<{
    columns: string[];
    rows: any[];
    rowCount?: number;
    durationMs?: number;
  } | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [schemaData, setSchemaData] = useState<any>(null);
  const [tableFilter, setTableFilter] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('movies');
  const [copiedSql, setCopiedSql] = useState(false);

  // Trigger Lab test state
  const [triggerMovieId, setTriggerMovieId] = useState('1');
  const [triggerScore, setTriggerScore] = useState('9.8');
  const [triggerTestResult, setTriggerTestResult] = useState<any>(null);
  const [isTestingTrigger, setIsTestingTrigger] = useState(false);

  // Load live schema and engine metadata
  useEffect(() => {
    fetch('/api/dbms/schema')
      .then(r => r.json())
      .then(data => {
        setSchemaData(data);
      })
      .catch(console.error);

    // Initial query execution
    handleExecute(PRESET_QUERIES[0].sql);
  }, []);

  const handleExecute = async (sqlToRun?: string) => {
    const code = sqlToRun || sql;
    setIsExecuting(true);
    setExecutionError(null);
    try {
      const res = await fetch('/api/dbms/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: code, allowWrite }),
      });
      const data = await res.json();
      if (!data.success) {
        setExecutionError(data.error || 'Execution failed');
        setQueryResults(null);
      } else {
        setQueryResults(data);
      }
    } catch (err: any) {
      setExecutionError(err.message || 'Network request failed');
      setQueryResults(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 1500);
  };

  const handleExportCsv = () => {
    if (!queryResults || !queryResults.rows || queryResults.rows.length === 0) return;
    const cols = queryResults.columns;
    const csvRows = [
      cols.join(','),
      ...queryResults.rows.map(row => 
        cols.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cineverse_query_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTestTrigger = async () => {
    setIsTestingTrigger(true);
    try {
      const res = await fetch('/api/dbms/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: parseInt(triggerMovieId, 10),
          rating: parseFloat(triggerScore),
        }),
      });
      const data = await res.json();
      setTriggerTestResult(data);
    } catch (err: any) {
      setTriggerTestResult({ error: err.message });
    } finally {
      setIsTestingTrigger(false);
    }
  };

  const tablesList = schemaData?.tables ? Object.keys(schemaData.tables) : [
    'movies', 'reviews', 'users', 'movie_genres', 'genres', 
    'watchlists', 'watchlist_items', 'activity_logs', 'review_likes', 
    'follows', 'people', 'movie_cast', 'app_meta', 'db_action_traces'
  ];

  const filteredTables = tablesList.filter(t => 
    t.toLowerCase().includes(tableFilter.toLowerCase())
  );

  const engineLabel = schemaData?.engine?.label || 'POSTGRESQL 16 ENGINE';

  return (
    <div className="space-y-4 animate-fade-in text-[#f4eee6]">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs text-[#afa198]">
        <div className="flex items-center gap-2">
          <strong className="text-white font-bold">DB Studio</strong>
          <span className="opacity-40">/</span>
          <span>{activeTab === 'query' ? 'SQL Console' : activeTab === 'schema' ? 'Schema Architecture' : activeTab === 'triggers' ? 'Trigger Lab' : 'Stored Procedures & Views'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="border border-[#98634b] rounded-full text-[#e7ae96] bg-[#4a2b22]/30 px-3 py-1 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#dd7058] animate-pulse" />
            <span>{engineLabel}</span>
          </span>
        </div>
      </div>

      {/* Heading & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[30px] font-black text-[#f4eee6] tracking-[-1.1px] leading-tight m-0">
            Explore the data behind cinema.
          </h1>
          <p className="text-xs sm:text-[12px] text-[#aba096] mt-1 mb-0">
            Run queries, inspect relationships, and understand how Cineverse works.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#171615] p-1 rounded-xl border border-[#54433b]/50 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('query')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'query' 
                ? 'bg-[#eee7dd] text-[#1d1713] font-bold shadow-sm' 
                : 'text-[#bcaea3] hover:text-white'
            }`}
          >
            Query
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'schema' 
                ? 'bg-[#eee7dd] text-[#1d1713] font-bold shadow-sm' 
                : 'text-[#bcaea3] hover:text-white'
            }`}
          >
            Schema
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('triggers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'triggers' 
                ? 'bg-[#eee7dd] text-[#1d1713] font-bold shadow-sm' 
                : 'text-[#bcaea3] hover:text-white'
            }`}
          >
            Triggers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('functions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'functions' 
                ? 'bg-[#eee7dd] text-[#1d1713] font-bold shadow-sm' 
                : 'text-[#bcaea3] hover:text-white'
            }`}
          >
            Functions & views
          </button>
        </div>
      </div>

      {/* TAB 1: QUERY (DB STUDIO 3-PANE WORKSPACE) */}
      {activeTab === 'query' && (
        <div className="grid grid-cols-1 lg:grid-cols-[215px_1fr_265px] gap-3.5 min-h-[580px]">
          {/* Left Column: Schema Browser */}
          <div className="bg-[#211e1b] border border-[#574337] rounded-2xl p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-sm font-bold text-white tracking-tight">
                Schema browser
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#a39589]" />
                <input
                  type="text"
                  placeholder="Filter tables..."
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  className="w-full bg-[#151311] border border-[#5a4a40] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[#f4eee6] placeholder-[#a39589] focus:outline-none focus:border-[#dd7058]"
                />
              </div>

              {/* Table List */}
              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                {filteredTables.map(tableName => {
                  const cols = schemaData?.tables?.[tableName]?.length || 0;
                  const isSelected = selectedTable === tableName;
                  return (
                    <button
                      key={tableName}
                      type="button"
                      onClick={() => {
                        setSelectedTable(tableName);
                        setSql(`SELECT * FROM ${tableName} LIMIT 10;`);
                        handleExecute(`SELECT * FROM ${tableName} LIMIT 10;`);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                        isSelected 
                          ? 'bg-[#684638]/60 text-white font-semibold' 
                          : 'text-[#c0b5aa] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[#a79a8f] font-mono text-[10px]">▦</span>
                        <span className="truncate">{tableName}</span>
                      </div>
                      {cols > 0 && (
                        <span className="text-[10px] font-mono text-[#a79a8f] shrink-0">
                          {cols} cols
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] text-[10px] text-[#97887e] font-mono">
              Public schema · {tablesList.length} core tables
            </div>
          </div>

          {/* Center Column: SQL Editor & Results Table */}
          <div className="flex flex-col gap-3.5 min-w-0">
            {/* Editor Box */}
            <div className="bg-[#161514] border border-[#574439] rounded-2xl flex flex-col overflow-hidden h-[330px]">
              {/* Editor Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#544137] bg-black/20 text-xs">
                <div className="flex items-center gap-3">
                  <strong className="text-white font-bold text-xs">query_01.sql</strong>
                  <span className="text-[10px] text-[#97887e]">● unsaved</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-[10px] font-mono text-[#97887e]">
                    ⌘↵ to run
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="text-[11px] text-[#c9c3bc] hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSql ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Presets Bar */}
              <div className="px-4 py-1.5 bg-[#121110] border-b border-[#544137]/60 flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#a69a8f] uppercase tracking-wider shrink-0">
                  Preset:
                </span>
                <select
                  onChange={(e) => {
                    const preset = PRESET_QUERIES.find(p => p.name === e.target.value);
                    if (preset) {
                      setSql(preset.sql);
                      handleExecute(preset.sql);
                    }
                  }}
                  className="bg-transparent text-xs text-[#dd7058] focus:outline-none w-full cursor-pointer truncate"
                >
                  {PRESET_QUERIES.map(p => (
                    <option key={p.name} value={p.name} className="bg-[#1b1714] text-[#f4eee6]">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SQL Textarea */}
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleExecute();
                  }
                }}
                className="flex-1 w-full bg-transparent p-4 font-mono text-xs leading-[1.8] text-[#d8c9be] focus:outline-none resize-none selection:bg-[#684638]"
                spellCheck={false}
              />

              {/* Editor Footer Bar */}
              <div className="flex items-center justify-between px-3.5 py-2 border-t border-white/[0.08] bg-black/20 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllowWrite(!allowWrite)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      allowWrite 
                        ? 'bg-amber-950/60 border border-amber-600/50 text-amber-300' 
                        : 'bg-white/[0.03] border border-white/10 text-[#97887e]'
                    }`}
                  >
                    <span>{allowWrite ? '⚠️ Write Mode enabled' : '♢ Read-only mode'}</span>
                  </button>
                  <span className="hidden md:inline text-[11px] text-[#97887e]">
                    · Live PostgreSQL API
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExecute(`EXPLAIN ANALYZE ${sql}`)}
                    disabled={isExecuting}
                    className="px-3 py-1.5 rounded-lg border border-[#574439] hover:bg-white/[0.04] text-[11px] text-[#c0b5aa] transition-colors"
                  >
                    EXPLAIN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecute()}
                    disabled={isExecuting}
                    className="px-4 py-1.5 rounded-lg bg-[#dd7058] hover:bg-[#e07f69] text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run query</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Table Box */}
            <div className="bg-[#1d1b19] border border-[#574439] rounded-2xl flex flex-col overflow-hidden min-h-[230px] flex-1">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#574439] bg-black/20 text-xs">
                <div className="flex items-center gap-2">
                  <strong className="text-white font-bold text-xs">Result set</strong>
                  <span className="text-[#aaa095] font-normal">/ preview</span>
                </div>
                <div className="flex items-center gap-3">
                  {queryResults && (
                    <span className="text-[11px] text-[#97887e] font-mono">
                      {queryResults.rows.length} rows · {queryResults.durationMs || 0}ms
                    </span>
                  )}
                  {queryResults && queryResults.rows.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="text-[11px] text-[#dd7058] hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export CSV</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table Data or Error Display */}
              <div className="flex-1 overflow-auto p-0">
                {executionError ? (
                  <div className="p-4 bg-red-950/20 border-l-4 border-red-500 m-3 rounded text-xs text-red-200 font-mono space-y-1">
                    <strong className="block text-red-400 font-bold">Query Error:</strong>
                    <div>{executionError}</div>
                  </div>
                ) : queryResults && queryResults.rows.length > 0 ? (
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#2a241f] border-b border-[#3b322c]">
                        {queryResults.columns.map((col, idx) => (
                          <th key={idx} className="text-left font-semibold text-[#bcad9f] px-3 py-2 uppercase tracking-wider text-[10px]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-[#3b322c]/50 hover:bg-white/[0.02] transition-colors">
                          {queryResults.columns.map((col, cIdx) => {
                            const val = row[col];
                            const isNumeric = typeof val === 'number';
                            return (
                              <td key={cIdx} className={`px-3 py-2 text-[#eee2d7] ${isNumeric ? 'font-bold text-[#e6a188]' : ''}`}>
                                {val === null || val === undefined 
                                  ? <span className="text-[#6c5a4c] italic">null</span> 
                                  : typeof val === 'object' 
                                    ? JSON.stringify(val) 
                                    : String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[140px] text-xs text-[#97887e]">
                    {isExecuting ? 'Running query in PostgreSQL...' : 'Execute a query to inspect live records'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: "Where this data appears" (Data Lineage) */}
          <aside className="bg-[#24201d] border border-[#574439] rounded-2xl p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white m-0">Where this data appears</h2>
                <p className="text-[11px] text-[#b4a79b] leading-relaxed mt-1">
                  Understand how SQL query results become the film cards and community stats visible in Discover.
                </p>
              </div>

              {/* Poster Snapshot */}
              <div className="h-[140px] rounded-xl overflow-hidden relative border border-[#664839] p-3.5 flex flex-col justify-end shadow-md group bg-[#1c1815]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-[1]" />
                <img
                  src="https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEhniE9iAOhHP.jpg"
                  alt="Inception"
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = '0';
                  }}
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.6] group-hover:scale-105 transition-transform duration-500"
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TableIcon className="w-3.5 h-3.5 text-[#dd7058]" />
                    <span className="text-[10px] font-mono text-[#dd7058] uppercase font-bold tracking-wider">
                      LIVE RECORD #1
                    </span>
                  </div>
                  <strong className="text-base font-bold text-white block leading-tight">
                    Inception (2010)
                  </strong>
                  <small className="text-[10px] text-[#eabfa2] block mt-0.5">
                    ★ 9.8 community rating · ranked #1 in Sci-Fi
                  </small>
                </div>
              </div>

              {/* Data Lineage Flow */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#b7a79c] mb-2">
                  DATA LINEAGE
                </div>
                <div className="font-mono text-[11px] text-[#d7c8bc] bg-[#191714] p-3 rounded-lg border border-[#584438] space-y-1.5 leading-relaxed">
                  <div><span className="text-[#dd7058] font-bold">movies</span></div>
                  <div className="text-[#a99c91] pl-3">↳ movie_id, avg_rating</div>
                  <div><span className="text-[#dd7058] font-bold">v_trending_movies</span></div>
                  <div className="text-[#a99c91] pl-3">↳ weighted Bayesian ranking</div>
                  <div><span className="text-[#dd7058] font-bold">Discover</span></div>
                  <div className="text-[#a99c91] pl-3">↳ featured cards & shelves</div>
                </div>
              </div>

              {/* Link to CineTrace */}
              <Link
                href="/trace"
                className="w-full py-2.5 px-3 rounded-lg border border-[#83604c] hover:border-[#dd7058] bg-white/[0.02] text-[#edc2a9] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors block text-center"
              >
                <span>Explore mutation lineage in CineTrace →</span>
              </Link>
            </div>

            <p className="text-[10px] text-[#8f8075] mt-3 leading-relaxed border-t border-white/[0.08] pt-3">
              Values, execution latency, and relational integrity are powered by the live database engine.
            </p>
          </aside>
        </div>
      )}

      {/* TAB 2: SCHEMA (INTERACTIVE ER DIAGRAM) */}
      {activeTab === 'schema' && (
        <div className="bg-[#161514] border border-[#574439] rounded-2xl p-4">
          <InteractiveErDiagram />
        </div>
      )}

      {/* TAB 3: TRIGGERS (TRIGGER LAB) */}
      {activeTab === 'triggers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trigger 1: Rating Recalculation Tester */}
            <div className="bg-[#1f1c1a] border border-[#544238] rounded-2xl p-5 space-y-4">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#dd7058]/20 text-[#f2a280] font-bold uppercase">
                  AFTER INSERT OR UPDATE OR DELETE ON reviews
                </span>
                <h3 className="text-base font-bold text-white mt-2 mb-1">
                  trg_update_movie_rating
                </h3>
                <p className="text-xs text-[#a99c91] leading-relaxed">
                  Automatically recalculates <code className="text-[#f2a280]">movies.avg_rating</code> and <code className="text-[#f2a280]">review_count</code> in real time when any user rates a film.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-[#a69a8f] uppercase tracking-wider block mb-1">
                    Movie ID
                  </label>
                  <input
                    type="number"
                    value={triggerMovieId}
                    onChange={(e) => setTriggerMovieId(e.target.value)}
                    className="w-full bg-[#151311] border border-[#58463c] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#dd7058]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#a69a8f] uppercase tracking-wider block mb-1">
                    New Test Score (1-10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={triggerScore}
                    onChange={(e) => setTriggerScore(e.target.value)}
                    className="w-full bg-[#151311] border border-[#58463c] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#dd7058]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestTrigger}
                disabled={isTestingTrigger}
                className="w-full py-2.5 px-4 rounded-lg bg-[#eee7dd] hover:bg-white text-[#1d1713] text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isTestingTrigger ? 'Executing trigger...' : 'Simulate Rating Mutation & Verify Trigger'}
              </button>

              {triggerTestResult && (
                <div className="font-mono text-xs p-3 rounded-lg bg-[#0d0d0c] border border-[#3d352f] space-y-1.5">
                  <div className="text-[10px] text-[#f2a280] font-bold">TRIGGER EXECUTION REPORT:</div>
                  <div>Movie: {triggerTestResult.movie?.title}</div>
                  <div>Previous Avg: {triggerTestResult.before?.avg_rating || '—'} (reviews: {triggerTestResult.before?.review_count || '—'})</div>
                  <div className="text-green-400">New Avg: {triggerTestResult.after?.avg_rating} (reviews: {triggerTestResult.after?.review_count})</div>
                  <div className="text-[10px] text-[#a99c91]">Trigger: trg_update_movie_rating executed automatically by PostgreSQL!</div>
                </div>
              )}
            </div>

            {/* Trigger 2 & 3 Descriptions */}
            <div className="space-y-4">
              <div className="bg-[#1f1c1a] border border-[#544238] rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#dd7058]/20 text-[#f2a280] font-bold uppercase">
                  AFTER INSERT ON reviews
                </span>
                <h3 className="text-base font-bold text-white mt-1 mb-0.5">
                  trg_log_review_activity
                </h3>
                <p className="text-xs text-[#a99c91] leading-relaxed">
                  Automatically inserts an audit log entry in <code className="text-[#f2a280]">activity_logs</code> containing movie metadata and rating details whenever a brand new review is submitted.
                </p>
                <div className="text-[11px] font-mono text-[#d8c9be] bg-[#0d0d0c] p-2.5 rounded border border-[#3d352f]">
                  INSERT INTO activity_logs (user_id, activity_type, target_id, metadata)...
                </div>
              </div>

              <div className="bg-[#1f1c1a] border border-[#544238] rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#dd7058]/20 text-[#f2a280] font-bold uppercase">
                  AFTER INSERT OR DELETE ON review_likes
                </span>
                <h3 className="text-base font-bold text-white mt-1 mb-0.5">
                  trg_update_review_likes
                </h3>
                <p className="text-xs text-[#a99c91] leading-relaxed">
                  Synchronizes total helpful votes counter on <code className="text-[#f2a280]">reviews.likes_count</code> automatically when users like or unlike reviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FUNCTIONS & VIEWS */}
      {activeTab === 'functions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stored Procedures */}
          <div className="bg-[#1f1c1a] border border-[#544238] rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white m-0">
              Stored Procedures & Analytical Functions
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#151311] border border-[#58463c] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-mono text-[#f2a280]">fn_recommend_movies(p_user_id, p_limit)</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('query');
                      setSql(`SELECT * FROM fn_recommend_movies(1, 6);`);
                      handleExecute(`SELECT * FROM fn_recommend_movies(1, 6);`);
                    }}
                    className="text-[11px] text-[#dd7058] hover:underline font-bold"
                  >
                    Run in Query Tab →
                  </button>
                </div>
                <p className="text-xs text-[#a99c91]">
                  Collaborative genre-affinity algorithm matching high-rated user favorites with unreviewed films.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#151311] border border-[#58463c] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-mono text-[#f2a280]">fn_get_user_analytics(p_user_id)</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('query');
                      setSql(`SELECT fn_get_user_analytics(1) AS user_1_analytics;`);
                      handleExecute(`SELECT fn_get_user_analytics(1) AS user_1_analytics;`);
                    }}
                    className="text-[11px] text-[#dd7058] hover:underline font-bold"
                  >
                    Run in Query Tab →
                  </button>
                </div>
                <p className="text-xs text-[#a99c91]">
                  Aggregates total watch time, average rating, rating distribution histogram (1-10), and top genres.
                </p>
              </div>
            </div>
          </div>

          {/* Analytical Views */}
          <div className="bg-[#1f1c1a] border border-[#544238] rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white m-0">
              Advanced Relational Views
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#151311] border border-[#58463c] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-mono text-[#f2a280]">v_trending_movies</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('query');
                      setSql(`SELECT * FROM v_trending_movies LIMIT 10;`);
                      handleExecute(`SELECT * FROM v_trending_movies LIMIT 10;`);
                    }}
                    className="text-[11px] text-[#dd7058] hover:underline font-bold"
                  >
                    Query View →
                  </button>
                </div>
                <p className="text-xs text-[#a99c91]">
                  Ranks films using a true Bayesian weighted score with global mean rating prior and smoothing threshold.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#151311] border border-[#58463c] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-mono text-[#f2a280]">v_user_leaderboard</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('query');
                      setSql(`SELECT * FROM v_user_leaderboard LIMIT 10;`);
                      handleExecute(`SELECT * FROM v_user_leaderboard LIMIT 10;`);
                    }}
                    className="text-[11px] text-[#dd7058] hover:underline font-bold"
                  >
                    Query View →
                  </button>
                </div>
                <p className="text-xs text-[#a99c91]">
                  Calculates community ranking with SQL window function <code className="text-[#f2a280]">DENSE_RANK()</code>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#151311] border border-[#58463c] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-mono text-[#f2a280]">v_recent_activity_feed</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('query');
                      setSql(`SELECT * FROM v_recent_activity_feed LIMIT 10;`);
                      handleExecute(`SELECT * FROM v_recent_activity_feed LIMIT 10;`);
                    }}
                    className="text-[11px] text-[#dd7058] hover:underline font-bold"
                  >
                    Query View →
                  </button>
                </div>
                <p className="text-xs text-[#a99c91]">
                  Unified polymorphic-safe feed joining audit logs with users, movies, and custom watchlists.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
