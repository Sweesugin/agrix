import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Flame, Users, Calendar, Globe, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface LeaderboardPageProps {
  onSelectTab: (tab: string) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onSelectTab }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'global' | 'monthly'>('global');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await api.getLeaderboard(period);
      setLeaderboard(data.leaderboard);
      setCurrentUserRank(data.currentUserRank);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period, user?.id]);

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Trophy className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              AgriX Leaderboard
            </h1>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Celebrating regional agro-ecological leaders who adopt and maintain verified sustainable practices on their fields.
          </p>
        </div>

        {/* Global vs Monthly Toggle */}
        <div className="bg-stone-100 p-1 rounded-2xl flex items-center gap-1 border border-stone-200">
          <button
            onClick={() => setPeriod('global')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              period === 'global'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            Global All-Time
          </button>

          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              period === 'monthly'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            Monthly Standings
          </button>
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 max-w-4xl mx-auto items-end">
          {/* 2nd Place */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 text-center space-y-3 shadow-sm order-2 md:order-1 relative">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center -mt-10 border-4 border-white shadow-md">
              2
            </div>
            <img
              src={topThree[1].avatarUrl}
              alt={topThree[1].name}
              className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-slate-300"
            />
            <div>
              <h3 className="font-bold text-stone-900 text-base">{topThree[1].name}</h3>
              <p className="text-xs text-stone-500">{topThree[1].crop} • {topThree[1].location}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xl font-black text-stone-900">{topThree[1].points} pts</span>
              <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                Lvl {topThree[1].level} {topThree[1].levelTitle}
              </div>
            </div>
          </div>

          {/* 1st Place (Gold Champion) */}
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl border-2 border-amber-300 p-8 text-center space-y-3 shadow-lg order-1 md:order-2 relative -translate-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-400 text-amber-950 font-black text-base flex items-center justify-center -mt-14 border-4 border-white shadow-lg">
              👑 1
            </div>
            <img
              src={topThree[0].avatarUrl}
              alt={topThree[0].name}
              className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-amber-400 shadow-md"
            />
            <div>
              <h3 className="font-black text-stone-900 text-lg">{topThree[0].name}</h3>
              <p className="text-xs text-stone-500">{topThree[0].crop} • {topThree[0].location}</p>
            </div>
            <div className="p-3.5 bg-amber-100/70 rounded-2xl border border-amber-200">
              <span className="text-2xl font-black text-amber-950">{topThree[0].points} pts</span>
              <div className="text-xs font-bold text-emerald-800 mt-0.5">
                Lvl {topThree[0].level} {topThree[0].levelTitle}
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 text-center space-y-3 shadow-sm order-3 relative">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-700 text-amber-100 font-black text-sm flex items-center justify-center -mt-10 border-4 border-white shadow-md">
              3
            </div>
            <img
              src={topThree[2].avatarUrl}
              alt={topThree[2].name}
              className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-amber-700/40"
            />
            <div>
              <h3 className="font-bold text-stone-900 text-base">{topThree[2].name}</h3>
              <p className="text-xs text-stone-500">{topThree[2].crop} • {topThree[2].location}</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
              <span className="text-xl font-black text-stone-900">{topThree[2].points} pts</span>
              <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                Lvl {topThree[2].level} {topThree[2].levelTitle}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CURRENT USER RANK STICKY BANNER */}
      {currentUserRank && (
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-base">
              #{currentUserRank.rank}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Your Current Ranking
              </div>
              <div className="text-sm font-bold">{currentUserRank.name} ({currentUserRank.crop})</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-lg font-black text-emerald-100">{currentUserRank.points} pts</div>
              <div className="text-[11px] text-emerald-200">{currentUserRank.badgesCount} badges unlocked</div>
            </div>
          </div>
        </div>
      )}

      {/* FULL LEADERBOARD TABLE */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-sm">Full Standings Table</h3>
          <span className="text-xs text-stone-400">Total Participants: {leaderboard.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Rank</th>
                <th className="py-3.5 px-6">Farmer</th>
                <th className="py-3.5 px-6">Main Crop & Soil</th>
                <th className="py-3.5 px-6">Level</th>
                <th className="py-3.5 px-6">Streak</th>
                <th className="py-3.5 px-6">Badges</th>
                <th className="py-3.5 px-6 text-right">Sustainability Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {leaderboard.map((farmer) => {
                const isCurrent = user?.id === farmer.id;

                return (
                  <tr
                    key={farmer.id}
                    className={`hover:bg-stone-50/80 transition-colors ${
                      isCurrent ? 'bg-emerald-50/70 font-semibold text-emerald-950' : ''
                    }`}
                  >
                    <td className="py-4 px-6 font-extrabold text-stone-900">
                      {farmer.rank === 1 ? '🥇 1' : farmer.rank === 2 ? '🥈 2' : farmer.rank === 3 ? '🥉 3' : `#${farmer.rank}`}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={farmer.avatarUrl}
                          alt={farmer.name}
                          className="w-8 h-8 rounded-full object-cover border border-stone-200"
                        />
                        <div>
                          <div className="font-bold text-stone-900">{farmer.name}</div>
                          <div className="text-[10px] text-stone-400">{farmer.location}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium">
                        {farmer.crop}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-bold text-emerald-800">
                        Lvl {farmer.level} ({farmer.levelTitle})
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1 font-bold text-amber-700">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        {farmer.streak}d
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1 text-purple-700 font-bold">
                        <Award className="w-3.5 h-3.5" />
                        {farmer.badgesCount}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right font-black text-stone-900 text-sm">
                      {farmer.points} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
