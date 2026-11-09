import React, { useState, useEffect } from 'react';
import {
  Compass,
  Filter,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Info,
  CheckCircle2,
  Play,
  RotateCcw,
  BookOpen,
  X,
  ShieldAlert,
  Sliders,
  Scale,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ScoredPractice, SoilType, FarmingMethod, ExperienceLevel, AIExplainedPractice } from '../types';

interface RecommendationsPageProps {
  onSelectTab: (tab: string) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ onSelectTab }) => {
  const { user, refreshUser } = useAuth();
  const [recommendations, setRecommendations] = useState<ScoredPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Algorithm mode
  const [algorithm, setAlgorithm] = useState<'weighted_multifactor' | 'baseline'>('weighted_multifactor');

  // Simulation filters
  const [filterCrop, setFilterCrop] = useState(user?.mainCrop || 'Tomato');
  const [filterSoil, setFilterSoil] = useState<SoilType>(user?.soilType || 'Loamy');
  const [filterMethod, setFilterMethod] = useState<FarmingMethod>(user?.farmingMethod || 'Organic');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  // AI Explanation Modal state
  const [explainingPractice, setExplainingPractice] = useState<ScoredPractice | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplainedPractice | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Factor breakdown expanded cards
  const [expandedFactorCardId, setExpandedFactorCardId] = useState<string | null>(null);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.generateRecommendations({
        crop: filterCrop,
        soil: filterSoil,
        method: filterMethod,
        farmSize: user?.farmSize || 3,
        experienceLevel: user?.experienceLevel || 'Intermediate',
        location: user?.location || 'India',
        state: user?.state || 'Gujarat',
        algorithm,
      });
      setRecommendations(res.recommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [filterCrop, filterSoil, filterMethod, algorithm]);

  const handleStartChallenge = async (rec: ScoredPractice) => {
    if (!rec.challenge) {
      onSelectTab('challenges');
      return;
    }

    try {
      setActionLoading(rec.challenge.id);
      await api.startChallenge(rec.challenge.id);
      await refreshUser();
      onSelectTab('challenges');
    } catch (err: any) {
      alert(err.message || 'Failed to start challenge');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExplainWithAI = async (rec: ScoredPractice) => {
    setExplainingPractice(rec);
    setAiExplanation(null);
    setAiError(null);
    setAiLoading(true);

    try {
      const res = await api.explainPractice(rec.practice.id);
      if (res.success && res.explanation) {
        setAiExplanation(res.explanation);
      } else {
        throw new Error('Failed to load structured explanation');
      }
    } catch (err: any) {
      setAiError(err.message || 'Could not connect to AI advisor. Falling back to agronomic guide.');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredPractices = recommendations.filter((r) => {
    if (filterCategory !== 'All' && r.practice.category !== filterCategory) return false;
    if (filterDifficulty !== 'All' && r.practice.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Personalized Recommendations
            </h1>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Multi-factor agronomic recommendation engine evaluating crop compatibility (25%), soil dynamics (20%), seasonal window (15%), agro-climate (15%), farming method (10%), experience (10%), and farm scale (5%).
          </p>
        </div>

        {/* Algorithm Switcher */}
        <div className="bg-stone-100 p-1 rounded-2xl flex items-center gap-1 border border-stone-200 self-start md:self-auto">
          <button
            onClick={() => setAlgorithm('weighted_multifactor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              algorithm === 'weighted_multifactor'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>Multi-Factor (7 Factors)</span>
          </button>
          <button
            onClick={() => setAlgorithm('baseline')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              algorithm === 'baseline'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-stone-600" />
            <span>Baseline (5 Factors)</span>
          </button>
        </div>
      </div>

      {/* FILTER & SIMULATION CONTROL PANEL */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            Farm Parameters & Scenario Modeling
          </div>

          <button
            onClick={() => {
              setFilterCrop(user?.mainCrop || 'Tomato');
              setFilterSoil(user?.soilType || 'Loamy');
              setFilterMethod(user?.farmingMethod || 'Organic');
              setFilterCategory('All');
              setFilterDifficulty('All');
            }}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to My Farm Profile
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Crop</label>
            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Tomato">Tomato</option>
              <option value="Rice">Rice / Paddy</option>
              <option value="Banana">Banana</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Groundnut">Groundnut</option>
              <option value="Wheat">Wheat</option>
              <option value="Vegetables">Mixed Vegetables</option>
              <option value="Millets">Millets</option>
              <option value="Cotton">Cotton</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Soil Type</label>
            <select
              value={filterSoil}
              onChange={(e) => setFilterSoil(e.target.value as SoilType)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Loamy">Loamy</option>
              <option value="Clay">Clay</option>
              <option value="Sandy">Sandy</option>
              <option value="Silty">Silty</option>
              <option value="Black soil">Black soil</option>
              <option value="Red soil">Red soil</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Farming Method</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as FarmingMethod)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Organic">Organic</option>
              <option value="Natural farming">Natural farming</option>
              <option value="Mixed">Mixed</option>
              <option value="Conventional">Conventional</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Categories</option>
              <option value="Water Conservation">Water Conservation</option>
              <option value="Soil Health">Soil Health</option>
              <option value="Organic Farming">Organic Farming</option>
              <option value="Pest Management">Pest Management</option>
              <option value="Biodiversity">Biodiversity</option>
              <option value="Waste Reduction">Waste Reduction</option>
              <option value="Energy Efficiency">Energy Efficiency</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS CARDS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPractices.map((rec) => {
          const isExpanded = expandedFactorCardId === rec.practice.id;

          return (
            <div
              key={rec.practice.id}
              className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Safety Warning Banner if applicable */}
              {rec.practice.safetyCritical && filterSoil === 'Sandy' && rec.practice.id === 'prac_1' && (
                <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-[11px]">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span><strong>Safety Restriction:</strong> AWD is not recommended in coarse sandy soils due to excessive percolation loss.</span>
                </div>
              )}

              {/* Match Score & Category Badge */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    {rec.practice.category}
                  </span>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{rec.matchScore}% Compatibility</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-stone-900 leading-snug mb-2">
                  {rec.practice.title}
                </h3>

                {/* Why recommended highlight */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-100/90 rounded-2xl text-xs text-emerald-950 space-y-1 mb-3">
                  <div className="font-bold text-emerald-900 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-emerald-700" />
                    Why it is recommended:
                  </div>
                  <p className="leading-relaxed text-[11px]">{rec.whyRecommended}</p>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  {rec.practice.description}
                </p>

                {/* 7-Factor Breakdown Toggle */}
                {rec.factorScores && (
                  <div className="mb-4">
                    <button
                      onClick={() => setExpandedFactorCardId(isExpanded ? null : rec.practice.id)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide Factor Breakdown' : 'View 7-Factor Scoring Breakdown'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-[11px]">
                        <div className="flex justify-between items-center text-stone-700">
                          <span>1. Crop Compatibility (25%)</span>
                          <span className="font-bold text-stone-900">{rec.factorScores.cropScore}/100</span>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${rec.factorScores.cropScore}%` }} />
                        </div>

                        <div className="flex justify-between items-center text-stone-700">
                          <span>2. Soil Dynamic Match (20%)</span>
                          <span className="font-bold text-stone-900">{rec.factorScores.soilScore}/100</span>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${rec.factorScores.soilScore}%` }} />
                        </div>

                        <div className="flex justify-between items-center text-stone-700">
                          <span>3. Seasonal Sync (15%)</span>
                          <span className="font-bold text-stone-900">{rec.factorScores.seasonScore}/100</span>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${rec.factorScores.seasonScore}%` }} />
                        </div>

                        <div className="flex justify-between items-center text-stone-700">
                          <span>4. Location / Agro-climate (15%)</span>
                          <span className="font-bold text-stone-900">{rec.factorScores.locationScore}/100</span>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${rec.factorScores.locationScore}%` }} />
                        </div>

                        <div className="flex justify-between items-center text-stone-700">
                          <span>5. Farming Method (10%)</span>
                          <span className="font-bold text-stone-900">{rec.factorScores.farmingMethodScore}/100</span>
                        </div>

                        <div className="flex justify-between items-center text-stone-700">
                          <span>6. Experience Appropriateness (10%)</span>
                          <span className="font-bold text-stone-900">{rec.factorScores.experienceScore}/100</span>
                        </div>

                        <div className="flex justify-between items-center text-stone-700">
                          <span>7. Farm Size Fit (5%)</span>
                          <span className="font-bold text-stone-900">{rec.factorScores.farmSizeScore}/100</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Steps summary */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Practical Steps:
                  </div>
                  <ul className="space-y-1 text-xs text-stone-600">
                    {rec.practice.steps.slice(0, 3).map((st, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-stone-100 text-stone-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-tight">{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Meta details */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100 text-xs text-stone-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Est: {rec.practice.estimatedCompletion}</span>
                  </div>
                  <div className="font-bold text-emerald-700">+{rec.practice.points} Points</div>
                </div>
              </div>

              {/* Action Buttons: Explain with AI + Start Challenge */}
              <div className="pt-4 mt-3 border-t border-stone-100 space-y-2">
                <button
                  onClick={() => handleExplainWithAI(rec)}
                  className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Explain with AgriX AI</span>
                </button>

                <button
                  onClick={() => handleStartChallenge(rec)}
                  disabled={actionLoading === rec.challenge?.id}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>
                    {rec.userChallengeStatus === 'verified'
                      ? 'Challenge Completed'
                      : rec.userChallengeStatus === 'submitted'
                      ? 'Review Pending'
                      : rec.userChallengeStatus === 'in_progress'
                      ? 'Continue Active Challenge'
                      : 'Start Corresponding Challenge'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI EXPLANATION MODAL */}
      {explainingPractice && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full w-fit mb-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>AgriX Agronomy AI Guidance</span>
                </div>
                <h2 className="text-xl font-extrabold text-stone-900">
                  {explainingPractice.practice.title}
                </h2>
              </div>
              <button
                onClick={() => setExplainingPractice(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-stone-600 font-medium">
                  Generating grounded agronomic explanation tailored for your {filterCrop} on {filterSoil} soil...
                </p>
              </div>
            ) : aiExplanation ? (
              <div className="space-y-4 text-xs">
                {/* Farmer Custom Why */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-700" />
                    Why this practice is recommended for your farm:
                  </h4>
                  <p className="text-emerald-900 leading-relaxed">
                    {aiExplanation.whyForFarmer}
                  </p>
                </div>

                {/* Practical Overview */}
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                    Agronomic Working Principle:
                  </h4>
                  <p className="text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-2xl border border-stone-200">
                    {aiExplanation.overview}
                  </p>
                </div>

                {/* Required Materials */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                    Required Materials & Tools:
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiExplanation.requiredMaterials.map((mat, i) => (
                      <li key={i} className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-100 text-stone-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="leading-tight">{mat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Precautions */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-amber-900">
                  <h4 className="font-bold flex items-center gap-1.5 text-amber-950">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    Essential Safety & Field Precautions:
                  </h4>
                  <ul className="space-y-1 pl-5 list-disc text-[11px] leading-relaxed">
                    {aiExplanation.precautions.map((prec, i) => (
                      <li key={i}>{prec}</li>
                    ))}
                  </ul>
                </div>

                {/* Expected Benefits */}
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                    Documented Benefits:
                  </h4>
                  <ul className="space-y-1 pl-5 list-disc text-stone-700">
                    {aiExplanation.expectedBenefits.map((ben, i) => (
                      <li key={i}>{ben}</li>
                    ))}
                  </ul>
                </div>

                {/* Source Citation */}
                <div className="p-2.5 bg-stone-100 rounded-xl border border-stone-200 text-[11px] text-stone-600">
                  <strong>Scientific & Agronomic Citation:</strong> {aiExplanation.sourceCitation}
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-stone-400 italic">
                  {aiExplanation.disclaimer}
                </p>

                {/* Action button inside modal */}
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setExplainingPractice(null);
                      handleStartChallenge(explainingPractice);
                    }}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Challenge on AgriX</span>
                  </button>
                  <button
                    onClick={() => setExplainingPractice(null)}
                    className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-rose-600">{aiError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
