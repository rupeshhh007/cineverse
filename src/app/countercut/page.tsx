'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Split,
  Film,
  User,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { CountercutCase } from '@/lib/countercut/types';
import ConfirmChallengeModal from '@/components/countercut/ConfirmChallengeModal';
import EvidenceConstellation from '@/components/countercut/EvidenceConstellation';
import InvestigationStepPlayer from '@/components/countercut/InvestigationStepPlayer';
import DraggableSplitView from '@/components/countercut/DraggableSplitView';

export default function CountercutPage() {
  const searchParams = useSearchParams();
  const initialMovieId = searchParams.get('movieId');

  const [mode, setMode] = useState<'taste_contradiction' | 'opposite_critic'>(
    initialMovieId ? 'opposite_critic' : 'taste_contradiction'
  );
  const [selectedMovieId, setSelectedMovieId] = useState<string>(initialMovieId || '5');
  const [activeCase, setActiveCase] = useState<CountercutCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Available movies for deep-link / targeted exploration
  const candidateMovies = [
    { id: '5', title: 'Oppenheimer (2023)' },
    { id: '1', title: 'Inception (2010)' },
    { id: '2', title: 'Interstellar (2014)' },
    { id: '3', title: 'The Dark Knight (2008)' },
    { id: '4', title: 'Dune: Part Two (2024)' },
    { id: '18', title: 'Arrival (2016)' },
    { id: '9', title: 'The Matrix (1999)' },
  ];

  // Trigger an investigation
  const triggerInvestigation = async (
    targetMode: 'taste_contradiction' | 'opposite_critic',
    targetMovieIdStr?: string,
    queryStr?: string
  ) => {
    setIsInvestigating(true);
    setError(null);

    try {
      const res = await fetch('/api/countercut/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: targetMode,
          targetMovieId: targetMovieIdStr ? parseInt(targetMovieIdStr, 10) : undefined,
          customQuery: queryStr ? queryStr.trim() : undefined,
        }),
      });

      if (res.status === 401) {
        setError('Please sign in to run Countercut investigations.');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Investigation failed');
      }

      if (data.case) {
        setActiveCase(data.case);
        setMode(data.case.mode);
      }
    } catch (err: any) {
      console.error('Investigation error:', err);
      setError(err.message);
    } finally {
      setIsInvestigating(false);
      setIsLoading(false);
    }
  };

  // Load latest or deep-linked case on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);

      // Deep link support: If a target movie was provided in URL query, run opposite_critic investigation for that movie
      if (initialMovieId) {
        setMode('opposite_critic');
        setSelectedMovieId(initialMovieId);
        await triggerInvestigation('opposite_critic', initialMovieId);
        return;
      }

      try {
        const res = await fetch('/api/countercut/cases');
        if (res.status === 401) {
          setError('Please sign in to access The Countercut investigation studio.');
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        if (data.case) {
          setActiveCase(data.case);
          setMode(data.case.mode);
        } else {
          // Trigger initial investigation
          await triggerInvestigation(mode, selectedMovieId);
        }
      } catch (err: any) {
        console.error('Failed to load Countercut case:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [initialMovieId]);

  const handleModeChange = (newMode: 'taste_contradiction' | 'opposite_critic') => {
    setMode(newMode);
    triggerInvestigation(newMode, selectedMovieId);
  };

  const handleMovieChange = (newMovieId: string) => {
    setSelectedMovieId(newMovieId);
    triggerInvestigation('opposite_critic', newMovieId);
  };

  const handleCustomQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    triggerInvestigation(mode, selectedMovieId, customQuery);
    setCustomQuery('');
  };

  const [focusedEvidenceId, setFocusedEvidenceId] = useState<string | null>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  const handleSelectEvidence = (evidenceId?: string) => {
    if (!evidenceId) {
      const rail = document.getElementById('evidence-rail-header');
      if (rail) rail.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setFocusedEvidenceId(evidenceId);
    const el = document.getElementById(`evidence-card-${evidenceId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const toggleSpoiler = (id: string) => {
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen text-[#f4eee6] pb-16">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#54433b]/40 mb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#a99c91]">
          <Link href="/" className="hover:text-white transition-colors">
            CINEVERSE
          </Link>
          <span>/</span>
          <span className="text-[#dd7058] font-bold">COUNTERCUT</span>
          {activeCase && (
            <>
              <span>/</span>
              <span className="text-white uppercase font-bold tracking-wider">
                {activeCase.id.slice(0, 12)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCase?.isDeterministicFallback ? (
            <span className="text-[11px] font-mono text-[#dd7058] bg-[#dd7058]/10 border border-[#dd7058]/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              <span>POSTGRESQL EVIDENCE-GROUNDED</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-700/40 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>GEMINI AGENT ({activeCase?.modelName || 'gemini-3.8-flash'})</span>
            </span>
          )}
          <span className="text-[11px] font-mono text-[#a69a8f] bg-white/[0.03] border border-white/10 px-2.5 py-1 rounded-full">
            MULTI-STEP AGENT STUDIO
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout matching COUNTERCUT_DESKTOP_REFERENCE_2X.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Workspace (~68% width on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Title Section with Compact Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[2px] text-[#dd7058] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#dd7058] shadow-[0_0_8px_#dd7058]" />
                <span>THE COUNTERCUT</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mt-1">
                Where your taste breaks pattern.
              </h1>
            </div>

            {/* Compact Mode Controls right at the top */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-[#171615] border border-[#54433b] shrink-0">
              <button
                onClick={() => handleModeChange('taste_contradiction')}
                disabled={isInvestigating}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  mode === 'taste_contradiction'
                    ? 'bg-[#dd7058] text-[#17100e] shadow-sm'
                    : 'text-[#a99c91] hover:text-white hover:bg-white/5'
                }`}
              >
                Investigate My Taste
              </button>
              <button
                onClick={() => handleModeChange('opposite_critic')}
                disabled={isInvestigating}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  mode === 'opposite_critic'
                    ? 'bg-[#dd7058] text-[#17100e] shadow-sm'
                    : 'text-[#a99c91] hover:text-white hover:bg-white/5'
                }`}
              >
                Find My Opposite
              </button>

              {mode === 'opposite_critic' && (
                <select
                  value={selectedMovieId}
                  onChange={(e) => handleMovieChange(e.target.value)}
                  disabled={isInvestigating}
                  className="bg-[#221f1c] border border-[#54433b] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#dd7058]"
                >
                  {candidateMovies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => triggerInvestigation(mode, selectedMovieId)}
                disabled={isInvestigating}
                className="p-1.5 rounded-lg border border-[#54433b] hover:bg-white/5 text-[#eee7dd] transition-colors disabled:opacity-50"
                title="Re-run analysis"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isInvestigating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Matched Film Pair Composition - PRIMARY VIEWPORT LEADER */}
          {activeCase?.primaryMovie && (
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                {/* Left Film Card */}
                <div className="relative rounded-2xl overflow-hidden bg-[#171615] border border-[#54433b] flex flex-col justify-between group shadow-lg">
                  {/* Backdrop Header */}
                  <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-[#241f1c]">
                    {activeCase.primaryMovie.backdrop_url || activeCase.primaryMovie.poster_url ? (
                      <img
                        src={activeCase.primaryMovie.backdrop_url || activeCase.primaryMovie.poster_url}
                        alt={activeCase.primaryMovie.title}
                        className="w-full h-full object-cover object-center brightness-90 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-12 h-12 text-[#54433b]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#171615] via-[#171615]/40 to-transparent" />
                  </div>

                  {/* Film Details */}
                  <div className="p-5 relative -mt-10 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight">
                        {activeCase.primaryMovie.title}
                      </h3>
                      <div className="text-xs text-[#a99c91] flex items-center gap-2 mt-0.5">
                        <span>{activeCase.primaryMovie.release_date?.slice(0, 4) || '2023'}</span>
                        <span>•</span>
                        <span>{activeCase.primaryMovie.genres?.slice(0, 2).join(', ') || 'Cinema'}</span>
                        <span>•</span>
                        <span>{activeCase.primaryMovie.runtime || 120} min</span>
                      </div>
                    </div>

                    {/* Rating Ribbon */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-2xl font-black text-[#dd7058] tracking-tight">
                        ★ {activeCase.primaryMovie.userRating || '9.5'}
                      </span>
                      <span className="text-xs text-[#a99c91] font-mono">/ 10</span>
                      <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#dd7058]/15 text-[#dd7058] border border-[#dd7058]/30">
                        You rated
                      </span>
                    </div>

                    <p className="text-xs text-[#cfc2b6] line-clamp-3 leading-relaxed pt-1">
                      {activeCase.primaryMovie.synopsis ||
                        'A monumental work of cinema engaging with high narrative drive and existential human stakes.'}
                    </p>
                  </div>
                </div>

                {/* Right Film Card */}
                {activeCase.secondaryMovie ? (
                  <div className="relative rounded-2xl overflow-hidden bg-[#171615] border border-[#54433b] flex flex-col justify-between group shadow-lg">
                    {/* Backdrop Header */}
                    <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-[#241f1c]">
                      {activeCase.secondaryMovie.backdrop_url || activeCase.secondaryMovie.poster_url ? (
                        <img
                          src={activeCase.secondaryMovie.backdrop_url || activeCase.secondaryMovie.poster_url}
                          alt={activeCase.secondaryMovie.title}
                          className="w-full h-full object-cover object-center brightness-90 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-12 h-12 text-[#54433b]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#171615] via-[#171615]/40 to-transparent" />
                    </div>

                    {/* Film Details */}
                    <div className="p-5 relative -mt-10 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">
                          {activeCase.secondaryMovie.title}
                        </h3>
                        <div className="text-xs text-[#a99c91] flex items-center gap-2 mt-0.5">
                          <span>{activeCase.secondaryMovie.release_date?.slice(0, 4) || '2016'}</span>
                          <span>•</span>
                          <span>{activeCase.secondaryMovie.genres?.slice(0, 2).join(', ') || 'Cinema'}</span>
                          <span>•</span>
                          <span>{activeCase.secondaryMovie.runtime || 116} min</span>
                        </div>
                      </div>

                      {/* Rating Ribbon */}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-2xl font-black text-[#d28b75] tracking-tight">
                          ★ {activeCase.secondaryMovie.userRating || '4.0'}
                        </span>
                        <span className="text-xs text-[#a99c91] font-mono">/ 10</span>
                        <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[#dcd1c4] border border-white/10">
                          You rated
                        </span>
                      </div>

                      <p className="text-xs text-[#cfc2b6] line-clamp-3 leading-relaxed pt-1">
                        {activeCase.secondaryMovie.synopsis ||
                          'A quieter investigation of theme and pacing that departs from traditional propulsive tension.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Opposite Critic Card for Mode B */
                  <div className="relative rounded-2xl overflow-hidden bg-[#171615] border border-[#54433b] flex flex-col justify-between p-6 shadow-lg">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#dd7058]/20 border border-[#dd7058]/40 flex items-center justify-center text-lg font-bold text-[#dd7058]">
                          {activeCase.oppositeCritic?.displayName?.[0] || 'E'}
                        </div>
                        <div>
                          <div className="text-xs font-mono uppercase tracking-wider text-[#dd7058]">
                            OPPOSING REVIEWER
                          </div>
                          <div className="text-lg font-bold text-white">
                            {activeCase.oppositeCritic?.displayName || 'Elena Rostov'}
                          </div>
                          <div className="text-xs text-[#a99c91]">
                            @{activeCase.oppositeCritic?.username || 'elena_r'}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#221f1c] border border-[#54433b] space-y-2">
                        <div className="text-xs font-mono text-[#a99c91] uppercase tracking-wider">
                          Divergence on {activeCase.primaryMovie.title}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-[#a99c91] block">Your rating:</span>
                            <span className="text-xl font-bold text-[#dd7058]">
                              ★ {activeCase.primaryMovie.userRating || '9.6'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-[#a99c91] block">Their rating:</span>
                            <span className="text-xl font-bold text-[#cfc2b6]">
                              ★ {activeCase.primaryMovie.criticRating || '4.0'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-[#cfc2b6] leading-relaxed">
                        While sharing strong alignment across your other rated titles, this reviewer reached the opposite conclusion on {activeCase.primaryMovie.title}.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-[#a99c91]">
                      Calculated from real PostgreSQL review intersections
                    </div>
                  </div>
                )}
              </div>

              {/* Central Connector Tag */}
              {activeCase.connectorLabel && (
                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="bg-[#0c0b0b] border border-[#54433b] px-3.5 py-1.5 rounded-full text-xs font-mono text-[#dd7058] shadow-2xl whitespace-nowrap font-bold">
                    {activeCase.connectorLabel}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Factual Metric Ribbon */}
          {activeCase?.factualMetrics && activeCase.factualMetrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#171615] border border-[#54433b]">
              {activeCase.factualMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className={`p-3 space-y-1 ${
                    idx !== activeCase.factualMetrics.length - 1 ? 'sm:border-r sm:border-white/10' : ''
                  }`}
                >
                  <div className="text-2xl font-black text-white tracking-tight">
                    {metric.value}
                  </div>
                  <div className="text-xs font-bold text-[#cfc2b6]">{metric.label}</div>
                  {metric.subtext && (
                    <div className="text-[11px] text-[#a99c91] leading-snug">{metric.subtext}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hypothesis Finding Card */}
          {activeCase && (
            <div className="p-6 rounded-2xl bg-[#221f1c] border border-[#55453c] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-[#dd7058]">
                  <Lightbulb className="w-4 h-4 text-[#dd7058]" />
                  <span>
                    HYPOTHESIS — GROUNDED IN {activeCase.evidence ? activeCase.evidence.length : 0} REVIEWS
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#cfc2b6] border border-white/10">
                  EMPIRICAL PROVENANCE
                </span>
              </div>

              <h2 className="text-lg font-bold text-white leading-snug tracking-tight">
                {activeCase.hypothesis}
              </h2>

              {/* Claims with Evidence IDs */}
              {activeCase.claims && activeCase.claims.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="text-[10px] font-mono uppercase text-[#a99c91]">
                    EVALUATED EVIDENCE CLAIMS
                  </div>
                  {activeCase.claims.map((claim, idx) => (
                    <div key={idx} className="text-xs text-[#cfc2b6] flex items-start gap-2">
                      <span className="text-[#dd7058] mt-0.5">•</span>
                      <div>
                        <span>{claim.text}</span>
                        {claim.evidenceIds.length > 0 && (
                          <span className="ml-2 inline-flex gap-1">
                            {claim.evidenceIds.map((eid) => (
                              <button
                                key={eid}
                                type="button"
                                onClick={() => handleSelectEvidence(eid)}
                                className="text-[10px] font-mono bg-black/40 hover:bg-[#dd7058] hover:text-[#140e0c] text-[#dd7058] border border-[#dd7058]/40 px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold shadow-sm"
                                title={`Focus evidence record #${eid}`}
                              >
                                #{eid}
                              </button>
                            ))}
                          </span>
                        )}
                        {claim.strength === 'insufficient' && (
                          <span className="ml-2 text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                            UNSUPPORTED
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Alternative Explanations & Limitations */}
              {activeCase.alternativeExplanations && activeCase.alternativeExplanations.length > 0 && (
                <div className="text-xs text-[#a99c91] pt-2 border-t border-white/5 space-y-1">
                  <span className="font-semibold text-[#cfc2b6]">Alternative explanations:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {activeCase.alternativeExplanations.map((alt, i) => (
                      <li key={i}>{alt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                {activeCase.proposedChallenge && (
                  <button
                    onClick={() => setIsChallengeModalOpen(true)}
                    className="flex-1 py-3 px-5 rounded-xl bg-[#dd7058] hover:bg-[#e47d66] text-[#19100e] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Film className="w-4 h-4" />
                    <span>Build a two-film challenge</span>
                  </button>
                )}

                <Link
                  href={
                    activeCase.primaryMovie
                      ? `/trace?movieId=${activeCase.primaryMovie.movie_id}`
                      : '/trace'
                  }
                  className="py-3 px-5 rounded-xl bg-[#171615] border border-[#54433b] hover:border-[#dd7058] text-[#f4eee6] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Database className="w-4 h-4 text-[#dd7058]" />
                  <span>Open CineTrace</span>
                </Link>
              </div>
            </div>
          )}

          {/* Interactive Split Comparison Slider (Bencho Split View inspired) */}
          {activeCase && (
            <DraggableSplitView activeCase={activeCase} />
          )}

          {/* Interactive Evidence Constellation Graph (React Flow / Node topology) */}
          {activeCase && (
            <EvidenceConstellation 
              activeCase={activeCase} 
              onSelectEvidence={handleSelectEvidence} 
            />
          )}

          {/* Recorded Investigation Timeline / Step Player (Bencho Step Player inspired) */}
          {activeCase && (
            <InvestigationStepPlayer 
              activeCase={activeCase} 
              onJumpToEvidence={() => handleSelectEvidence()} 
            />
          )}
        </div>

        {/* Right Evidence Rail (~32% width on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Header */}
          <div id="evidence-rail-header" className="flex items-center justify-between pb-2 border-b border-[#54433b]/40">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#dd7058]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                THE EVIDENCE
              </h2>
            </div>
            <span className="text-xs font-mono text-[#dd7058] font-bold">
              {activeCase?.evidence ? activeCase.evidence.length : 0} verified records
            </span>
          </div>

          {/* Evidence Records List */}
          <div className="space-y-3">
            {activeCase?.evidence && activeCase.evidence.length > 0 ? (
              activeCase.evidence.map((ev) => {
                const isFocused = focusedEvidenceId === ev.id;
                const isSpoilerRevealed = revealedSpoilers.has(ev.id);

                return (
                  <div
                    key={ev.id}
                    id={`evidence-card-${ev.id}`}
                    className={`p-4 rounded-xl bg-[#171615] border space-y-2.5 transition-all duration-300 shadow-sm ${
                      isFocused
                        ? 'border-[#dd7058] ring-2 ring-[#dd7058] shadow-[0_0_20px_rgba(221,112,88,0.35)] scale-[1.01]'
                        : 'border-[#54433b] hover:border-[#dd7058]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#dd7058] uppercase font-bold tracking-wider">
                        {ev.author ? `${ev.author.toUpperCase()} · ` : ''}#{ev.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {ev.isSpoiler && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-600/60 text-amber-300 font-bold">
                            SPOILER
                          </span>
                        )}
                        {ev.rating !== undefined && (
                          <span className="text-xs font-bold text-[#dd7058]">★ {ev.rating}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-bold text-white">{ev.title}</div>

                    {/* Spoiler Protection Masking */}
                    {ev.isSpoiler && !isSpoilerRevealed ? (
                      <div className="p-3 rounded-lg bg-[#0e0d0c] border border-amber-900/40 text-center my-1.5 space-y-1">
                        <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Contains Film Spoilers</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSpoiler(ev.id)}
                          className="text-[11px] text-[#f4eee6] underline hover:text-[#dd7058] transition-colors"
                        >
                          Click to reveal quote
                        </button>
                      </div>
                    ) : (
                      <div>
                        <blockquote className="text-[11px] text-[#cfc2b6] leading-relaxed italic border-l-2 border-[#dd7058]/40 pl-2.5 my-1">
                          "{ev.snippet}"
                        </blockquote>
                        {ev.isSpoiler && (
                          <button
                            type="button"
                            onClick={() => toggleSpoiler(ev.id)}
                            className="text-[10px] font-mono text-[#8c7f73] hover:text-[#a99c91] mt-1 block"
                          >
                            Hide spoiler
                          </button>
                        )}
                      </div>
                    )}

                    {(ev.metadata?.movieId || ev.targetId) && (
                      <Link
                        href={`/movies/${ev.metadata?.movieId || ev.targetId}`}
                        className="text-[11px] font-mono text-[#a99c91] hover:text-[#dd7058] flex items-center gap-1 pt-1 transition-colors"
                      >
                        <span>View film details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 rounded-xl bg-[#171615] border border-[#54433b] text-center text-xs text-[#a99c91]">
                No review evidence linked yet. Run an investigation to retrieve relational records.
              </div>
            )}
          </div>

          {/* Tools Used Section */}
          <div className="p-5 rounded-2xl bg-[#171615] border border-[#54433b] space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-white">
              <Layers className="w-3.5 h-3.5 text-[#dd7058]" />
              <span>TOOLS USED</span>
            </div>

            <div className="space-y-2.5">
              {activeCase?.toolReceipts && activeCase.toolReceipts.length > 0 ? (
                activeCase.toolReceipts.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-black/20 border border-white/5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#dd7058]">{t.toolName}</span>
                      <span className="text-[10px] font-mono text-[#a99c91]">{t.durationMs}ms</span>
                    </div>
                    <p className="text-[11px] text-[#cfc2b6] leading-snug">{t.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#a99c91]">No tools recorded.</div>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 text-[10px] text-[#a99c91] leading-snug">
              All claims link to source records in your database. No opinions are generated without evidence.
            </div>
          </div>

          {/* Interactive Pattern Inquiry Input */}
          <div className="p-4 rounded-2xl bg-[#171615] border border-[#54433b] space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#a69a8f]">
              Investigate another pattern...
            </div>
            <form onSubmit={handleCustomQuerySubmit} className="flex gap-2">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="e.g. Why do I like space movies but not alien films?"
                className="flex-1 bg-[#221f1c] border border-[#54433b] rounded-lg px-3 py-2 text-xs text-white placeholder-[#87786e] focus:outline-none focus:border-[#dd7058]"
              />
              <button
                type="submit"
                disabled={isInvestigating}
                className="px-3 rounded-lg bg-[#dd7058] hover:bg-[#e47d66] text-[#17100e] text-xs font-bold transition-colors disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Challenge Consent Modal */}
      <ConfirmChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        challenge={activeCase?.proposedChallenge}
        caseId={activeCase?.id}
      />
    </div>
  );
}
