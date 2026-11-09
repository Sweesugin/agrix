import { Router, Response } from 'express';
import {
  WeightedMultiFactorRecommendationEngine,
  RecommendationEngineBaseline,
  DEFAULT_FACTOR_WEIGHTS,
} from '../services/recommendationEngine';
import { optionalAuthenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db/store';
import { User, FactorWeights } from '../db/types';

const router = Router();

// GET /api/recommendations
router.get('/', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const { algorithm = 'weighted_multifactor' } = req.query;
  let user: User | undefined = req.user;

  if (!user) {
    const { crop, soil, method, location, experience, state, farmSize } = req.query;
    user = {
      id: 'guest',
      name: 'Guest Farmer',
      email: 'guest@agrix.org',
      passwordHash: '',
      role: 'farmer',
      phone: '',
      location: (location as string) || 'Anand',
      state: (state as string) || 'Gujarat',
      farmSize: farmSize ? Number(farmSize) : 3,
      soilType: (soil as any) || 'Loamy',
      mainCrop: (crop as string) || 'Tomato',
      farmingMethod: (method as any) || 'Mixed',
      experienceLevel: (experience as any) || 'Intermediate',
      points: 100,
      level: 1,
      levelTitle: 'Seedling',
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
  }

  const selectedAlgo = algorithm === 'baseline' ? 'baseline' : 'weighted_multifactor';
  const recommendations =
    selectedAlgo === 'baseline'
      ? RecommendationEngineBaseline.getRecommendationsForUser(user, 6)
      : WeightedMultiFactorRecommendationEngine.getRecommendationsForUser(user, 6, DEFAULT_FACTOR_WEIGHTS);

  // Cross-reference which practices already have challenges started or completed by this user
  const userChallenges = user.id !== 'guest'
    ? Array.from(db.userChallenges.values()).filter((uc) => uc.userId === user!.id)
    : [];

  const enriched = recommendations.map((rec) => {
    // Find associated challenge by direct relatedChallengeId or practiceId
    const matchingChallenge =
      db.challenges.get(rec.practice.relatedChallengeId) ||
      Array.from(db.challenges.values()).find((c) => c.practiceId === rec.practice.id);

    const userChallenge = matchingChallenge
      ? userChallenges.find((uc) => uc.challengeId === matchingChallenge.id)
      : undefined;

    return {
      ...rec,
      challenge: matchingChallenge,
      userChallengeStatus: userChallenge?.status || 'not_started',
      userChallenge,
    };
  });

  // Log recommendation for research evaluation tracking
  if (user.id !== 'guest') {
    db.logRecommendation({
      userId: user.id,
      algorithm: selectedAlgo,
      farmerProfileSnapshot: {
        crop: user.mainCrop,
        soil: user.soilType,
        season: 'Current',
        location: user.location,
        state: user.state,
        farmingMethod: user.farmingMethod,
        experienceLevel: user.experienceLevel,
        farmSize: user.farmSize,
      },
      recommendations: enriched.map((r, idx) => ({
        practiceId: r.practice.id,
        title: r.practice.title,
        compatibilityScore: r.matchScore,
        factorScores: r.factorScores || {
          cropScore: 50,
          soilScore: 50,
          seasonScore: 50,
          locationScore: 50,
          farmingMethodScore: 50,
          experienceScore: 50,
          farmSizeScore: 50,
        },
        rank: idx + 1,
      })),
      executionTimeMs: 12,
    });
  }

  return res.json({
    algorithm: selectedAlgo,
    factorWeights: DEFAULT_FACTOR_WEIGHTS,
    farmerContext: {
      id: user.id,
      name: user.name,
      crop: user.mainCrop,
      soil: user.soilType,
      method: user.farmingMethod,
      farmSize: user.farmSize,
      state: user.state,
      location: user.location,
      experienceLevel: user.experienceLevel,
    },
    recommendations: enriched,
  });
});

// POST /api/recommendations/generate
router.post('/generate', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const {
    crop,
    soil,
    method,
    farmSize,
    experienceLevel,
    location,
    state,
    algorithm = 'weighted_multifactor',
    customWeights,
  } = req.body;

  const weights: FactorWeights = customWeights
    ? { ...DEFAULT_FACTOR_WEIGHTS, ...customWeights }
    : DEFAULT_FACTOR_WEIGHTS;

  const mockUser: User = req.user
    ? {
        ...req.user,
        ...(crop && { mainCrop: crop }),
        ...(soil && { soilType: soil }),
        ...(method && { farmingMethod: method }),
        ...(farmSize && { farmSize: Number(farmSize) }),
        ...(experienceLevel && { experienceLevel }),
        ...(location && { location }),
        ...(state && { state }),
      }
    : {
        id: 'temp_user',
        name: 'Guest Farmer',
        email: 'guest@agrix.org',
        passwordHash: '',
        role: 'farmer',
        phone: '',
        location: location || 'General',
        state: state || 'Gujarat',
        farmSize: Number(farmSize) || 2,
        soilType: soil || 'Loamy',
        mainCrop: crop || 'Tomato',
        farmingMethod: method || 'Organic',
        experienceLevel: experienceLevel || 'Beginner',
        points: 0,
        level: 1,
        levelTitle: 'Seedling',
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

  const selectedAlgo = algorithm === 'baseline' ? 'baseline' : 'weighted_multifactor';
  const recommendations =
    selectedAlgo === 'baseline'
      ? RecommendationEngineBaseline.getRecommendationsForUser(mockUser, 6)
      : WeightedMultiFactorRecommendationEngine.getRecommendationsForUser(mockUser, 6, weights);

  const userChallenges = mockUser.id !== 'temp_user'
    ? Array.from(db.userChallenges.values()).filter((uc) => uc.userId === mockUser.id)
    : [];

  const enriched = recommendations.map((rec) => {
    const matchingChallenge =
      db.challenges.get(rec.practice.relatedChallengeId) ||
      Array.from(db.challenges.values()).find((c) => c.practiceId === rec.practice.id);

    const userChallenge = matchingChallenge
      ? userChallenges.find((uc) => uc.challengeId === matchingChallenge.id)
      : undefined;

    return {
      ...rec,
      challenge: matchingChallenge,
      userChallengeStatus: userChallenge?.status || 'not_started',
      userChallenge,
    };
  });

  return res.json({
    algorithm: selectedAlgo,
    factorWeights: weights,
    farmerContext: {
      crop: mockUser.mainCrop,
      soil: mockUser.soilType,
      method: mockUser.farmingMethod,
      farmSize: mockUser.farmSize,
      state: mockUser.state,
      location: mockUser.location,
      experienceLevel: mockUser.experienceLevel,
    },
    recommendations: enriched,
  });
});

// GET /api/recommendations/practices/:id
router.get('/practices/:id', (req, res) => {
  const practice = db.practices.get(req.params.id);
  if (!practice) {
    return res.status(404).json({ error: 'Sustainable practice not found' });
  }

  const challenge =
    db.challenges.get(practice.relatedChallengeId) ||
    Array.from(db.challenges.values()).find((c) => c.practiceId === practice.id);

  return res.json({
    practice,
    relatedChallenge: challenge,
  });
});

export default router;
