import { Router, Response } from 'express';
import {
  WeightedMultiFactorRecommendationEngine,
  RecommendationEngineBaseline,
  DEFAULT_FACTOR_WEIGHTS,
} from '../services/recommendationEngine';
import { authenticate, optionalAuthenticate, requireExpert, AuthRequest } from '../middleware/auth';
import { db } from '../db/store';
import { User } from '../db/types';

const router = Router();

/**
 * Expert-Curated Agronomic Ground-Truth Archetypes
 * For IEEE research evaluation, ground-truth relevance grades are defined on a 0-3 ordinal scale:
 * 3 = Highly Relevant (Core agro-ecological practice for this archetype)
 * 2 = Relevant (Valuable synergistic practice)
 * 1 = Marginally Relevant
 * 0 = Irrelevant or Contraindicated
 */
export interface ExpertArchetype {
  id: string;
  name: string;
  agroZone: string;
  profile: Partial<User> & { currentSeason?: 'Kharif' | 'Rabi' | 'Zaid' };
  groundTruthRelevance: Record<string, number>; // practiceId -> grade 0-3
}

export const EXPERT_ARCHETYPES: ExpertArchetype[] = [
  {
    id: 'archetype_semi_arid_tomato',
    name: 'Archetype A [Anonymized]: Semi-Arid Vegetable Smallholder',
    agroZone: 'Western Semi-Arid (Loamy Sand / Sandy Loam)',
    profile: {
      id: 'eval_archetype_a',
      name: 'Farmer Archetype A',
      mainCrop: 'Tomato',
      soilType: 'Loamy',
      farmingMethod: 'Organic',
      farmSize: 2.0,
      experienceLevel: 'Intermediate',
      location: 'Regional Zone W-1',
      state: 'Gujarat',
      currentSeason: 'Rabi',
    },
    groundTruthRelevance: {
      prac_3: 3, // Mulching: Critical for vegetable evaporation control
      prac_7: 3, // Sticky Traps: Vital IPM for sucking pests on tomato
      prac_2: 3, // Drip Irrigation: High-precision water delivery
      prac_6: 2, // Vermicomposting: Soil organic conditioner
      prac_10: 2, // Percolation pit: Water harvesting
      prac_8: 1, // Biofertilizers: Supplemental
      prac_1: 0, // AWD is strictly for wetland paddy, not tomato
    },
  },
  {
    id: 'archetype_wetland_paddy',
    name: 'Archetype B [Anonymized]: Delta Wetland Paddy Cultivator',
    agroZone: 'Southern River Basin (Clay / Heavy Alluvial)',
    profile: {
      id: 'eval_archetype_b',
      name: 'Farmer Archetype B',
      mainCrop: 'Paddy / Rice',
      soilType: 'Clay',
      farmingMethod: 'Conventional',
      farmSize: 3.5,
      experienceLevel: 'Experienced',
      location: 'Regional Zone S-2',
      state: 'Tamil Nadu',
      currentSeason: 'Kharif',
    },
    groundTruthRelevance: {
      prac_1: 3, // Alternate Wetting & Drying: Proven wetland paddy technique
      prac_9: 3, // Green Manuring (Dhaincha): Prime biological nitrogen
      prac_8: 2, // Biofertilizers (Azotobacter/PSB)
      prac_10: 2, // Percolation Pit / Farm Pond
      prac_4: 2, // Crop rotation with pulses
      prac_7: 1, // Sticky traps: Secondary in open flooded field
    },
  },
  {
    id: 'archetype_rainfed_cotton',
    name: 'Archetype C [Anonymized]: Rainfed Black Soil Farmer',
    agroZone: 'Central Plateau (Vertisol / Black Cotton Soil)',
    profile: {
      id: 'eval_archetype_c',
      name: 'Farmer Archetype C',
      mainCrop: 'Cotton',
      soilType: 'Black soil',
      farmingMethod: 'Natural farming',
      farmSize: 4.5,
      experienceLevel: 'Beginner',
      location: 'Regional Zone C-3',
      state: 'Maharashtra',
      currentSeason: 'Kharif',
    },
    groundTruthRelevance: {
      prac_5: 3, // Agroforestry & Windbreaks: Buffer moisture loss in dry periods
      prac_6: 3, // Vermicomposting: Humus replenishment in cracking Vertisols
      prac_4: 3, // Legume intercropping/rotation with cotton
      prac_7: 2, // Sticky traps & Border trap crops
      prac_10: 2, // Water harvesting trench
      prac_1: 0, // AWD is contraindicated for non-paddy upland crops
    },
  },
];

/**
 * Computes Discounted Cumulative Gain (DCG@K)
 */
function computeDCG(relevanceGrades: number[]): number {
  return relevanceGrades.reduce((sum, rel, index) => {
    const rank = index + 1;
    const numerator = Math.pow(2, rel) - 1;
    const denominator = Math.log2(rank + 1);
    return sum + numerator / denominator;
  }, 0);
}

/**
 * Computes Ideal DCG (IDCG@K) given all ground truth grades
 */
function computeIDCG(allGrades: number[], k: number): number {
  const sorted = [...allGrades].sort((a, b) => b - a).slice(0, k);
  return computeDCG(sorted);
}

// GET /api/evaluation/accuracy/benchmark
// Dedicated IR benchmark endpoint computing Precision@K, Recall@K, and NDCG@K
router.get('/accuracy/benchmark', (req, res: Response) => {
  const k = 4; // Top-4 recommendation evaluation
  const benchmarkStart = performance.now();

  const archetypeBenchmarks = EXPERT_ARCHETYPES.map((arch) => {
    const tArchStart = performance.now();
    const multiFactorRecs = WeightedMultiFactorRecommendationEngine.getRecommendationsForUser(
      arch.profile,
      k,
      DEFAULT_FACTOR_WEIGHTS
    );

    const baselineRecs = RecommendationEngineBaseline.getRecommendationsForUser(arch.profile, k);
    const archExecutionMs = Number((performance.now() - tArchStart).toFixed(2));

    // Multi-Factor Grades
    const mfGrades = multiFactorRecs.map(
      (r) => arch.groundTruthRelevance[r.practice.id] ?? 0
    );

    // Baseline Grades
    const baseGrades = baselineRecs.map(
      (r) => arch.groundTruthRelevance[r.practice.id] ?? 0
    );

    // All ground-truth items with Grade >= 2 are considered "Relevant" for Precision/Recall
    const totalRelevantGroundTruth = Object.values(arch.groundTruthRelevance).filter(
      (g) => g >= 2
    ).length;

    // Precision@K = (Relevant items in top K) / K
    const mfPrecisionAtK = mfGrades.filter((g) => g >= 2).length / k;
    const basePrecisionAtK = baseGrades.filter((g) => g >= 2).length / k;

    // Recall@K = (Relevant items in top K) / (Total relevant ground truth)
    const mfRecallAtK = totalRelevantGroundTruth > 0
      ? mfGrades.filter((g) => g >= 2).length / totalRelevantGroundTruth
      : 1.0;
    const baseRecallAtK = totalRelevantGroundTruth > 0
      ? baseGrades.filter((g) => g >= 2).length / totalRelevantGroundTruth
      : 1.0;

    // NDCG@K
    const idcg = computeIDCG(Object.values(arch.groundTruthRelevance), k);
    const mfDcg = computeDCG(mfGrades);
    const baseDcg = computeDCG(baseGrades);

    const mfNdcgAtK = idcg > 0 ? Number((mfDcg / idcg).toFixed(4)) : 1.0;
    const baseNdcgAtK = idcg > 0 ? Number((baseDcg / idcg).toFixed(4)) : 1.0;

    return {
      archetypeId: arch.id,
      archetypeName: arch.name,
      agroZone: arch.agroZone,
      k,
      actualExecutionTimeMs: archExecutionMs,
      multiFactorMetrics: {
        precisionAtK: Number(mfPrecisionAtK.toFixed(4)),
        recallAtK: Number(mfRecallAtK.toFixed(4)),
        ndcgAtK: mfNdcgAtK,
        topKPracticeIds: multiFactorRecs.map((r) => r.practice.id),
      },
      baselineMetrics: {
        precisionAtK: Number(basePrecisionAtK.toFixed(4)),
        recallAtK: Number(baseRecallAtK.toFixed(4)),
        ndcgAtK: baseNdcgAtK,
        topKPracticeIds: baselineRecs.map((r) => r.practice.id),
      },
      groundTruthOverview: arch.groundTruthRelevance,
    };
  });

  const totalBenchmarkExecutionMs = Number((performance.now() - benchmarkStart).toFixed(2));

  // Calculate Macro-Averaged Summary Metrics
  const avgMfPrecision =
    archetypeBenchmarks.reduce((sum, b) => sum + b.multiFactorMetrics.precisionAtK, 0) /
    archetypeBenchmarks.length;
  const avgBasePrecision =
    archetypeBenchmarks.reduce((sum, b) => sum + b.baselineMetrics.precisionAtK, 0) /
    archetypeBenchmarks.length;

  const avgMfRecall =
    archetypeBenchmarks.reduce((sum, b) => sum + b.multiFactorMetrics.recallAtK, 0) /
    archetypeBenchmarks.length;
  const avgBaseRecall =
    archetypeBenchmarks.reduce((sum, b) => sum + b.baselineMetrics.recallAtK, 0) /
    archetypeBenchmarks.length;

  const avgMfNdcg =
    archetypeBenchmarks.reduce((sum, b) => sum + b.multiFactorMetrics.ndcgAtK, 0) /
    archetypeBenchmarks.length;
  const avgBaseNdcg =
    archetypeBenchmarks.reduce((sum, b) => sum + b.baselineMetrics.ndcgAtK, 0) /
    archetypeBenchmarks.length;

  return res.json({
    evaluationType: 'SIMULATED_BENCHMARK',
    disclaimer:
      'These metrics are algorithmic Information Retrieval benchmarks calculated against curated agronomic archetypes in a simulated testbed. They are not empirical agronomic field trials.',
    evaluationDate: new Date().toISOString(),
    measuredExecutionTimeMs: totalBenchmarkExecutionMs,
    groundTruthMethodology: {
      framework: 'Agronomic Expert Delphi Consensus & ICAR Regional Package of Practices',
      rubricScale: '0-3 Ordinal Graded Relevance',
      rubricDefinitions: {
        '3': 'Highly Relevant: Core agro-ecological intervention with direct crop, soil, and regional suitability.',
        '2': 'Relevant: Synergistic sustainable practice providing measurable resource efficiency.',
        '1': 'Marginally Relevant: Supplementary intervention with limited primary impact for the archetype.',
        '0': 'Irrelevant or Contraindicated: Mismatched crop/soil parameters or hazardous safety incompatibility.',
      },
      validationSources: [
        'ICAR (Indian Council of Agricultural Research) Sustainable Agriculture Guidelines',
        'Tamil Nadu Agricultural University (TNAU) Agritech Portal',
        'Anand Agricultural University (AAU) Organic Farming Packages',
      ],
    },
    macroAveragedMetrics: {
      k,
      multiFactor: {
        meanPrecisionAtK: Number(avgMfPrecision.toFixed(4)),
        meanRecallAtK: Number(avgMfRecall.toFixed(4)),
        meanNdcgAtK: Number(avgMfNdcg.toFixed(4)),
      },
      baseline: {
        meanPrecisionAtK: Number(avgBasePrecision.toFixed(4)),
        meanRecallAtK: Number(avgBaseRecall.toFixed(4)),
        meanNdcgAtK: Number(avgBaseNdcg.toFixed(4)),
      },
      relativeNdcgImprovementPercent: Number(
        (((avgMfNdcg - avgBaseNdcg) / (avgBaseNdcg || 1)) * 100).toFixed(2)
      ),
    },
    archetypeBenchmarks,
  });
});

// GET /api/evaluation/expert-assessments (Retrieve independent agronomic expert assessments)
router.get('/expert-assessments', (req, res: Response) => {
  const { archetypeId } = req.query;
  const rawAssessments = db.getAllExpertAssessments();

  const filtered = archetypeId
    ? rawAssessments.filter((a) => a.archetypeId === archetypeId)
    : rawAssessments;

  // Anonymize and sanitize evaluator output to protect privacy
  const sanitized = filtered.map((a) => ({
    id: a.id,
    expertName: a.expertName || 'Verified Agronomic Evaluator',
    organization: a.organization || 'Agricultural University / Research Centre',
    evaluatorRole: a.evaluatorRole || 'expert',
    archetypeId: a.archetypeId,
    practiceRatings: a.practiceRatings,
    notes: a.notes,
    createdAt: a.createdAt,
  }));

  return res.json({
    count: sanitized.length,
    assessments: sanitized,
    disclaimer:
      'Independent expert assessments recorded by certified agricultural experts for academic evaluation and validation.',
  });
});

// POST /api/evaluation/expert-assessments (Record an independent agricultural expert assessment)
// STRICT REQUIREMENT: Only authenticated accounts with 'expert' or 'admin' role can submit evaluations.
router.post('/expert-assessments', authenticate, requireExpert, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { archetypeId, practiceRatings, notes } = req.body;

  if (!archetypeId || !practiceRatings || typeof practiceRatings !== 'object') {
    return res.status(400).json({
      error: 'Validation error: archetypeId and a valid practiceRatings object are required.',
    });
  }

  // 1. Validate archetype exists in catalogue
  const archetype = EXPERT_ARCHETYPES.find((a) => a.id === archetypeId);
  if (!archetype) {
    return res.status(404).json({
      error: `Archetype ${archetypeId} not found in benchmark catalogue.`,
    });
  }

  // 2. Validate practice ratings: must exist in db.practices and be strict integer [0, 3] (no decimals!)
  const validatedRatings: Record<string, number> = {};
  const entries = Object.entries(practiceRatings);

  if (entries.length === 0) {
    return res.status(400).json({
      error: 'Validation error: practiceRatings must contain at least one practice rating.',
    });
  }

  for (const [pracId, rating] of entries) {
    if (!db.practices.has(pracId)) {
      return res.status(400).json({
        error: `Validation error: Practice ID "${pracId}" does not exist in practice catalogue.`,
      });
    }

    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 0 || rating > 3) {
      return res.status(400).json({
        error: `Invalid rating for ${pracId}: must be an exact integer between 0 and 3 (0=Contraindicated, 1=Marginal, 2=Relevant, 3=Highly Relevant). Decimal ratings are rejected.`,
      });
    }

    validatedRatings[pracId] = rating;
  }

  // 3. Validate notes length
  if (notes && (typeof notes !== 'string' || notes.length > 2000)) {
    return res.status(400).json({
      error: 'Validation error: notes must be a string under 2000 characters.',
    });
  }

  // 4. Derive identity server-side from authenticated account (NEVER trust client body for identity)
  const serverDerivedName = user.name || 'Certified Agronomist';
  const serverDerivedOrg = user.organization || 'Agricultural University / Extension Department';

  // Check for duplicate submission by this expert for this archetype (upsert/update existing)
  const existingAssessment = Array.from(db.expertAssessments.values()).find(
    (a) => a.expertUserId === user.id && a.archetypeId === archetypeId
  );

  const now = new Date().toISOString();
  const id = existingAssessment ? existingAssessment.id : `exp_eval_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const assessment = {
    id,
    expertUserId: user.id,
    expertName: serverDerivedName,
    organization: serverDerivedOrg,
    evaluatorRole: user.role,
    archetypeId,
    practiceRatings: validatedRatings,
    notes: notes ? String(notes).trim() : undefined,
    createdAt: now,
  };

  db.saveExpertAssessment(assessment);

  return res.status(201).json({
    message: 'Independent agricultural expert assessment recorded successfully.',
    assessment,
    isUpdate: !!existingAssessment,
  });
});


// GET /api/evaluation/recommendations/compare (Empirical difference comparison)
router.get('/recommendations/compare', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const { crop, soil, method, farmSize, experience, location, state, season } = req.query;

  const testProfile: Partial<User> & { currentSeason?: 'Kharif' | 'Rabi' | 'Zaid' } = req.user
    ? {
        ...req.user,
        ...(crop && { mainCrop: crop as string }),
        ...(soil && { soilType: soil as any }),
        ...(method && { farmingMethod: method as any }),
        ...(farmSize && { farmSize: Number(farmSize) }),
        ...(experience && { experienceLevel: experience as any }),
        ...(location && { location: location as string }),
        ...(state && { state: state as string }),
        ...(season && { currentSeason: season as any }),
      }
    : {
        id: 'eval_sample_farmer',
        name: 'Evaluation Sample Profile [Anonymized]',
        mainCrop: (crop as string) || 'Tomato',
        soilType: (soil as any) || 'Sandy',
        farmingMethod: (method as any) || 'Organic',
        farmSize: farmSize ? Number(farmSize) : 3.5,
        experienceLevel: (experience as any) || 'Intermediate',
        location: (location as string) || 'Zone W',
        state: (state as string) || 'Gujarat',
        currentSeason: (season as any) || 'Rabi',
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
  const jaccardSimilarity = union.length > 0 ? intersection.length / union.length : 1;

  // Average score differences
  const avgBaselineScore = Math.round(
    baselineRecs.reduce((sum, r) => sum + r.matchScore, 0) / (baselineRecs.length || 1)
  );
  const avgMultiFactorScore = Math.round(
    multiFactorRecs.reduce((sum, r) => sum + r.matchScore, 0) / (multiFactorRecs.length || 1)
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
    researchTitle: 'AgriX Recommendation Engine Algorithmic Comparison Study',
    evaluationType: 'SIMULATED_BENCHMARK',
    disclaimer:
      'This algorithmic comparison reflects computational divergence between the multi-factor and baseline heuristics under simulated conditions.',
    profileEvaluated: {
      crop: testProfile.mainCrop,
      soil: testProfile.soilType,
      method: testProfile.farmingMethod,
      farmSize: testProfile.farmSize,
      experience: testProfile.experienceLevel,
      location: `${testProfile.location || 'Unspecified'}, ${testProfile.state || 'Unspecified'}`,
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
      evaluationFramework: 'Comparative study against baseline 5-factor heuristic algorithm and expert ground truth',
      transparencyModel: 'Deterministic multi-factor score attribution + ICAR agronomic source citations',
    },
  });
});

export default router;

