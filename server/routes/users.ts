import { Router, Response } from 'express';
import { db, calculateLevel } from '../db/store';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/profile
router.get('/profile', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { passwordHash: _, ...user } = req.user;
  const levelInfo = calculateLevel(user.points);

  const userBadges = Array.from(db.userBadges.values())
    .filter((ub) => ub.userId === user.id)
    .map((ub) => {
      const badge = db.badges.get(ub.badgeId);
      return { ...badge, unlockedAt: ub.unlockedAt };
    });

  const userChallenges = Array.from(db.userChallenges.values())
    .filter((uc) => uc.userId === user.id)
    .map((uc) => {
      const challenge = db.challenges.get(uc.challengeId);
      return { ...uc, challenge };
    });

  const completedCount = userChallenges.filter((uc) => uc.status === 'completed').length;
  const inProgressCount = userChallenges.filter((uc) => uc.status === 'in_progress').length;

  return res.json({
    user,
    levelInfo,
    badges: userBadges,
    challenges: userChallenges,
    stats: {
      totalPoints: user.points,
      currentLevel: user.level,
      levelTitle: user.levelTitle,
      streak: user.streak,
      badgesCount: userBadges.length,
      completedChallengesCount: completedCount,
      inProgressChallengesCount: inProgressCount,
    },
  });
});

// PUT /api/users/profile
router.put('/profile', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    name,
    phone,
    location,
    state,
    farmSize,
    soilType,
    mainCrop,
    farmingMethod,
    experienceLevel,
  } = req.body;

  const updated = db.updateUser(req.user.id, {
    ...(name && { name }),
    ...(phone !== undefined && { phone }),
    ...(location && { location }),
    ...(state && { state }),
    ...(farmSize !== undefined && { farmSize: Number(farmSize) }),
    ...(soilType && { soilType }),
    ...(mainCrop && { mainCrop }),
    ...(farmingMethod && { farmingMethod }),
    ...(experienceLevel && { experienceLevel }),
  });

  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash: _, ...safeUser } = updated;
  return res.json({
    message: 'Profile updated successfully',
    user: safeUser,
  });
});

export default router;
