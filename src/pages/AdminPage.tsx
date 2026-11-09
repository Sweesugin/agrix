import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  CheckSquare,
  ShoppingBag,
  Flag,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  Layers,
  Sprout,
  Scale,
  FileCheck,
  Sliders,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Challenge, SustainablePractice, MarketplaceProduct } from '../types';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'verifications' | 'evaluation' | 'challenges' | 'products' | 'users' | 'moderation'
  >('overview');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [evalComparison, setEvalComparison] = useState<any>(null);
  const [evalMetrics, setEvalMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Challenge form
  const [newChalTitle, setNewChalTitle] = useState('');
  const [newChalCat, setNewChalCat] = useState('Water Conservation');
  const [newChalDiff, setNewChalDiff] = useState('Easy');
  const [newChalPoints, setNewChalPoints] = useState('50');
  const [newChalBenefit, setNewChalBenefit] = useState('');

  // Product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('Seeds');
  const [newProdPrice, setNewProdPrice] = useState('250');
  const [newProdBenefit, setNewProdBenefit] = useState('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [dash, usersRes, repRes, pendingRes, evalRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminUsers(),
        api.getAdminReports(),
        api.getPendingSubmissions().catch(() => ({ count: 0, pendingSubmissions: [] })),
        api.getEvaluationMetrics().catch(() => null),
      ]);
      setDashboardStats(dash);
      setUsersList(usersRes.users);
      setReportsList(repRes.reports);
      setPendingSubmissions(pendingRes.pendingSubmissions || []);
      setEvalMetrics(evalRes);

      // Run sample comparison
      const comp = await api.compareAlgorithms().catch(() => null);
      setEvalComparison(comp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const handleVerifySubmission = async (challengeId: string, targetUserId: string) => {
    try {
      await api.verifyChallenge(challengeId, targetUserId, 'Verified implementation by Agricultural Extension Officer.');
      alert('Challenge verified and points ledger credited successfully!');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error verifying challenge');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Administrator Clearance Required</h2>
        <p className="text-xs text-stone-600 max-w-sm mx-auto">
          Please use the top <strong>Role Switcher</strong> to switch to <strong>Dr. Vandana Rao (Agri Officer)</strong> to access this administrative portal.
        </p>
      </div>
    );
  }

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createChallenge({
        title: newChalTitle,
        category: newChalCat,
        difficulty: newChalDiff,
        points: parseInt(newChalPoints, 10),
        sustainabilityBenefit: newChalBenefit || 'Saves resources and maintains soil vitality.',
      });
      alert('Challenge created!');
      setNewChalTitle('');
      setNewChalBenefit('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error creating challenge');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        name: newProdName,
        category: newProdCat,
        price: parseFloat(newProdPrice),
        sustainabilityBenefit: newProdBenefit || 'Certified biological input',
      });
      alert('Product created!');
      setNewProdName('');
      setNewProdBenefit('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error creating product');
    }
  };

  const handleResolveReport = async (reportId: string, action: 'delete_post' | 'dismiss') => {
    try {
      await api.resolveReport(reportId, action);
      alert(`Report action: ${action}`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error resolving report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              AgriX Administration Portal
            </h1>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Manage sustainable practices, field verification queue, IEEE recommendation evaluation metrics, and platform moderation.
          </p>
        </div>

        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-300">
          Admin: {user.name}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2 text-xs font-bold">
        {[
          { id: 'overview', label: 'Platform Statistics', icon: BarChart2 },
          { id: 'verifications', label: `Verification Queue (${pendingSubmissions.length})`, icon: FileCheck },
          { id: 'evaluation', label: 'IEEE Research Evaluation', icon: Scale },
          { id: 'challenges', label: 'Manage Challenges', icon: CheckSquare },
          { id: 'products', label: 'Manage Products', icon: ShoppingBag },
          { id: 'users', label: 'Farmers Registry', icon: Users },
          { id: 'moderation', label: 'Content Moderation', icon: Flag },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                isActive ? 'bg-emerald-800 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && dashboardStats && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <div className="text-[10px] font-bold text-stone-400 uppercase">Total Users</div>
              <div className="text-2xl font-black text-stone-900 mt-1">
                {dashboardStats.stats.totalUsers}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <div className="text-[10px] font-bold text-stone-400 uppercase">Registered Farmers</div>
              <div className="text-2xl font-black text-stone-900 mt-1">
                {dashboardStats.stats.totalFarmers}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <div className="text-[10px] font-bold text-stone-400 uppercase">Challenges Done</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {dashboardStats.stats.challengesCompleted}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <div className="text-[10px] font-bold text-stone-400 uppercase">Community Posts</div>
              <div className="text-2xl font-black text-blue-700 mt-1">
                {dashboardStats.stats.communityPosts}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <div className="text-[10px] font-bold text-stone-400 uppercase">Points Awarded</div>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {dashboardStats.stats.totalPointsAwarded}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <div className="text-[10px] font-bold text-stone-400 uppercase">Reported Items</div>
              <div className="text-2xl font-black text-red-700 mt-1">
                {dashboardStats.stats.reportedPostsCount}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
              <h3 className="font-bold text-stone-900 text-sm">Crop Distribution</h3>
              <div className="space-y-2 text-xs">
                {Object.entries(dashboardStats.cropStats || {}).map(([crop, count]: any) => (
                  <div key={crop} className="flex justify-between items-center py-1 border-b border-stone-100">
                    <span className="font-semibold text-stone-700">{crop}</span>
                    <span className="font-black text-emerald-800">{count} farmers</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
              <h3 className="font-bold text-stone-900 text-sm">Farming Method Breakdown</h3>
              <div className="space-y-2 text-xs">
                {Object.entries(dashboardStats.methodStats || {}).map(([method, count]: any) => (
                  <div key={method} className="flex justify-between items-center py-1 border-b border-stone-100">
                    <span className="font-semibold text-stone-700">{method}</span>
                    <span className="font-black text-teal-800">{count} farms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERIFICATIONS QUEUE TAB */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                Farmer Challenge Verification Queue
              </h3>
              <p className="text-xs text-stone-500">
                Review submitted field observations, photographic proofs, and approve deduplicated points crediting into the reward ledger.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full">
              {pendingSubmissions.length} Submissions Pending
            </span>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-xs font-semibold text-stone-700">All submissions verified!</p>
              <p className="text-[11px] text-stone-400">
                When farmers complete challenges and submit proof, their requests will appear here for extension officer audit.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
                    <div>
                      <div className="font-bold text-stone-900 text-sm">{sub.challengeTitle}</div>
                      <div className="text-xs text-stone-600">
                        Submitted by: <strong className="text-stone-900">{sub.userName}</strong> ({sub.userLocation} • {sub.mainCrop})
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold w-fit">
                      +{sub.points} Points Eligible
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
                    <span className="font-bold text-stone-900 block text-[11px] uppercase tracking-wider">
                      Farmer Implementation Note:
                    </span>
                    <p className="italic leading-relaxed">"{sub.proofNote || 'No notes provided'}"</p>
                    {sub.proofImageUrl && (
                      <div className="pt-1">
                        <a
                          href={sub.proofImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 font-semibold underline text-[11px]"
                        >
                          View Uploaded Photo Proof ↗
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      onClick={() => handleVerifySubmission(sub.challengeId, sub.userId)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Credit Reward Ledger</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* IEEE RESEARCH EVALUATION TAB */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          {/* Methodology Banner */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-stone-900 text-base">
                IEEE Empirical Algorithm Evaluation & Benchmark
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed max-w-4xl">
              This panel enables empirical benchmarking between the <strong>Baseline 5-Factor Heuristic</strong> and the <strong>Multi-Factor Normalized Additive Weighting (NAW) Engine</strong> across identical farmer profiles. Metrics measure recommendation set divergence, rank displacement, and safety constraints.
            </p>
          </div>

          {/* Metric KPI Cards */}
          {evalComparison?.metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="text-[11px] font-bold text-stone-400 uppercase">Jaccard Similarity</div>
                <div className="text-3xl font-black text-emerald-700 mt-1">
                  {evalComparison.metrics.jaccardIndex}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">Top-6 candidate overlap</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="text-[11px] font-bold text-stone-400 uppercase">Rank Displacement</div>
                <div className="text-3xl font-black text-purple-700 mt-1">
                  {evalComparison.metrics.rankDisplacementSum}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">Cumulative permutation distance</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="text-[11px] font-bold text-stone-400 uppercase">Score Variance</div>
                <div className="text-3xl font-black text-blue-700 mt-1">
                  ±{evalComparison.metrics.scoreVariance}%
                </div>
                <div className="text-[11px] text-stone-500 mt-1">Multi-factor vs Baseline avg</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="text-[11px] font-bold text-stone-400 uppercase">Safety Overrides</div>
                <div className="text-3xl font-black text-rose-600 mt-1">
                  {evalComparison.metrics.safetyInterventionsTriggered}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">Constrained unsafe practices</div>
              </div>
            </div>
          )}

          {/* Side-by-Side Algorithm Comparison Table */}
          {evalComparison && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <h4 className="font-bold text-stone-900 text-sm">
                  Top-6 Ranked Recommendations Comparison (Sample Profile: {evalComparison.profileEvaluated?.crop} on {evalComparison.profileEvaluated?.soil} soil)
                </h4>
                <button
                  onClick={async () => {
                    const comp = await api.compareAlgorithms();
                    setEvalComparison(comp);
                  }}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Re-evaluate
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Baseline Column */}
                <div className="space-y-3">
                  <div className="px-3 py-1.5 bg-stone-100 rounded-xl text-stone-800 font-bold text-xs flex justify-between">
                    <span>Baseline (5 Factors Heuristic)</span>
                    <span>Avg: {evalComparison.metrics?.avgBaselineScore}%</span>
                  </div>

                  <div className="space-y-2">
                    {evalComparison.baselineResults?.map((r: any) => (
                      <div key={r.practiceId} className="p-3 rounded-xl border border-stone-200 bg-stone-50/40 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-stone-900">
                          <span>#{r.rank} {r.title}</span>
                          <span className="text-stone-700">{r.matchScore}%</span>
                        </div>
                        <p className="text-[11px] text-stone-500">{r.category}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Factor Column */}
                <div className="space-y-3">
                  <div className="px-3 py-1.5 bg-emerald-100 text-emerald-900 rounded-xl font-bold text-xs flex justify-between">
                    <span>Multi-Factor NAW (7 Factors Weighted)</span>
                    <span>Avg: {evalComparison.metrics?.avgMultiFactorScore}%</span>
                  </div>

                  <div className="space-y-2">
                    {evalComparison.multiFactorResults?.map((r: any) => (
                      <div key={r.practiceId} className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-stone-900">
                          <span>#{r.rank} {r.title}</span>
                          <span className="text-emerald-800 font-black">{r.matchScore}%</span>
                        </div>
                        <p className="text-[11px] text-stone-600">{r.category}</p>
                        {r.factorScores && (
                          <div className="grid grid-cols-4 gap-1 text-[10px] text-stone-500 pt-1 border-t border-emerald-100">
                            <span>Crop: {r.factorScores.cropScore}</span>
                            <span>Soil: {r.factorScores.soilScore}</span>
                            <span>Season: {r.factorScores.seasonScore}</span>
                            <span>Loc: {r.factorScores.locationScore}</span>
                          </div>
                        )}
                        {r.isSafetyFiltered && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                            Safety filter active
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHALLENGES TAB */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              Add Sustainable Challenge
            </h3>

            <form onSubmit={handleCreateChallenge} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Challenge Title</label>
                <input
                  type="text"
                  required
                  value={newChalTitle}
                  onChange={(e) => setNewChalTitle(e.target.value)}
                  placeholder="e.g. Construct Bio-Digester Pit"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Category</label>
                <select
                  value={newChalCat}
                  onChange={(e) => setNewChalCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="Water Conservation">Water Conservation</option>
                  <option value="Soil Health">Soil Health</option>
                  <option value="Organic Farming">Organic Farming</option>
                  <option value="Pest Management">Pest Management</option>
                  <option value="Biodiversity">Biodiversity</option>
                  <option value="Waste Reduction">Waste Reduction</option>
                  <option value="Energy Efficiency">Energy Efficiency</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Difficulty</label>
                  <select
                    value={newChalDiff}
                    onChange={(e) => setNewChalDiff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Points Reward</label>
                  <input
                    type="number"
                    value={newChalPoints}
                    onChange={(e) => setNewChalPoints(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Sustainability Benefit</label>
                <textarea
                  rows={2}
                  value={newChalBenefit}
                  onChange={(e) => setNewChalBenefit(e.target.value)}
                  placeholder="Briefly state ecological rationale..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
              >
                Create Challenge
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <h3 className="font-bold text-stone-900 text-base">Active Challenges Registry</h3>
            <p className="text-xs text-stone-500">List of published agricultural challenges in the system.</p>
            <div className="p-4 bg-stone-50 rounded-2xl text-xs text-stone-600">
              15 Seed Challenges active in database across all 7 agro-ecological categories.
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              Add Marketplace Product
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Bio-Potash Granules"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Category</label>
                <select
                  value={newProdCat}
                  onChange={(e) => setNewProdCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="Seeds">Seeds</option>
                  <option value="Organic fertilizers">Organic fertilizers</option>
                  <option value="Compost">Compost</option>
                  <option value="Irrigation equipment">Irrigation equipment</option>
                  <option value="Farming tools">Farming tools</option>
                  <option value="Sustainable products">Sustainable products</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Sustainability Info</label>
                <input
                  type="text"
                  value={newProdBenefit}
                  onChange={(e) => setNewProdBenefit(e.target.value)}
                  placeholder="e.g. 100% natural organic carbon"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
              >
                Save Product
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <h3 className="font-bold text-stone-900 text-base">Marketplace Products Registry</h3>
            <p className="text-xs text-stone-500">15 seed products active with EcoScore certification.</p>
          </div>
        </div>
      )}

      {/* USERS REGISTRY TAB */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm">Registered Farmers & Staff</h3>
            <span className="text-xs text-stone-400">{usersList.length} Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Crop & Soil</th>
                  <th className="py-3 px-6">Method</th>
                  <th className="py-3 px-6">Points</th>
                  <th className="py-3 px-6">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50">
                    <td className="py-3.5 px-6 font-bold text-stone-900">{u.name}</td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">{u.mainCrop} ({u.soilType})</td>
                    <td className="py-3.5 px-6">{u.farmingMethod}</td>
                    <td className="py-3.5 px-6 font-bold text-emerald-800">{u.points} pts</td>
                    <td className="py-3.5 px-6 font-semibold">Lvl {u.level} {u.levelTitle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODERATION TAB */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-600" />
            Flagged Community Content Review
          </h3>

          {reportsList.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">
              No reported community content currently pending. Community feed is healthy!
            </p>
          ) : (
            <div className="space-y-3">
              {reportsList.map((rep) => (
                <div key={rep.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-stone-900">
                      Report Reason: <span className="text-red-700">{rep.reason}</span>
                    </div>
                    {rep.post && (
                      <p className="text-xs text-stone-600 italic">
                        Post Content: "{rep.post.content}"
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'dismiss')}
                      className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'delete_post')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
                    >
                      Remove Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
