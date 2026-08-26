'use client';

import React, { useState } from 'react';
import { Star, X, Check } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: number;
  movieTitle: string;
  onSuccess: () => void;
}

export default function RatingModal({ isOpen, onClose, movieId, movieTitle, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const currentUserId = typeof window !== 'undefined'
        ? parseInt(localStorage.getItem('cineverse_current_user') || '1', 10)
        : 1;

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          movieId,
          rating,
          reviewText,
          containsSpoilers,
        }),
      });

      if (res.ok) {
        setShowSuccess(true);
        onSuccess();
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
          setRating(0);
          setReviewText('');
          setContainsSpoilers(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-black border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {showSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Logged Successfully</h3>
            <p className="text-sm text-gray-400">Database triggers executed.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-900">
              <h2 className="text-xl font-bold text-white tracking-tight">I Watched...</h2>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div>
                <div className="text-sm font-medium text-gray-400 mb-2">Rating</div>
                <div 
                  className="flex items-center gap-1"
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {Array.from({ length: 10 }).map((_, i) => {
                    const starValue = i + 1;
                    return (
                      <button
                        key={i}
                        type="button"
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                        onMouseEnter={() => setHoveredRating(starValue)}
                        onClick={() => setRating(starValue)}
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            starValue <= (hoveredRating || rating) 
                              ? 'fill-white text-white' 
                              : 'text-gray-800'
                          }`} 
                        />
                      </button>
                    );
                  })}
                  <span className="ml-3 text-lg font-medium text-white w-8">
                    {hoveredRating || rating || 0}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 block mb-2">Review (Optional)</label>
                <textarea
                  rows={4}
                  placeholder="Add your thoughts..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setContainsSpoilers(!containsSpoilers)}
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    containsSpoilers ? 'bg-white border-white' : 'bg-transparent border-gray-700'
                  }`}
                >
                  {containsSpoilers && <Check className="w-3.5 h-3.5 text-black" />}
                </button>
                <span className="text-sm text-gray-400">Contains spoilers</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>

            </form>
          </>
        )}
      </div>
    </div>
  );
}
