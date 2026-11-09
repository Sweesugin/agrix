import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  CheckSquare,
  Flame,
  ArrowRight,
  Sparkles,
  Compass,
  Clock,
  Layers,
  Users,
  MessageSquare,
  Heart,
  ChevronRight,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ScoredPractice, UserActivity, CommunityPost } from '../types';

interface DashboardPageProps {
  onSelectTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectTab }) => {
  const { user, levelInfo, badges, refreshUser, showUnlockedBadge } = useAuth();
  const [recommendations, setRecommendations] = useState<ScoredPractice[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [recentPosts, setRecentPosts] = useState<CommunityPost[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [recData, gamData, postData, leadData] = await Promise.all([
        api.getRecommendations(),
        api.getGamificationProfile(),
        api.getPosts(),
        api.getLeaderboard(),
      ]);

      setRecommendations(recData.recommendations.slice(0, 4));
      setActivities(gamData.recentActivities);
      setRecentPosts(postData.posts.slice(0, 2));

      if (leadData.currentUserRank) {
        setUserRank(leadData.currentUserRank.rank);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const handleStartChallenge = async (practice: ScoredPractice) => {
    if (!practice.challenge) {
      onSelectTab('challenges');
      return;
    }

    try {
      setActionLoading(practice.challenge.id);
      await api.startChallenge(practice.challenge.id);
      await refreshUser();
      await loadDashboardData();
      onSelectTab('challenges');
    } catch (err: any) {
      alert(err.message || 'Failed to start challenge');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* WELCOME BANNER */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/80 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Farmer Stewardship Dashboard
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {user ? user.name : 'Farmer'}
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-xl">
              Farming <strong className="text-white">{user?.mainCrop || 'crops'}</strong> on{' '}
              <strong className="text-white">{user?.soilType || 'loamy'}</strong> soil ({user?.farmSize || 3} acres) using{' '}
              <strong className="text-white">{user?.farmingMethod || 'sustainable'}</strong> methods in {user?.location || 'India'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectTab('recommendations')}
              className="px-5 py-2.5 bg-white text-emerald-900 font-bold rounded-xl text-xs hover:bg-emerald-50 shadow-sm transition-transform hover:scale-105"
            >
              Explore Recommendations
            </button>
            <button
              onClick={() => onSelectTab('challenges')}
              className="px-5 py-2.5 bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs border border-emerald-500/50 transition-colors"
            >
              Open Challenges
            </button>
          </div>
        </div>
      </div>

      {/* 5 CORE STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Points */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Points</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900">{user?.points || 0}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              +{levelInfo?.nextLevelPoints ? levelInfo.nextLevelPoints - (user?.points || 0) : 0} pts to next tier
            </div>
          </div>
        </div>

        {/* Current Level */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Current Level</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-stone-900 truncate">
              Lvl {user?.level || 1}
            </div>
            <div className="text-xs font-bold text-teal-800 truncate">
              {user?.levelTitle || 'Seedling'}
            </div>
          </div>
        </div>

        {/* Challenges Completed */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Challenges</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900">
              {activities.filter((a) => a.type === 'challenge_completed').length || 2}
            </div>
            <div className="text-[11px] text-stone-500 font-medium mt-0.5">Missions logged</div>
          </div>
        </div>

        {/* Badges Earned */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Badges Earned</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900">
              {badges.length || 2} <span className="text-xs text-stone-400 font-normal">/ 8</span>
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">Badges unlocked</div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="col-span-2 lg:col-span-1 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Active Streak</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-orange-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900">
              {user?.streak || 1} <span className="text-xs font-bold text-orange-600">Days</span>
            </div>
            <div className="text-[11px] text-stone-500 font-medium mt-0.5">Consecutive action</div>
          </div>
        </div>
      </div>

      {/* RECOMMENDED FOR YOU */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-700" />
              <h2 className="text-xl font-bold text-stone-900">Recommended for You</h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Personalized based on {user?.mainCrop || 'crop'}, {user?.soilType || 'soil'} soil & {user?.farmingMethod || 'farming approach'}.
            </p>
          </div>

          <button
            onClick={() => onSelectTab('recommendations')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            View all recommendations <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {recommendations.map((rec) => {
            const isCompleted = rec.userChallengeStatus === 'completed';
            const isInProgress = rec.userChallengeStatus === 'in_progress';

            return (
              <div
                key={rec.practice.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 flex flex-col justify-between hover:border-emerald-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                      {rec.practice.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        rec.practice.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-800'
                          : rec.practice.difficulty === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rec.practice.difficulty}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 line-clamp-2">
                    {rec.practice.title}
                  </h3>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-[11px] text-stone-600 leading-relaxed">
                    <strong className="text-stone-800 font-semibold block mb-0.5">
                      Why it is recommended:
                    </strong>
                    {rec.whyRecommended}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {rec.practice.estimatedCompletion}
                    </span>
                    <span className="font-bold text-emerald-700">+{rec.practice.points} pts</span>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-stone-100">
                  {isCompleted ? (
                    <button
                      disabled
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Completed
                    </button>
                  ) : isInProgress ? (
                    <button
                      onClick={() => onSelectTab('challenges')}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>In Progress (Finish)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartChallenge(rec)}
                      disabled={actionLoading === rec.challenge?.id}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
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
      </section>

      {/* LOWER SECTION: ACTIVITY & COMMUNITY FEED SNEAK PEEK & LEADERBOARD SNAPSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Timeline */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">Recent Activity</h3>
            <button
              onClick={() => onSelectTab('progress')}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              Full log
            </button>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-stone-400 py-4">No activities logged yet.</p>
            ) : (
              activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-stone-800 truncate">{act.title}</div>
                    <div className="text-[10px] text-stone-400">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  {act.pointsEarned > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700">
                      +{act.pointsEarned}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Community Posts Sneak Peek */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <h3 className="text-base font-bold text-stone-900">Community Snippets</h3>
            </div>
            <button
              onClick={() => onSelectTab('community')}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              Community feed
            </button>
          </div>

          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div key={post.id} className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-100 space-y-2">
                <div className="flex items-center gap-2">
                  <img
                    src={post.userAvatar || 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=60&auto=format&fit=crop&q=80'}
                    alt={post.userName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="text-xs font-semibold text-stone-800 truncate">{post.userName}</div>
                  <span className="text-[10px] text-stone-400 ml-auto">{post.userCrop}</span>
                </div>
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                  "{post.content}"
                </p>
                <div className="flex items-center gap-4 text-[11px] text-stone-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                    {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {post.totalComments}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Position Preview */}
        <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-teal-500/10 rounded-3xl border border-amber-200/60 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Leaderboard</span>
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>

            <div className="text-center py-4 space-y-1">
              <div className="text-xs text-stone-600 font-medium">Your Current Standing</div>
              <div className="text-4xl font-black text-stone-900">
                #{userRank || 3}
              </div>
              <div className="text-xs font-bold text-emerald-800">
                {user?.points || 0} Total Sustainability Points
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed text-center">
              Complete challenges and share farm learnings on the community board to move up into the top ranks!
            </p>
          </div>

          <button
            onClick={() => onSelectTab('leaderboard')}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 mt-4"
          >
            <span>View Full Leaderboard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
