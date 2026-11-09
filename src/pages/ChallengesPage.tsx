import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Filter,
  Play,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  Info,
  Layers,
  Flame,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Challenge, ChallengeCategory, DifficultyLevel } from '../types';

interface ChallengesPageProps {
  onSelectTab: (tab: string) => void;
}

const CATEGORIES: ChallengeCategory[] = [
  'Water Conservation',
  'Soil Health',
  'Organic Farming',
  'Pest Management',
  'Biodiversity',
  'Waste Reduction',
  'Energy Efficiency',
];

export const ChallengesPage: React.FC<ChallengesPageProps> = ({ onSelectTab }) => {
  const { user, refreshUser, showUnlockedBadge } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [activeSubmittingId, setActiveSubmittingId] = useState<string | null>(null);

  // Completion modal state
  const [completingChallenge, setCompletingChallenge] = useState<Challenge | null>(null);
  const [proofNote, setProofNote] = useState('');

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const res = await api.getChallenges({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });
      setChallenges(res.challenges);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [selectedCategory, selectedDifficulty, selectedStatus, user?.id]);

  const handleStart = async (challenge: Challenge) => {
    try {
      setActiveSubmittingId(challenge.id);
      await api.startChallenge(challenge.id);
      await refreshUser();
      await loadChallenges();
    } catch (err: any) {
      alert(err.message || 'Could not start challenge');
    } finally {
      setActiveSubmittingId(null);
    }
  };

  const handleOpenCompleteModal = (challenge: Challenge) => {
    setCompletingChallenge(challenge);
    setProofNote(challenge.verificationHint || 'Observed positive soil moisture retention and minimal weed growth.');
  };

  const handleConfirmComplete = async () => {
    if (!completingChallenge) return;
    try {
      setActiveSubmittingId(completingChallenge.id);
      const res = await api.completeChallenge(completingChallenge.id, proofNote);
      await refreshUser();
      await loadChallenges();
      setCompletingChallenge(null);

      // Check if newly unlocked badges were awarded
      if (res.newlyUnlockedBadges && res.newlyUnlockedBadges.length > 0) {
        showUnlockedBadge(res.newlyUnlockedBadges[0]);
      }
    } catch (err: any) {
      alert(err.message || 'Could not complete challenge');
    } finally {
      setActiveSubmittingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Sustainable Farming Challenges
            </h1>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Turn sustainable practices into gamified action missions. Earn points, maintain your daily habit streak, and unlock badges for your farm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Your Points</span>
            <div className="text-lg font-black text-emerald-900">{user?.points || 0} pts</div>
          </div>
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase">Current Streak</span>
            <div className="text-lg font-black text-amber-900">{user?.streak || 1} Days</div>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
            selectedCategory === 'All'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          All Categories
        </button>

        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
              selectedCategory === cat
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Secondary Filters: Status & Difficulty */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-stone-700">Status:</span>
          {['All', 'not_started', 'in_progress', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg font-semibold capitalize ${
                selectedStatus === st
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-bold text-stone-700">Difficulty:</span>
          {['All', 'Easy', 'Medium', 'Advanced'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                selectedDifficulty === diff
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* CHALLENGES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => {
          const isCompleted = challenge.userStatus === 'completed';
          const isInProgress = challenge.userStatus === 'in_progress';

          return (
            <div
              key={challenge.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-all ${
                isCompleted
                  ? 'bg-emerald-50/40 border-emerald-200 shadow-none'
                  : isInProgress
                  ? 'bg-white border-amber-300 shadow-md ring-1 ring-amber-300/50'
                  : 'bg-white border-stone-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold">
                    {challenge.category}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      challenge.difficulty === 'Easy'
                        ? 'bg-green-100 text-green-800'
                        : challenge.difficulty === 'Medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {challenge.difficulty}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 leading-snug">
                  {challenge.title}
                </h3>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {challenge.description}
                </p>

                {/* Sustainability Benefit Tag */}
                <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 border border-stone-100">
                  <strong className="text-stone-800 font-semibold block mb-0.5">
                    Sustainability Benefit:
                  </strong>
                  {challenge.sustainabilityBenefit}
                </div>

                {/* Step Instructions */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    Execution Steps:
                  </div>
                  <ul className="space-y-1 text-xs text-stone-600">
                    {challenge.instructions.map((ins, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Meta details */}
                <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {challenge.duration}
                  </span>
                  <span className="font-extrabold text-emerald-800 text-sm">
                    +{challenge.points} pts
                  </span>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-5 mt-4 border-t border-stone-100">
                {isCompleted ? (
                  <div className="py-2.5 px-4 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Challenge Completed! (+{challenge.points} pts awarded)</span>
                  </div>
                ) : isInProgress ? (
                  <button
                    onClick={() => handleOpenCompleteModal(challenge)}
                    disabled={activeSubmittingId === challenge.id}
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-102"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Completed</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStart(challenge)}
                    disabled={activeSubmittingId === challenge.id}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Challenge</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPLETION MODAL */}
      {completingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-emerald-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900">
                  Complete Challenge
                </h3>
                <p className="text-xs text-stone-500">
                  {completingChallenge.title} (+{completingChallenge.points} pts)
                </p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs text-stone-600 leading-relaxed space-y-1">
              <div className="font-bold text-stone-800">Verification Guidelines:</div>
              <p>{completingChallenge.verificationHint}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Farming Field Observation / Completion Note
              </label>
              <textarea
                rows={3}
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                placeholder="Describe your implementation details, moisture retention, crop response..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setCompletingChallenge(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmComplete}
                disabled={activeSubmittingId === completingChallenge.id}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                Claim +{completingChallenge.points} Points
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
