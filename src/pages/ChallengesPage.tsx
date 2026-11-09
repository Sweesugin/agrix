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
  Upload,
  ShieldCheck,
  Compass,
  X,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Challenge, ChallengeCategory, DifficultyLevel, ChallengeStatus } from '../types';

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

  // Submit proof modal
  const [submittingChallenge, setSubmittingChallenge] = useState<Challenge | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');

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

  const handleOpenSubmitModal = (challenge: Challenge) => {
    setSubmittingChallenge(challenge);
    setProofNote(challenge.verificationHint || 'Implemented sustainable practice in our field as per protocol instructions.');
    setProofImageUrl('');
  };

  const handleConfirmSubmitProof = async () => {
    if (!submittingChallenge) return;
    try {
      setActiveSubmittingId(submittingChallenge.id);
      await api.submitChallenge(submittingChallenge.id, proofNote, proofImageUrl || undefined);
      await refreshUser();
      await loadChallenges();
      setSubmittingChallenge(null);
    } catch (err: any) {
      alert(err.message || 'Could not submit challenge proof');
    } finally {
      setActiveSubmittingId(null);
    }
  };

  const handleInstantVerify = async (challenge: Challenge) => {
    try {
      setActiveSubmittingId(challenge.id);
      const res = await api.completeChallenge(
        challenge.id,
        challenge.verificationHint || 'Self-verified field implementation.'
      );
      await refreshUser();
      await loadChallenges();

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Sustainable Farming Challenges
            </h1>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Turn recommendations into real-world action. Start a challenge, follow practical steps, submit field proof, and earn verified points and badges!
          </p>
        </div>

        {/* User stats pill */}
        {user && (
          <div className="bg-white border border-stone-200 px-4 py-2.5 rounded-2xl shadow-xs flex items-center gap-4 self-start md:self-auto">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Total Points</div>
                <div className="text-sm font-extrabold text-stone-900">{user.points} pts</div>
              </div>
            </div>
            <div className="h-7 w-px bg-stone-200" />
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Daily Streak</div>
                <div className="text-sm font-extrabold text-stone-900">{user.streak} days</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            Filters:
          </div>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Difficulty */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Advanced">Advanced</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted (Pending Review)</option>
            <option value="verified">Verified & Completed</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-stone-500">
          Showing {challenges.length} challenges
        </div>
      </div>

      {/* CHALLENGES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => {
          const status: ChallengeStatus = (challenge.userStatus as any) || 'not_started';
          const isVerified = status === 'verified' || (status as any) === 'completed';
          const isSubmitted = status === 'submitted';
          const isInProgress = status === 'in_progress';
          const isNotStarted = status === 'not_started';

          return (
            <div
              key={challenge.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-all relative overflow-hidden ${
                isVerified
                  ? 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                  : isSubmitted
                  ? 'bg-amber-50/40 border-amber-200 shadow-xs'
                  : isInProgress
                  ? 'bg-white border-blue-200 ring-2 ring-blue-50 shadow-sm'
                  : 'bg-white border-stone-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                {/* Header tags: Category & Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold">
                    {challenge.category}
                  </span>

                  {isVerified ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Verified & Completed
                    </span>
                  ) : isSubmitted ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Submitted (Review Pending)
                    </span>
                  ) : isInProgress ? (
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center gap-1">
                      <Play className="w-3 h-3 text-blue-600 fill-blue-600" />
                      In Progress
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-[11px] font-medium">
                      Not Started
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-stone-900 leading-snug mb-2">
                  {challenge.title}
                </h3>

                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  {challenge.description}
                </p>

                {/* Sustainability Benefit box */}
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-[11px] text-stone-700 space-y-1 mb-4">
                  <div className="font-bold text-stone-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Ecological Benefit:
                  </div>
                  <p className="leading-relaxed">{challenge.sustainabilityBenefit}</p>
                </div>

                {/* Instructions List */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Protocol Steps:
                  </div>
                  <ul className="space-y-1 text-xs text-stone-600">
                    {challenge.instructions.map((inst, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-stone-100 text-stone-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-tight">{inst}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Submitted proof note display if present */}
                {challenge.proofNote && (
                  <div className="mt-3 p-2.5 bg-stone-100/80 rounded-xl text-[11px] text-stone-600 space-y-0.5">
                    <div className="font-bold text-stone-700">Proof Submitted:</div>
                    <p className="italic">"{challenge.proofNote}"</p>
                  </div>
                )}

                {/* Meta footer */}
                <div className="flex items-center justify-between pt-3 mt-4 border-t border-stone-100 text-xs text-stone-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Duration: {challenge.duration}</span>
                  </div>
                  <div className="font-extrabold text-emerald-700 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>+{challenge.points} Points</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 mt-4 border-t border-stone-100 space-y-2">
                {isNotStarted && (
                  <button
                    onClick={() => handleStart(challenge)}
                    disabled={activeSubmittingId === challenge.id}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start This Challenge</span>
                  </button>
                )}

                {isInProgress && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleOpenSubmitModal(challenge)}
                      disabled={activeSubmittingId === challenge.id}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Implementation Proof</span>
                    </button>
                    <button
                      onClick={() => handleInstantVerify(challenge)}
                      disabled={activeSubmittingId === challenge.id}
                      className="w-full py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Instant Self-Verify (+{challenge.points} pts)</span>
                    </button>
                  </div>
                )}

                {isSubmitted && (
                  <div className="space-y-1.5">
                    <div className="w-full py-2 px-3 bg-amber-100 text-amber-900 text-xs font-bold rounded-xl text-center">
                      Awaiting Agricultural Officer Review
                    </div>
                    <button
                      onClick={() => handleInstantVerify(challenge)}
                      disabled={activeSubmittingId === challenge.id}
                      className="w-full py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fast-Track Instant Verify</span>
                    </button>
                  </div>
                )}

                {isVerified && (
                  <div className="w-full py-2.5 px-4 bg-emerald-100 text-emerald-900 text-xs font-extrabold rounded-xl text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Verified • +{challenge.points} pts Awarded</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SUBMIT PROOF MODAL */}
      {submittingChallenge && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Verification Submission
                </span>
                <h3 className="text-lg font-extrabold text-stone-900">
                  {submittingChallenge.title}
                </h3>
              </div>
              <button
                onClick={() => setSubmittingChallenge(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Field Implementation Notes / Observations:
                </label>
                <textarea
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  rows={3}
                  placeholder="Describe your implementation (e.g. soil moisture retained, weed reduction observed, application dosage)..."
                  className="w-full p-3 rounded-2xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Optional Photograph Link (URL):
                </label>
                <input
                  type="url"
                  value={proofImageUrl}
                  onChange={(e) => setProofImageUrl(e.target.value)}
                  placeholder="https://example.com/my-farm-proof.jpg"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-[11px] text-stone-600">
                <strong>Verification Hint:</strong> {submittingChallenge.verificationHint}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={handleConfirmSubmitProof}
                disabled={activeSubmittingId === submittingChallenge.id || !proofNote.trim()}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Verification</span>
              </button>
              <button
                onClick={() => setSubmittingChallenge(null)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
