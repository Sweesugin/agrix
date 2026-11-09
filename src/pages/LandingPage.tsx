import React from 'react';
import {
  Sprout,
  Compass,
  CheckSquare,
  Award,
  Users,
  Bot,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Droplets,
  Layers,
  Leaf,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onSelectTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectTab }) => {
  const { user, setAuthModalOpen, setAuthModalMode } = useAuth();

  return (
    <div className="space-y-20 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Soft background accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-100/60 via-emerald-50/20 to-transparent -z-10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-8">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            Gamified Digital Agriculture Framework
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-tight sm:leading-tight mb-6">
            Grow Sustainably. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-600 bg-clip-text text-transparent">
              Learn. Act. Earn.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-stone-600 leading-relaxed mb-10 font-normal">
            AgriX helps farmers discover sustainable practices through personalized recommendations, practical challenges, and community learning.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (user) onSelectTab('dashboard');
                else {
                  setAuthModalMode('register');
                  setAuthModalOpen(true);
                }
              }}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 text-base transition-all hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => onSelectTab('dashboard')}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-stone-50 text-stone-800 font-bold rounded-2xl border border-stone-200 shadow-sm text-base transition-colors"
            >
              Explore Platform
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
              <div className="text-2xl font-black text-emerald-800">15+</div>
              <div className="text-xs text-stone-500 font-medium">Sustainable Practices</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
              <div className="text-2xl font-black text-emerald-800">7 Core</div>
              <div className="text-xs text-stone-500 font-medium">Ecological Categories</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
              <div className="text-2xl font-black text-amber-700">8 Badges</div>
              <div className="text-xs text-stone-500 font-medium">To Unlock & Showcase</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
              <div className="text-2xl font-black text-teal-800">Gemini AI</div>
              <div className="text-xs text-stone-500 font-medium">Context-Aware Guidance</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW AGRIX WORKS: THE CORE CONCEPTUAL PIPELINE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
            System Workflow
          </h2>
          <h3 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            How AgriX Works
          </h3>
          <p className="text-stone-600 text-sm mt-2">
            Transforming static agricultural advisory into an engaging, participatory feedback loop.
          </p>
        </div>

        {/* Pipeline Diagram */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm relative group hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-stone-900 mb-1">Farmer Profile</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Captures soil type, crop, location, acreage, experience level, and farming approach (organic, mixed, conventional).
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm relative group hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-stone-900 mb-1">Recommendation Engine</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Matches farm parameters against structured agronomic rules to select high-impact, practical sustainable practices.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm relative group hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-stone-900 mb-1">Gamified Challenges</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Converts recommendations into bite-sized missions with step-by-step verification, points rewards, and streak tracking.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm relative group hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-4">
                4
              </div>
              <h4 className="text-base font-bold text-stone-900 mb-1">Community & Badges</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Earn badges, climb the leaderboard, and post photographs to inspire peer farmers across your agro-climatic region.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
            Platform Capabilities
          </h2>
          <h3 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Comprehensive Digital Agricultural Toolbox
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6">
              <Compass className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-stone-900 mb-2">
              Personalized Recommendations
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Contextual agronomy tailored to your specific soil, crop, and irrigation setup. Clear difficulty levels, time estimates, and explanations of ecological benefits.
            </p>
            <button
              onClick={() => onSelectTab('recommendations')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              View recommendations <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-6">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-stone-900 mb-2">
              Actionable Challenges & Streaks
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Take on hands-on actions like organic mulching, neem sprays, and AWD water tubes. Complete challenges to earn points, maintain your streak, and level up.
            </p>
            <button
              onClick={() => onSelectTab('challenges')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              Browse challenges <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-6">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-stone-900 mb-2">
              AgriX AI Assistant (Gemini)
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Ask questions on water efficiency, non-chemical pest suppression, or bio-composting. Grounded with your profile details for cautious, practical guidance.
            </p>
            <button
              onClick={() => onSelectTab('ai-assistant')}
              className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
            >
              Consult AI assistant <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-stone-900 mb-2">
              Badges & Leaderboards
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Unlock prestigious badges like 💧 Water Saver, 🌿 Soil Guardian, and 🏆 Green Champion. Friendly community rankings celebrate agro-ecological champions.
            </p>
            <button
              onClick={() => onSelectTab('leaderboard')}
              className="text-xs font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1"
            >
              Check leaderboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-stone-900 mb-2">
              Farmer Community Sharing
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Share photographs of your mulched plots, ask questions about natural inputs, leave comments, and learn from real experiences of fellow cultivators.
            </p>
            <button
              onClick={() => onSelectTab('community')}
              className="text-xs font-bold text-blue-800 hover:text-blue-950 flex items-center gap-1"
            >
              Join the discussion <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6">
              <Leaf className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-stone-900 mb-2">
              Conceptual Bio-Input Marketplace
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Explore verified sustainable inputs: heirloom organic seeds, Trichoderma bio-fungicide, AWD water tubes, enriched vermicompost, and eco tools.
            </p>
            <button
              onClick={() => onSelectTab('marketplace')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              Explore inputs <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-900 rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-xl">
          <div className="max-w-2xl mx-auto relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Academic Research & College Project Demonstration
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to embark on your sustainable farming journey?
            </h3>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Step into the farmer dashboard, explore recommendations for your crop, and mark your first challenge completed today!
            </p>
            <div className="pt-2">
              <button
                onClick={() => onSelectTab('dashboard')}
                className="px-8 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-2xl shadow-lg transition-transform hover:scale-105 text-sm"
              >
                Go to Farmer Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
