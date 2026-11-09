import { Router, Response } from 'express';
import { RecommendationEngine } from '../services/recommendationEngine';
import { optionalAuthenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db/store';
import { User } from '../db/types';

const router = Router();

// GET /api/recommendations
router.get('/', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  // If user is authenticated, use their profile. Otherwise, create a default profile from query params or use Ramesh
  let user: User | undefined = req.user;

  if (!user) {
    const { crop, soil, method, location, experience } = req.query;
    user = {
      id: 'guest',
      name: 'Guest Farmer',
      email: 'guest@agrix.org',
      passwordHash: '',
      role: 'farmer',
      phone: '',
      location: (location as string) || 'Anand',
      state: 'Gujarat',
      farmSize: 3,
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

  const recommendations = RecommendationEngine.getRecommendationsForUser(user, 6);

  // Cross-reference which practices already have challenges started or completed by this user
  const userChallenges = user.id !== 'guest'
    ? Array.from(db.userChallenges.values()).filter((uc) => uc.userId === user!.id)
    : [];

  const enriched = recommendations.map((rec) => {
    // Find associated challenge if any
    const matchingChallenge = Array.from(db.challenges.values()).find(
      (c) => c.practiceId === rec.practice.id || c.title.toLowerCase().includes(rec.practice.title.toLowerCase().slice(0, 10))
    );

    const userChallenge = matchingChallenge
      ? userChallenges.find((uc) => uc.challengeId === matchingChallenge.id)
      : undefined;

    return {
      ...rec,
      challenge: matchingChallenge,
      userChallengeStatus: userChallenge?.status || 'not_started',
    };
  });

  return res.json({
    farmerContext: {
      name: user.name,
      crop: user.mainCrop,
      soil: user.soilType,
      method: user.farmingMethod,
      farmSize: user.farmSize,
    },
    recommendations: enriched,
  });
});

// POST /api/recommendations/generate
router.post('/generate', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const { crop, soil, method, farmSize, experienceLevel, location } = req.body;

  const mockUser: User = req.user
    ? {
        ...req.user,
        ...(crop && { mainCrop: crop }),
        ...(soil && { soilType: soil }),
        ...(method && { farmingMethod: method }),
        ...(farmSize && { farmSize: Number(farmSize) }),
        ...(experienceLevel && { experienceLevel }),
        ...(location && { location }),
      }
    : {
        id: 'temp_user',
        name: 'Guest Farmer',
        email: 'guest@agrix.org',
        passwordHash: '',
        role: 'farmer',
        phone: '',
        location: location || 'General',
        state: 'India',
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

  const recommendations = RecommendationEngine.getRecommendationsForUser(mockUser, 6);

  return res.json({
    farmerContext: {
      crop: mockUser.mainCrop,
      soil: mockUser.soilType,
      method: mockUser.farmingMethod,
      farmSize: mockUser.farmSize,
    },
    recommendations,
  });
});

export default router;
