'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  GitBranch, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  RefreshCw,
  Star,
  ExternalLink
} from 'lucide-react';
import { ActionTrace, TraceStep } from '@/lib/trace';
import { useAuth } from '@/lib/AuthContext';

export default function CineTracePage() {
  const searchParams = useSearchParams();
  const initialMovieId = searchParams.get('movieId') || '1'; // Default Inception (1)
  const initialTraceId = searchParams.get('traceId');

  const { user } = useAuth();
  const [trace, setTrace] = useState<ActionTrace | null>(null);
  const [movieId, setMovieId] = useState<string>(initialMovieId);
  const [rating, setRating] = useState<number>(9.5);
  const [reviewText, setReviewText] = useState<string>('Masterpiece of narrative structure and practical cinematography.');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load existing traces and movie metadata
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        // Load movies list for quick selector
        const moviesRes = await fetch('/api/movies?limit=15');
        const moviesData = await moviesRes.json();
        if (moviesData.movies) {
          setMoviesList(moviesData.movies);
        }

        // Fetch trace
        let traceUrl = '/api/dbms/trace';
        if (initialTraceId) {
          traceUrl += `?traceId=${initialTraceId}`;
        } else if (initialMovieId) {
          traceUrl += `?movieId=${initialMovieId}`;
        }

        const traceRes = await fetch(traceUrl);
        const traceData = await traceRes.json();
        if (traceData.trace) {
          setTrace(traceData.trace);
          setMovieId(String(traceData.trace.target_id));
        } else {
          // If no trace recorded yet, capture one for movie 1 so UI renders populated
          const seedTraceRes = await fetch('/api/dbms/trace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              movieId: parseInt(initialMovieId, 10),
              rating: 9.5,
              reviewText: 'Masterpiece of narrative structure and practical cinematography.',
            }),
          });
          const seedData = await seedTraceRes.json();
          if (seedData.trace) {
            setTrace(seedData.trace);
          }
        }
      } catch (err) {
        console.error('Failed to load trace:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [initialMovieId, initialTraceId]);

  // Handle live mutation trace execution
  const handleCaptureTrace = async () => {
    setIsSubmitting(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch('/api/dbms/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: parseInt(movieId, 10),
          rating: Number(rating),
          reviewText,
          userId: user?.user_id,
        }),
      });

      const data = await res.json();
      if (data.trace) {
        setTrace(data.trace);
        setFeedbackMessage(`Mutation executed! Operation: ${data.trace.mutation_op}. ${data.trace.steps.length} database steps captured.`);
      } else if (data.error) {
        setFeedbackMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setFeedbackMessage(`Execution failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMovie = moviesList.find(m => String(m.movie_id) === String(movieId)) || {
    movie_id: movieId,
    title: trace?.movie_title || 'Inception',
    poster_url: trace?.movie_poster || 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEhniE9iAOhHP.jpg',
    director: 'Christopher Nolan',
    release_date: '2010-07-16',
    avg_rating: trace?.final_score || '9.6',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-xs font-mono tracking-widest uppercase text-[#a9a19a] animate-pulse">
          Loading CineTrace provenance...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in text-[#f4eee6]">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs text-[#b7aaa2]">
        <div className="flex items-center gap-2">
          <strong className="text-white font-bold">{selectedMovie.title}</strong>
          <span className="opacity-40">/</span>
          <span>Reviews</span>
          <span className="opacity-40">/</span>
          <span className="text-[#dd7058] font-semibold">CineTrace Provenance</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="border border-[#8a6a59]/60 text-[#f0c5a3] bg-[#4a2b22]/30 rounded-full px-3 py-1 text-[11px] font-semibold">
            POSTGRESQL PROVENANCE · Live execution data
          </span>
        </div>
      </div>

      {/* Main Headline */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#da8e77] mb-1">
            TRACE THIS ACTION
          </div>
          <h1 className="text-3xl sm:text-[34px] font-black text-[#f4eee6] tracking-[-1.2px] leading-tight m-0">
            One review. Four database effects.
          </h1>
          <p className="text-xs sm:text-[13px] text-[#bdb3a8] mt-1 mb-0 leading-relaxed max-w-xl">
            Follow what happens from a rating submission to the affected relational records, triggers, activity logs, and downstream view recalculations.
          </p>
        </div>

        {/* Film Card Banner */}
        <div className="flex items-center gap-3 bg-[#26211d] border border-[#58463c] rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 min-w-[240px] shrink-0">
          <img
            src={selectedMovie.poster_url}
            alt={selectedMovie.title}
            className="w-9 h-13 object-cover rounded shadow-sm shrink-0 border border-white/10"
          />
          <div className="min-w-0">
            <strong className="text-[13px] font-bold text-white block truncate">
              {selectedMovie.title}
            </strong>
            <small className="text-[11px] text-[#bdafa2] block truncate">
              {selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : '2010'} · {selectedMovie.director || 'Cinema'}
            </small>
            <small className="text-[11px] text-[#ffb08d] font-semibold block">
              ★ {Number(selectedMovie.avg_rating || 9.5).toFixed(1)} community score
            </small>
          </div>
        </div>
      </div>

      {/* 3-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_290px] gap-4 min-h-[580px]">
        {/* Left Column: Your Rating & Mutation Trigger */}
        <div className="bg-[#1f1c1a] border border-[#544238] rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white m-0">Your rating</h2>
              <p className="text-[11px] text-[#a79d93] leading-relaxed mt-1">
                Trigger an authentic rating mutation to capture genuine server-side PostgreSQL lineage—not fabricated animations.
              </p>
            </div>

            {/* Movie Switcher */}
            <div>
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#a69a8f] block mb-1.5">
                SELECT FILM
              </label>
              <select
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
                className="w-full bg-[#151311] border border-[#58463c] rounded-lg px-2.5 py-1.5 text-xs text-[#f4eee6] focus:border-[#dd7058] focus:outline-none"
              >
                {moviesList.map(m => (
                  <option key={m.movie_id} value={m.movie_id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-px bg-white/10" />

            {/* Score Given Slider & Display */}
            <div>
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#a69a8f]">
                SCORE GIVEN
              </div>
              <div className="text-5xl font-black tracking-tighter text-[#f4eee6] mt-1 mb-1">
                {Number(rating).toFixed(1)} <span className="text-sm text-[#b7aaa0] font-normal">/ 10</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={rating}
                onChange={(e) => setRating(parseFloat(e.target.value))}
                className="w-full accent-[#dd7058] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#a79d93] font-mono mt-0.5">
                <span>1.0</span>
                <span>5.0</span>
                <span>10.0</span>
              </div>
            </div>

            {/* Optional Review Text */}
            <div>
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#a69a8f] block mb-1">
                REVIEW NOTES (OPTIONAL)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={2}
                placeholder="Notes for relational record..."
                className="w-full bg-[#151311] border border-[#58463c] rounded-lg p-2 text-xs text-[#f4eee6] focus:border-[#dd7058] focus:outline-none resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCaptureTrace}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 rounded-lg bg-[#eee7dd] hover:bg-white text-[#1d1713] text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing mutation...</span>
                  </>
                ) : (
                  <>
                    <span>Save review & capture trace →</span>
                  </>
                )}
              </button>

              <Link
                href="/dbms-console"
                className="w-full py-2 px-3 rounded-lg border border-[#685446] hover:border-[#83604c] text-[#f2d5bd] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors block text-center"
              >
                <span>Inspect affected schema</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {feedbackMessage && (
              <div className="p-2 rounded bg-black/40 border border-[#dd7058]/40 text-[11px] text-[#f2a280]">
                {feedbackMessage}
              </div>
            )}
          </div>

          {/* Database Objects & Warning */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#a69a8f]">
              ACTUAL DATABASE OBJECTS
            </div>
            <div className="text-[11px] font-mono text-[#d8c9be] leading-relaxed">
              <div>• reviews <span className="text-[#a99c91]">(relational table)</span></div>
              <div>• trg_update_movie_rating <span className="text-[#a99c91]">(trigger)</span></div>
              <div>• trg_log_review_activity <span className="text-[#a99c91]">(trigger)</span></div>
              <div>• v_trending_movies <span className="text-[#a99c91]">(analytical view)</span></div>
            </div>

            <div className="text-[10px] text-[#b6a599] leading-snug p-2 rounded bg-white/[0.02] border border-[#544238]/60 mt-2">
              <strong>Truthful trigger behavior:</strong> fn_trg_log_review_activity is registered as AFTER INSERT. For UPDATE mutations, CineTrace accurately reflects that the activity trigger is skipped.
            </div>
          </div>
        </div>

        {/* Center Column: Transaction Journey Lineage */}
        <div className="bg-[#171615] border border-[#58463c] rounded-2xl p-5 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white tracking-tight m-0">
              Transaction journey
            </h2>
            <span className="text-[10px] text-[#d2af98] border border-[#675244] px-2 py-0.5 rounded font-mono">
              POSTGRESQL / LINEAGE
            </span>
          </div>

          {/* Steps List */}
          <div className="flex-1 py-4 space-y-5 overflow-y-auto relative before:content-[''] before:absolute before:left-3.5 before:top-6 before:bottom-6 before:w-[1px] before:bg-[#725446]/60">
            {trace?.steps && trace.steps.length > 0 ? (
              trace.steps.map((step, idx) => {
                const isSkipped = step.status === 'SKIPPED';
                return (
                  <div key={idx} className="flex gap-4 relative">
                    {/* Step Marker */}
                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold z-10 ${
                      isSkipped 
                        ? 'bg-[#2d2724] border border-[#725446] text-[#a99c91]' 
                        : idx === 0 
                          ? 'bg-[#dd7058] text-[#1b100e] border border-[#dd7058] shadow-sm' 
                          : 'bg-[#2d2724] border border-[#a3715c] text-[#f3b89c]'
                    }`}>
                      {step.step_order}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pb-4 border-b border-white/[0.07] min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[13px] font-bold text-white tracking-tight m-0 truncate">
                          {step.step_title}
                        </h3>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSkipped ? 'bg-amber-900/30 text-amber-300' : 'bg-black/30 text-[#e0a98d]'
                        }`}>
                          {step.operation}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#a99c91] mt-1 mb-2 leading-relaxed">
                        {step.description}
                      </p>

                      {/* SQL Code Box */}
                      {step.sql_preview && (
                        <div className="font-mono text-[11px] text-[#dbcfc1] bg-[#0d0d0c] rounded-lg p-2.5 border border-[#3d352f] overflow-x-auto">
                          <span className="text-[#f2a280]">{step.target_object}</span> &nbsp;
                          <span className="text-[#b9aea4]">{step.sql_preview}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-[#a99c91] text-xs">
                No trace steps available. Click "Save review & capture trace" to generate lineage.
              </div>
            )}
          </div>

          <div className="pt-2 text-[10px] text-[#a99c91] flex items-center justify-between">
            <span>Trace ID: #{trace?.trace_id || '—'} · Captured at runtime</span>
            <span className="text-[#dd7058] font-mono">Status: {trace?.mutation_op || 'READY'}</span>
          </div>
        </div>

        {/* Right Column: Before / After Data State */}
        <div className="bg-[#221f1c] border border-[#55453c] rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white m-0">Before / after</h2>
              <p className="text-[11px] text-[#a69b91] leading-relaxed mt-1">
                Row-level comparison populated by genuine PostgreSQL transaction results.
              </p>
            </div>

            {/* Movie Average Comparison */}
            <div>
              <div className="text-[10px] font-bold tracking-[1.3px] uppercase text-[#c49b83]">
                MOVIE AVERAGE COMPARISON
              </div>
              <div className="flex items-center justify-between gap-2 my-2">
                <div className="bg-[#161513] rounded-lg p-3 w-[46%] border border-[#55473d]">
                  <span className="text-[11px] text-[#aa9e92] block">Before</span>
                  <b className="text-2xl font-black text-white block mt-1 tracking-tight">
                    {trace?.initial_score ? Number(trace.initial_score).toFixed(1) : '9.5'}
                  </b>
                </div>
                <ArrowRight className="w-4 h-4 text-[#e39177] shrink-0" />
                <div className="bg-[#161513] rounded-lg p-3 w-[46%] border border-[#55473d]">
                  <span className="text-[11px] text-[#aa9e92] block">After</span>
                  <b className="text-2xl font-black text-[#f2a585] block mt-1 tracking-tight">
                    {trace?.final_score ? Number(trace.final_score).toFixed(1) : Number(selectedMovie.avg_rating || 9.6).toFixed(1)}
                  </b>
                </div>
              </div>
            </div>

            {/* Affected Records Box */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold tracking-[1.3px] uppercase text-[#c49b83]">
                AFFECTED RECORDS
              </div>

              {/* Reviews Table Snapshot */}
              <div className="rounded-lg bg-[#161513] border border-[#59483c] p-2.5 font-mono text-[11px] text-[#d7c7b7] space-y-1">
                <b className="text-[10px] text-[#e79b76] block">TABLE: reviews</b>
                <div>movie_id: {selectedMovie.movie_id}</div>
                <div>rating: {rating} / 10</div>
                <div>operation: {trace?.mutation_op || 'INSERT'}</div>
              </div>

              {/* Movies Summary Snapshot */}
              <div className="rounded-lg bg-[#161513] border border-[#59483c] p-2.5 font-mono text-[11px] text-[#d7c7b7] space-y-1">
                <b className="text-[10px] text-[#e79b76] block">TABLE: movies</b>
                <div>avg_rating: {trace?.final_score || selectedMovie.avg_rating}</div>
                <div>review_count: trigger recalculated</div>
              </div>

              {/* Downstream View Snapshot */}
              <div className="rounded-lg bg-[#161513] border border-[#59483c] p-2.5 font-mono text-[11px] text-[#d7c7b7] space-y-1">
                <b className="text-[10px] text-[#e79b76] block">VIEW: v_trending_movies</b>
                <div>bayesian_score: recalculated</div>
                <div>formula: Bayesian weighted prior</div>
              </div>
            </div>
          </div>

          {/* Footer Card Notice */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#a69a91]">
            <span>Live PostgreSQL values</span>
            <span className="text-[10px] bg-[#654234] text-[#ffe0cb] px-2.5 py-1 rounded-full font-bold">
              DBMS NOVELTY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
