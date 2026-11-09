import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  CheckSquare,
  Flame,
  Sparkles,
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge, LevelInfo, UserActivity } from '../types';

interface ProgressPageProps {
  onSelectTab: (tab: string) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ onSelectTab }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<{
    badges: Badge[];
    unlockedBadgesCount: number;
    totalBadgesCount: number;
    completedChallengesCount: number;
    categoryCounts: Record<string, number>;
    recentActivities: UserActivity[];
    levelInfo: LevelInfo;
    user?: any;
  } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        setLoading(true);
        const [data, txData] = await Promise.all([
          api.getGamificationProfile(),
          api.getTransactions(),
        ]);
        setProfileData(data);
        setTransactions(txData.transactions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGamificationData();
  }, [user?.id]);

  if (loading || !profileData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-stone-500">
        Loading progress metrics...
      </div>
    );
  }

  const {
    badges,
    unlockedBadgesCount,
    totalBadgesCount,
    completedChallengesCount,
    categoryCounts,
    recentActivities,
    levelInfo,
  } = profileData;

  const totalChallenges = 15;
  const completionPercentage = Math.round((completedChallengesCount / totalChallenges) * 100);

  // SVG Chart: Category Completion Breakdown
  const categoriesList = [
    'Water Conservation',
    'Soil Health',
    'Organic Farming',
    'Pest Management',
    'Biodiversity',
    'Waste Reduction',
    'Energy Efficiency',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Farm Progress & Gamification
            </h1>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Track your journey from Seedling to Green Champion through points, badges, streak milestones, and ecological practice categories.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-emerald-900">
            Current Tier: Level {levelInfo.level} ({levelInfo.levelTitle})
          </span>
        </div>
      </div>

      {/* LEVEL PROGRESSION BAR */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Stewardship Level Progression
            </div>
            <div className="text-2xl font-black text-stone-900">
              Level {levelInfo.level} — {levelInfo.levelTitle}
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-emerald-700">{user?.points || 0} pts</span>
            <span className="text-xs text-stone-400"> / {levelInfo.nextLevelPoints} pts next tier</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-4 rounded-full overflow-hidden p-0.5 border border-stone-200">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(8, levelInfo.progressPercent))}%` }}
          />
        </div>

        {/* 5 Levels milestones */}
        <div className="grid grid-cols-5 text-center pt-2 text-[11px] font-semibold text-stone-500">
          <div className={levelInfo.level >= 1 ? 'text-emerald-700 font-bold' : ''}>1. Seedling</div>
          <div className={levelInfo.level >= 2 ? 'text-emerald-700 font-bold' : ''}>2. Grower</div>
          <div className={levelInfo.level >= 3 ? 'text-emerald-700 font-bold' : ''}>3. Cultivator</div>
          <div className={levelInfo.level >= 4 ? 'text-emerald-700 font-bold' : ''}>4. Sust. Farmer</div>
          <div className={levelInfo.level >= 5 ? 'text-emerald-700 font-bold' : ''}>5. Champion</div>
        </div>
      </div>

      {/* 4 CORE METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Completed</div>
          <div className="text-3xl font-black text-stone-900 mt-1">{completedChallengesCount}</div>
          <div className="text-xs text-stone-500 mt-1">out of {totalChallenges} challenges</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Completion Rate</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">{completionPercentage}%</div>
          <div className="text-xs text-emerald-600 mt-1">Overall farm adoption</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Badges Unlocked</div>
          <div className="text-3xl font-black text-purple-700 mt-1">
            {unlockedBadgesCount} / {totalBadgesCount}
          </div>
          <div className="text-xs text-stone-500 mt-1">Milestone badges</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Active Streak</div>
          <div className="text-3xl font-black text-orange-600 mt-1 flex items-center gap-1.5">
            <Flame className="w-6 h-6 fill-orange-500" />
            {user?.streak || 1}d
          </div>
          <div className="text-xs text-stone-500 mt-1">Daily engagement</div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Completion Bar Chart (Clean SVG) */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">Challenges by Category</h3>
              <p className="text-xs text-stone-500">Distribution of completed sustainable actions</p>
            </div>
            <PieChart className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="space-y-3.5 pt-2">
            {categoriesList.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const maxCat = 3;
              const pct = Math.min(100, Math.round((count / maxCat) * 100));

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700">{cat}</span>
                    <span className="font-bold text-stone-900">{count} done</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Habit / Points Activity Timeline (Clean SVG) */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">Recent Sustainability Log</h3>
              <p className="text-xs text-stone-500">Actions that generated points and badge progress</p>
            </div>
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>

          <div className="space-y-3 pt-2">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No recent activities recorded.</p>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">{act.title}</div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(act.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {act.pointsEarned > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
                      +{act.pointsEarned} pts
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BADGE SHOWCASE GALLERY */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Badges Gallery</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Earn prestigious badges automatically when you satisfy their agro-ecological criteria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {badges.map((badge) => {
            const isUnlocked = badge.unlocked;

            return (
              <div
                key={badge.id}
                className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                  isUnlocked
                    ? 'bg-white border-emerald-300 shadow-sm hover:shadow-md'
                    : 'bg-stone-50/60 border-stone-200/80 opacity-70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200'
                          : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      {badge.icon}
                    </div>

                    {isUnlocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-[10px] font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-stone-400" />
                        Locked
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{badge.name}</h4>
                    <p className="text-xs text-stone-600 leading-relaxed mt-1">
                      {badge.description}
                    </p>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded-xl text-[11px] text-stone-500 border border-stone-100">
                    <strong className="text-stone-700 block mb-0.5">Criteria:</strong>
                    {badge.criteria}
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400">Reward:</span>
                  <span className="font-bold text-emerald-800">+{badge.pointsReward} Points</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* VERIFIED REWARD TRANSACTIONS LEDGER (AUDIT & RESEARCH) */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Verified Reward Transactions Ledger
            </h3>
            <p className="text-xs text-stone-500">
              Tamper-evident transaction records with deduplicated points attribution and verification timestamps.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full w-fit">
            {transactions.length} Verified Records
          </span>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">
            No completed reward transactions yet. Start and verify a challenge to record your first verified points!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Reason / Challenge</th>
                  <th className="py-2.5 px-3">Points Awarded</th>
                  <th className="py-2.5 px-3">Verified By</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Ledger Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3 font-mono text-stone-500 text-[11px] font-bold">
                      {tx.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-stone-900">
                      {tx.reason}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">
                      +{tx.pointsAwarded} pts
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">
                      {tx.verifiedBy || 'System Verified'}
                    </td>
                    <td className="py-2.5 px-3 text-stone-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Awarded & Deduplicated
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
