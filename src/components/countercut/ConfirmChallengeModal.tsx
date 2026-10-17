'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Film, Check, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { ProposedChallenge } from '@/lib/countercut/types';

interface ConfirmChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: ProposedChallenge | undefined;
  onCreated?: (watchlistId: number) => void;
}

export default function ConfirmChallengeModal({
  isOpen,
  onClose,
  challenge,
  onCreated,
}: ConfirmChallengeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdListId, setCreatedListId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !challenge) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/countercut/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: challenge.name,
          description: challenge.reason,
          movieIds: challenge.movieIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create challenge watchlist');
      }

      setCreatedListId(data.watchlistId);
      if (onCreated) {
        onCreated(data.watchlistId);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#171615] border border-[#54433b] rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#a69a8f] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-[#dd7058]/20 flex items-center justify-center text-[#dd7058]">
            <Film className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono tracking-wider uppercase text-[#dd7058] font-bold">
            EXPLICIT USER CONSENT REQUIRED
          </span>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">
          Create Double-Feature Challenge
        </h2>

        <p className="text-xs text-[#a99c91] mt-1 leading-relaxed">
          The Countercut proposes adding these two films to your private screening library to test your taste hypothesis.
        </p>

        {/* Challenge Content Preview */}
        <div className="my-5 p-4 rounded-xl bg-[#221f1c] border border-[#55453c] space-y-3">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#dd7058]">
              WATCHLIST TITLE
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{challenge.name}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#a69a8f]">
              INVESTIGATION RATIONALE
            </div>
            <p className="text-xs text-[#cfc2b6] mt-0.5 leading-relaxed">{challenge.reason}</p>
          </div>

          {/* Film Thumbnails */}
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#a69a8f] mb-2">
              PROPOSED FILMS ({challenge.movieIds.length})
            </div>
            <div className="grid grid-cols-2 gap-3">
              {challenge.movies?.map((m) => (
                <div
                  key={m.movie_id}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-[#171615] border border-[#54433b]"
                >
                  {m.poster_url ? (
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      className="w-9 h-13 object-cover rounded shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-13 bg-[#2a2420] rounded flex items-center justify-center shrink-0">
                      <Film className="w-4 h-4 text-[#a69a8f]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{m.title}</div>
                    <div className="text-[10px] text-[#dd7058] font-mono mt-0.5">
                      ★ {m.avg_rating || '8.5'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Success State */}
        {createdListId ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Watchlist created successfully in PostgreSQL!</span>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/lists/${createdListId}`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#eee7dd] hover:bg-white text-[#171615] text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span>View created watchlist</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-[#54433b] hover:bg-white/5 text-[#dcd1c4] text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Controls */
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl border border-[#54433b] hover:bg-white/5 text-[#a99c91] hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-[#dd7058] hover:bg-[#e47d66] text-[#19100e] text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating in database...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Authorize & Create Watchlist</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
