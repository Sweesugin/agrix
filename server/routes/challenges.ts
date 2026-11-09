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
    const practice =
      db.practices.get(challenge.practiceId) ||
      Array.from(db.practices.values()).find((p) => p.relatedChallengeId === challenge.id);

    return {
      ...challenge,
      userStatus: uc?.status || 'not_started',
      startedAt: uc?.startedAt,
      submittedAt: uc?.submittedAt,
      verifiedAt: uc?.verifiedAt,
      completedAt: uc?.completedAt,
      proofNote: uc?.proofNote,
      proofImageUrl: uc?.proofImageUrl,
      verificationNotes: uc?.verificationNotes,
      userChallenge: uc,
      practice,
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

// GET /api/challenges/pending-verification (Admin or inspector endpoint)
router.get('/pending-verification', authenticate, (req: AuthRequest, res: Response) => {
  const pending = Array.from(db.userChallenges.values()).filter((uc) => uc.status === 'submitted');

  const enriched = pending.map((uc) => {
    const user = db.getUserById(uc.userId);
    const challenge = db.challenges.get(uc.challengeId);
    const practice = challenge ? db.practices.get(challenge.practiceId) : undefined;
    return {
      ...uc,
      userName: user?.name || 'Unknown Farmer',
      userLocation: user ? `${user.location}, ${user.state}` : '',
      mainCrop: user?.mainCrop,
      challengeTitle: challenge?.title || 'Unknown Challenge',
      points: challenge?.points || 0,
      practiceTitle: practice?.title,
    };
  });

  return res.json({
    count: enriched.length,
    pendingSubmissions: enriched,
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

  if (userChallenge && (userChallenge.status === 'verified' || (userChallenge.status as any) === 'completed')) {
    return res.status(400).json({ error: 'Challenge has already been verified and completed' });
  }

  if (userChallenge) {
    userChallenge.status = 'in_progress';
    userChallenge.startedAt = userChallenge.startedAt || new Date().toISOString();
  } else {
    const id = `uc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    userChallenge = {
      id,
      userId,
      challengeId,
      practiceId: challenge.practiceId,
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

// POST /api/challenges/:id/submit (Submit proof for verification)
router.post('/:id/submit', authenticate, (req: AuthRequest, res: Response) => {
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

  if (userChallenge && (userChallenge.status === 'verified' || (userChallenge.status as any) === 'completed')) {
    return res.status(400).json({ error: 'Challenge has already been verified and completed' });
  }

  const now = new Date().toISOString();
  if (!userChallenge) {
    const id = `uc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    userChallenge = {
      id,
      userId,
      challengeId,
      practiceId: challenge.practiceId,
      status: 'submitted',
      startedAt: now,
      submittedAt: now,
      proofNote: proofNote || 'Implementation proof submitted by farmer.',
      proofImageUrl,
    };
    db.userChallenges.set(id, userChallenge);
  } else {
    userChallenge.status = 'submitted';
    userChallenge.submittedAt = now;
    if (proofNote) userChallenge.proofNote = proofNote;
    if (proofImageUrl) userChallenge.proofImageUrl = proofImageUrl;
  }

  db.logActivity(userId, 'challenge_started', `Submitted proof for review: ${challenge.title}`, 0);

  return res.json({
    message: `Proof for "${challenge.title}" submitted successfully for verification!`,
    userChallenge,
  });
});

// POST /api/challenges/:id/verify (Verify challenge and award ledger transaction)
router.post('/:id/verify', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const challengeId = req.params.id;
  const { targetUserId, verificationNotes } = req.body;
  const challenge = db.challenges.get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found' });
  }

  // If admin verifies another user, use targetUserId; otherwise verify current user
  const beneficiaryUserId = req.user.role === 'admin' && targetUserId ? targetUserId : req.user.id;
  const beneficiaryUser = db.getUserById(beneficiaryUserId);
  if (!beneficiaryUser) {
    return res.status(404).json({ error: 'Beneficiary user not found' });
  }

  let userChallenge = Array.from(db.userChallenges.values()).find(
    (uc) => uc.userId === beneficiaryUserId && uc.challengeId === challengeId
  );

  const now = new Date().toISOString();
  if (!userChallenge) {
    const id = `uc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    userChallenge = {
      id,
      userId: beneficiaryUserId,
      challengeId,
      practiceId: challenge.practiceId,
      status: 'verified',
      startedAt: now,
      submittedAt: now,
      verifiedAt: now,
      completedAt: now,
      proofNote: 'Direct verification on AgriX platform.',
      verificationNotes: verificationNotes || 'Verified implementation against sustainable protocol standards.',
      verifiedBy: req.user.name,
    };
    db.userChallenges.set(id, userChallenge);
  } else {
    userChallenge.status = 'verified';
    userChallenge.verifiedAt = now;
    userChallenge.completedAt = now;
    userChallenge.verificationNotes = verificationNotes || 'Verified implementation against sustainable protocol standards.';
    userChallenge.verifiedBy = req.user.name;
  }

  // Deduplicated ledger reward transaction
  const rewardResult = db.recordRewardTransaction(
    beneficiaryUserId,
    challengeId,
    challenge.points,
    `Verified completion: ${challenge.title}`,
    challenge.practiceId,
    req.user.name
  );

  // If not duplicate, update points and streak
  if (!rewardResult.isDuplicate) {
    const updatedPoints = beneficiaryUser.points + challenge.points;
    const levelData = calculateLevel(updatedPoints);

    const today = now.split('T')[0];
    let newStreak = beneficiaryUser.streak;
    if (beneficiaryUser.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      newStreak = beneficiaryUser.lastActiveDate === yesterday ? beneficiaryUser.streak + 1 : 1;
    }

    db.updateUser(beneficiaryUserId, {
      points: updatedPoints,
      level: levelData.level,
      levelTitle: levelData.levelTitle,
      streak: newStreak,
      lastActiveDate: today,
    });

    db.logActivity(
      beneficiaryUserId,
      'challenge_completed',
      `Completed & verified challenge: ${challenge.title} (+${challenge.points} pts)`,
      challenge.points
    );
  }

  const newlyUnlockedBadges = db.checkAndAwardBadges(beneficiaryUserId);
  const updatedUser = db.getUserById(beneficiaryUserId);

  return res.json({
    message: `Challenge "${challenge.title}" successfully verified! Awarded ${challenge.points} points.`,
    pointsEarned: rewardResult.isDuplicate ? 0 : challenge.points,
    totalPoints: updatedUser?.points || 0,
    currentLevel: updatedUser?.level || 1,
    levelTitle: updatedUser?.levelTitle || 'Seedling',
    newlyUnlockedBadges,
    userChallenge,
    transaction: rewardResult.transaction,
    isDuplicate: rewardResult.isDuplicate,
  });
});

// POST /api/challenges/:id/complete (Direct self-completion with deduplicated ledger)
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

  const now = new Date().toISOString();
  if (!userChallenge) {
    const id = `uc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    userChallenge = {
      id,
      userId,
      challengeId,
      practiceId: challenge.practiceId,
      status: 'verified',
      startedAt: now,
      submittedAt: now,
      verifiedAt: now,
      completedAt: now,
      proofNote: proofNote || 'Completed via AgriX Action Step.',
      proofImageUrl,
      verifiedBy: 'Self-Verified Farmer',
    };
    db.userChallenges.set(id, userChallenge);
  } else {
    userChallenge.status = 'verified';
    userChallenge.verifiedAt = now;
    userChallenge.completedAt = now;
    if (proofNote) userChallenge.proofNote = proofNote;
    if (proofImageUrl) userChallenge.proofImageUrl = proofImageUrl;
    userChallenge.verifiedBy = 'Self-Verified Farmer';
  }

  const rewardResult = db.recordRewardTransaction(
    userId,
    challengeId,
    challenge.points,
    `Completed challenge: ${challenge.title}`,
    challenge.practiceId,
    'Self-Verified'
  );

  let updatedUser = req.user;
  if (!rewardResult.isDuplicate) {
    const updatedPoints = req.user.points + challenge.points;
    const levelData = calculateLevel(updatedPoints);

    const today = now.split('T')[0];
    let newStreak = req.user.streak;
    if (req.user.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      newStreak = req.user.lastActiveDate === yesterday ? req.user.streak + 1 : 1;
    }

    updatedUser = db.updateUser(userId, {
      points: updatedPoints,
      level: levelData.level,
      levelTitle: levelData.levelTitle,
      streak: newStreak,
      lastActiveDate: today,
    })!;

    db.logActivity(
      userId,
      'challenge_completed',
      `Completed challenge: ${challenge.title} (+${challenge.points} pts)`,
      challenge.points
    );
  }

  const newlyUnlockedBadges = db.checkAndAwardBadges(userId);

  return res.json({
    message: `Congratulations! You completed "${challenge.title}" and earned ${challenge.points} points!`,
    pointsEarned: rewardResult.isDuplicate ? 0 : challenge.points,
    totalPoints: updatedUser?.points || req.user.points,
    currentLevel: updatedUser?.level || req.user.level,
    levelTitle: updatedUser?.levelTitle || req.user.levelTitle,
    newlyUnlockedBadges,
    userChallenge,
    transaction: rewardResult.transaction,
    isDuplicate: rewardResult.isDuplicate,
  });
});

export default router;
