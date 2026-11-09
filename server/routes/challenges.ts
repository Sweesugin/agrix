import { Router, Response } from 'express';
import { db, calculateLevel } from '../db/store';
import { authenticate, optionalAuthenticate, AuthRequest } from '../middleware/auth';
import { UserChallenge } from '../db/types';

const router = Router();

// GET /api/challenges
router.get('/', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const { category, difficulty, status } = req.query;
  const userId = req.user?.id;

  let allChallenges = Array.from(db.challenges.values());

  if (category && category !== 'All') {
    allChallenges = allChallenges.filter((c) => c.category === category);
  }
  if (difficulty && difficulty !== 'All') {
    allChallenges = allChallenges.filter((c) => c.difficulty === difficulty);
  }

  const userChallenges = userId
    ? Array.from(db.userChallenges.values()).filter((uc) => uc.userId === userId)
    : [];

  const userChallengeMap = new Map<string, UserChallenge>();
  userChallenges.forEach((uc) => userChallengeMap.set(uc.challengeId, uc));

  let results = allChallenges.map((challenge) => {
    const uc = userChallengeMap.get(challenge.id);
    return {
      ...challenge,
      userStatus: uc?.status || 'not_started',
      startedAt: uc?.startedAt,
      completedAt: uc?.completedAt,
      proofNote: uc?.proofNote,
    };
  });

  if (status && status !== 'All') {
    results = results.filter((r) => r.userStatus === status);
  }

  return res.json({
    total: results.length,
    challenges: results,
  });
});

// POST /api/challenges/:id/start
router.post('/:id/start', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const challengeId = req.params.id;
  const challenge = db.challenges.get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found' });
  }

  const userId = req.user.id;
  let userChallenge = Array.from(db.userChallenges.values()).find(
    (uc) => uc.userId === userId && uc.challengeId === challengeId
  );

  if (userChallenge && userChallenge.status === 'completed') {
    return res.status(400).json({ error: 'Challenge is already completed' });
  }

  if (userChallenge) {
    userChallenge.status = 'in_progress';
    userChallenge.startedAt = new Date().toISOString();
  } else {
    const id = `uc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    userChallenge = {
      id,
      userId,
      challengeId,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    };
    db.userChallenges.set(id, userChallenge);
  }

  db.logActivity(userId, 'challenge_started', `Started challenge: ${challenge.title}`, 0);

  return res.json({
    message: `Challenge "${challenge.title}" started! Complete the steps to earn ${challenge.points} points.`,
    userChallenge,
  });
});

// POST /api/challenges/:id/complete
router.post('/:id/complete', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const challengeId = req.params.id;
  const { proofNote, proofImageUrl } = req.body;
  const challenge = db.challenges.get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found' });
  }

  const userId = req.user.id;
  let userChallenge = Array.from(db.userChallenges.values()).find(
    (uc) => uc.userId === userId && uc.challengeId === challengeId
  );

  if (userChallenge && userChallenge.status === 'completed') {
    return res.status(400).json({ error: 'Challenge has already been completed and points awarded' });
  }

  const now = new Date().toISOString();
  if (!userChallenge) {
    const id = `uc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    userChallenge = {
      id,
      userId,
      challengeId,
      status: 'completed',
      startedAt: now,
      completedAt: now,
      proofNote: proofNote || 'Completed via AgriX Action Step.',
      proofImageUrl,
    };
    db.userChallenges.set(id, userChallenge);
  } else {
    userChallenge.status = 'completed';
    userChallenge.completedAt = now;
    if (proofNote) userChallenge.proofNote = proofNote;
    if (proofImageUrl) userChallenge.proofImageUrl = proofImageUrl;
  }

  // Award challenge points to user
  const updatedPoints = req.user.points + challenge.points;
  const levelData = calculateLevel(updatedPoints);

  // Update streak if active
  const today = now.split('T')[0];
  let newStreak = req.user.streak;
  if (req.user.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    newStreak = req.user.lastActiveDate === yesterday ? req.user.streak + 1 : 1;
  }

  const updatedUser = db.updateUser(userId, {
    points: updatedPoints,
    level: levelData.level,
    levelTitle: levelData.levelTitle,
    streak: newStreak,
    lastActiveDate: today,
  });

  // Log activity
  db.logActivity(
    userId,
    'challenge_completed',
    `Completed challenge: ${challenge.title} (+${challenge.points} pts)`,
    challenge.points
  );

  // Automatically check and award any newly unlocked badges!
  const newlyUnlockedBadges = db.checkAndAwardBadges(userId);

  return res.json({
    message: `Congratulations! You completed "${challenge.title}" and earned ${challenge.points} points!`,
    pointsEarned: challenge.points,
    totalPoints: updatedUser?.points || updatedPoints,
    currentLevel: updatedUser?.level || levelData.level,
    levelTitle: updatedUser?.levelTitle || levelData.levelTitle,
    newlyUnlockedBadges,
    userChallenge,
  });
});

export default router;
