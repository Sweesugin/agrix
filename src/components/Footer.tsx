import React from 'react';
import { Sprout, ShieldCheck, Heart, Sparkles, BookOpen } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-14 pb-10 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Concept */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">AgriX</span>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-md">
              A Gamified Digital Platform to Promote Sustainable Farming Practices. Designed to help smallholder farmers discover customized sustainable recommendations through actionable challenges, points, badges, streaks, community peer learning, and AI guidance.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Sparkles className="w-4 h-4" />
              Farmer Profile → Recommendation Engine → Gamified Challenges → Badges → Community
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button onClick={() => onSelectTab('recommendations')} className="hover:text-emerald-400">
                  Personalized Recommendations
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('challenges')} className="hover:text-emerald-400">
                  Sustainable Challenges
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('progress')} className="hover:text-emerald-400">
                  Points, Levels & Badges
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('leaderboard')} className="hover:text-emerald-400">
                  Regional Leaderboards
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('community')} className="hover:text-emerald-400">
                  Farmer Community Board
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('marketplace')} className="hover:text-emerald-400">
                  Eco Farm Inputs Marketplace
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('ai-assistant')} className="hover:text-emerald-400">
                  AgriX AI Assistant
                </button>
              </li>
            </ul>
          </div>

          {/* Research & Ethical Disclaimer */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Research Prototype
            </h4>
            <div className="bg-stone-800/80 rounded-2xl p-3.5 border border-stone-700/60 text-[11px] text-stone-400 leading-relaxed space-y-2">
              <p>
                <strong>Scientific Integrity Note:</strong> AgriX is an educational research prototype. System recommendations do not claim scientifically proven yield multiplication or guaranteed financial returns.
              </p>
              <p>
                Always verify pesticide applications, high-value irrigation setups, and regulatory matters with local agricultural extension offices (KVK) and certified agronomists.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <div>
            © {new Date().getFullYear()} AgriX Sustainable Platform. Developed for College Project & Academic Demonstration.
          </div>
          <div className="flex items-center gap-1 text-stone-400">
            <span>Built with React, Express, MongoDB Schema & Gemini AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
