import { Router, Response } from 'express';
import {
  WeightedMultiFactorRecommendationEngine,
  RecommendationEngineBaseline,
  DEFAULT_FACTOR_WEIGHTS,
} from '../services/recommendationEngine';
import { optionalAuthenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db/store';
import { User } from '../db/types';

const router = Router();

// GET /api/evaluation/recommendations/compare
router.get('/recommendations/compare', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const { crop, soil, method, farmSize, experience, location, state } = req.query;

  const testProfile: Partial<User> = req.user
    ? {
        ...req.user,
        ...(crop && { mainCrop: crop as string }),
        ...(soil && { soilType: soil as any }),
        ...(method && { farmingMethod: method as any }),
        ...(farmSize && { farmSize: Number(farmSize) }),
        ...(experience && { experienceLevel: experience as any }),
        ...(location && { location: location as string }),
        ...(state && { state: state as string }),
      }
    : {
        id: 'eval_sample_farmer',
        name: 'Evaluation Sample Profile',
        mainCrop: (crop as string) || 'Tomato',
        soilType: (soil as any) || 'Sandy',
        farmingMethod: (method as any) || 'Organic',
        farmSize: farmSize ? Number(farmSize) : 3.5,
        experienceLevel: (experience as any) || 'Intermediate',
        location: (location as string) || 'Anand',
        state: (state as string) || 'Gujarat',
      };

  // 1. Run Baseline Engine
  const baselineRecs = RecommendationEngineBaseline.getRecommendationsForUser(testProfile, 6);

  // 2. Run Weighted Multi-Factor Engine
  const multiFactorRecs = WeightedMultiFactorRecommendationEngine.getRecommendationsForUser(
    testProfile,
    6,
    DEFAULT_FACTOR_WEIGHTS
  );

  // Compute empirical comparison metrics
  const baselineIds = baselineRecs.map((r) => r.practice.id);
  const multiFactorIds = multiFactorRecs.map((r) => r.practice.id);

  // Jaccard similarity between top-K sets
  const intersection = baselineIds.filter((id) => multiFactorIds.includes(id));
  const union = Array.from(new Set([...baselineIds, ...multiFactorIds]));
  const jaccardSimilarity = union.length > 0 ? (intersection.length / union.length) : 1;

  // Average score differences
  const avgBaselineScore = Math.round(
    baselineRecs.reduce((sum, r) => sum + r.matchScore, 0) / baselineRecs.length
  );
  const avgMultiFactorScore = Math.round(
    multiFactorRecs.reduce((sum, r) => sum + r.matchScore, 0) / multiFactorRecs.length
  );

  // Rank displacement
  let totalDisplacement = 0;
  multiFactorIds.forEach((id, index) => {
    const baseIndex = baselineIds.indexOf(id);
    if (baseIndex !== -1) {
      totalDisplacement += Math.abs(index - baseIndex);
    } else {
      totalDisplacement += 6; // penalized for not being in top-6
    }
  });

  const safetyFilteredCount = multiFactorRecs.filter((r) => r.isSafetyFiltered).length;

  return res.json({
    researchTitle: 'AgriX Recommendation Engine Empirical Comparison Study',
    profileEvaluated: {
      crop: testProfile.mainCrop,
      soil: testProfile.soilType,
      method: testProfile.farmingMethod,
      farmSize: testProfile.farmSize,
      experience: testProfile.experienceLevel,
      location: `${testProfile.location}, ${testProfile.state}`,
    },
    metrics: {
      topKOverlapCount: intersection.length,
      topKSize: 6,
      jaccardIndex: Number(jaccardSimilarity.toFixed(3)),
      rankDisplacementSum: totalDisplacement,
      avgBaselineScore,
      avgMultiFactorScore,
      scoreVariance: Math.abs(avgMultiFactorScore - avgBaselineScore),
      safetyInterventionsTriggered: safetyFilteredCount,
    },
    baselineResults: baselineRecs.map((r, i) => ({
      rank: i + 1,
      practiceId: r.practice.id,
      title: r.practice.title,
      category: r.practice.category,
      matchScore: r.matchScore,
      matchReasons: r.matchReasons,
    })),
    multiFactorResults: multiFactorRecs.map((r, i) => ({
      rank: i + 1,
      practiceId: r.practice.id,
      title: r.practice.title,
      category: r.practice.category,
      matchScore: r.matchScore,
      factorScores: r.factorScores,
      matchReasons: r.matchReasons,
      isSafetyFiltered: r.isSafetyFiltered,
      safetyWarning: r.safetyWarning,
    })),
  });
});

// GET /api/evaluation/metrics
router.get('/metrics', (req, res) => {
  const users = db.getAllUsers();
  const farmers = users.filter((u) => u.role === 'farmer');
  const practices = Array.from(db.practices.values());
  const challenges = Array.from(db.challenges.values());
  const transactions = Array.from(db.rewardTransactions.values());
  const badges = Array.from(db.badges.values());
  const userBadges = Array.from(db.userBadges.values());

  const categories = Array.from(new Set(practices.map((p) => p.category)));
  const categoryDistribution: Record<string, number> = {};
  categories.forEach((cat) => {
    categoryDistribution[cat] = practices.filter((p) => p.category === cat).length;
  });

  const totalPointsDistributed = transactions.reduce((sum, tx) => sum + tx.pointsAwarded, 0);

  return res.json({
    platformOverview: {
      totalRegisteredFarmers: farmers.length,
      totalPracticesCataloged: practices.length,
      totalChallengesAvailable: challenges.length,
      totalBadgesConfigured: badges.length,
      totalBadgesAwarded: userBadges.length,
      totalRewardTransactionsRecorded: transactions.length,
      totalPointsAwardedViaLedger: totalPointsDistributed,
      recommendationAuditLogsCount: db.recommendationLogs.length,
    },
    practiceDistributionByCategory: categoryDistribution,
    activeFactorWeights: DEFAULT_FACTOR_WEIGHTS,
    researchMethodology: {
      architecture: 'Multi-Factor Normalized Additive Weighting (NAW) with Constraint Filtering',
      evaluationFramework: 'Comparative study against baseline 5-factor heuristic algorithm',
      transparencyModel: 'Deterministic multi-factor score attribution + ICAR agronomic source citations',
    },
  });
});

export default router;
