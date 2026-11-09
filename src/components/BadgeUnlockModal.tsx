import React from 'react';
import { Award, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BadgeUnlockModal: React.FC = () => {
  const { celebratingBadge, closeBadgeModal } = useAuth();

  if (!celebratingBadge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 p-8 text-center animate-in zoom-in-95 duration-300">
        <button
          onClick={closeBadgeModal}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Glow halo */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-5xl shadow-lg border-2 border-emerald-300">
            {celebratingBadge.icon || <Award className="w-12 h-12 text-white" />}
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          New Badge Unlocked!
        </div>

        <h3 className="text-2xl font-bold text-stone-900 mb-2">
          {celebratingBadge.name}
        </h3>

        <p className="text-stone-600 text-sm mb-6 leading-relaxed">
          {celebratingBadge.description}
        </p>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center justify-around">
          <div className="text-center">
            <div className="text-xs text-emerald-700 font-medium">Points Reward</div>
            <div className="text-xl font-bold text-emerald-800">+{celebratingBadge.pointsReward} pts</div>
          </div>
          <div className="w-px h-8 bg-emerald-200" />
          <div className="text-center">
            <div className="text-xs text-emerald-700 font-medium">Status</div>
            <div className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Added to Profile
            </div>
          </div>
        </div>

        <button
          onClick={closeBadgeModal}
          className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          Keep Growing Sustainably
        </button>
      </div>
    </div>
  );
};
