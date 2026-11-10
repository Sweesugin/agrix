import { Router, Response } from 'express';
import { db, calculateLevel } from '../db/store';
import { authenticate, optionalAuthenticate, requireVerifier, AuthRequest } from '../middleware/auth';
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

// GET /api/challenges/pending-verification (Admin or authorized inspector endpoint only)
router.get('/pending-verification', authenticate, requireVerifier, (req: AuthRequest, res: Response) => {
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
  if (!req.user) return res.status(401).json({ error: 'Unauthorized: Authentication required.' });

  const challengeId = req.params.id;
  const challenge = db.challenges.get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found.' });
  }

  const userId = req.user.id;
  let userChallenge = db.getUserChallenge(userId, challengeId);

  if (userChallenge) {
    if (userChallenge.status === 'verified' || (userChallenge.status as any) === 'completed') {
      return res.status(400).json({ error: 'Invalid state: Challenge has already been verified and completed.' });
    }
    if (userChallenge.status === 'submitted') {
      return res.status(400).json({ error: 'Invalid state: Challenge proof has already been submitted and is pending inspection.' });
    }
    // Re-confirm in_progress
    userChallenge.status = 'in_progress';
    userChallenge.startedAt = userChallenge.startedAt || new Date().toISOString();
    db.saveUserChallenge(userChallenge);
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
    db.saveUserChallenge(userChallenge);
  }

  db.logActivity(userId, 'challenge_started', `Started challenge: ${challenge.title}`, 0);

  return res.json({
    message: `Challenge "${challenge.title}" started! Complete the steps and submit proof to earn ${challenge.points} points.`,
    userChallenge,
  });
});

// POST /api/challenges/:id/submit (Submit implementation proof for inspector verification)
router.post('/:id/submit', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized: Authentication required.' });

  const challengeId = req.params.id;
  const { proofNote, proofImageUrl } = req.body;
  const challenge = db.challenges.get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found.' });
  }

  // Require meaningful proof evidence according to challenge requirements
  if (!proofNote || typeof proofNote !== 'string' || proofNote.trim().length < 10) {
    return res.status(400).json({
      error: 'Evidence requirement not met: Detailed implementation proof note (at least 10 characters) is required for inspection.',
    });
  }

  const userId = req.user.id;
  const userChallenge = db.getUserChallenge(userId, challengeId);

  // STRICT LIFECYCLE RULE: Farmer must start a challenge (in_progress) before submitting proof
  if (!userChallenge || userChallenge.status === 'not_started') {
    return res.status(400).json({
      error: 'Invalid state transition: Challenge must be started (status: in_progress) before submitting implementation proof.',
    });
  }

  // Validate state transitions
  if (userChallenge.status === 'verified' || (userChallenge.status as any) === 'completed') {
    return res.status(400).json({ error: 'Invalid transition: Challenge has already been verified and completed.' });
  }
  if (userChallenge.status === 'submitted') {
    return res.status(400).json({ error: 'Invalid transition: Proof has already been submitted and is awaiting verification.' });
  }

  // Only 'in_progress' and 'rejected' (resubmission) can transition to 'submitted'
  const now = new Date().toISOString();
  userChallenge.status = 'submitted';
  userChallenge.submittedAt = now;
  userChallenge.proofNote = proofNote.trim();
  if (proofImageUrl?.trim()) {
    userChallenge.proofImageUrl = proofImageUrl.trim();
  }
  // Clear prior rejection feedback on resubmission
  userChallenge.verificationNotes = undefined;

  db.saveUserChallenge(userChallenge);
  db.logActivity(userId, 'challenge_started', `Submitted proof for review: ${challenge.title}`, 0);

  return res.json({
    message: `Implementation proof for "${challenge.title}" submitted successfully for inspector review! Points will be awarded upon verification.`,
    userChallenge,
  });
});

// POST /api/challenges/:id/verify (Authorized administrator / agricultural inspector verification)
router.post('/:id/verify', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized: Authentication required.' });

  // STRICT SECURITY CHECK 1: Only administrators or certified inspectors can verify challenges
  if (req.user.role !== 'admin' && req.user.role !== 'inspector') {
    return res.status(403).json({
      error: 'Forbidden: Challenge verification requires administrator or certified agricultural inspector privileges.',
    });
  }

  const challengeId = req.params.id;
  const { targetUserId, verificationNotes } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Validation error: targetUserId is required for verification.' });
  }

  // STRICT SECURITY CHECK 2: Verifiers cannot verify their own submissions
  if (req.user.id === targetUserId) {
    return res.status(403).json({
      error: 'Forbidden: Self-verification is strictly prohibited. Verifiers cannot inspect or approve their own submissions.',
    });
  }

  const beneficiaryUser = db.getUserById(targetUserId);
  if (!beneficiaryUser) {
    return res.status(404).json({ error: 'Beneficiary farmer not found.' });
  }

  const challenge = db.challenges.get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found.' });
  }

  // STRICT SECURITY CHECK 3: Require a valid existing challenge submission in 'submitted' state
  const userChallenge = db.getUserChallenge(targetUserId, challengeId);
  if (!userChallenge) {
    return res.status(400).json({
      error: 'Invalid state: No challenge record exists for this user. Farmer must start and submit the challenge first.',
    });
  }

  if (userChallenge.status !== 'submitted') {
    if (userChallenge.status === 'verified' || (userChallenge.status as any) === 'completed') {
      return res.status(400).json({ error: 'Invalid transition: Challenge has already been verified.' });
    }
    return res.status(400).json({
      error: `Invalid transition: Challenge must be in 'submitted' state before verification (current status: '${userChallenge.status}').`,
    });
  }

  // STRICT SECURITY CHECK 4: Require appropriate completion evidence
  if (!userChallenge.proofNote || userChallenge.proofNote.trim().length < 10) {
    return res.status(400).json({
      error: 'Verification rejected: Challenge submission lacks sufficient proof documentation (minimum 10 characters required).',
    });
  }

  // STRICT SECURITY CHECK 5: Atomic reward recording and farmer-point updates preventing partial updates or duplicates
  const rewardResult = db.awardChallengePoints(
    targetUserId,
    challengeId,
    challenge.points,
    `Verified completion: ${challenge.title}`,
    challenge.practiceId,
    req.user.name
  );

  if (rewardResult.isDuplicate) {
    return res.status(400).json({
      error: 'Duplicate reward detected: Reward points have already been granted for this challenge.',
      transaction: rewardResult.transaction,
    });
  }

  if (!rewardResult.success) {
    return res.status(500).json({ error: rewardResult.error || 'Failed to award challenge points.' });
  }

  const now = new Date().toISOString();
  userChallenge.status = 'verified';
  userChallenge.verifiedAt = now;
  userChallenge.completedAt = now;
  userChallenge.verificationNotes = verificationNotes?.trim() || 'Verified against sustainable protocol standards.';
  userChallenge.verifiedBy = req.user.name;

  db.saveUserChallenge(userChallenge);

  return res.json({
    message: `Challenge "${challenge.title}" successfully verified! Awarded ${challenge.points} points to ${beneficiaryUser.name}.`,
    pointsEarned: challenge.points,
    totalPoints: rewardResult.updatedUser?.points || 0,
    currentLevel: rewardResult.updatedUser?.level || 1,
    levelTitle: rewardResult.updatedUser?.levelTitle || 'Seedling',
    newlyUnlockedBadges: rewardResult.newlyUnlockedBadges || [],
    userChallenge,
    transaction: rewardResult.transaction,
    isDuplicate: false,
  });
});

// POST /api/challenges/:id/reject (Admin / inspector rejection of submission with corrective feedback)
router.post('/:id/reject', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized: Authentication required.' });

  if (req.user.role !== 'admin' && req.user.role !== 'inspector') {
    return res.status(403).json({
      error: 'Forbidden: Challenge rejection requires administrator or inspector privileges.',
    });
  }

  const challengeId = req.params.id;
  const { targetUserId, notes } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Validation error: targetUserId is required.' });
  }

  if (req.user.id === targetUserId) {
    return res.status(403).json({ error: 'Forbidden: Verifiers cannot reject their own submissions.' });
  }

  const userChallenge = db.getUserChallenge(targetUserId, challengeId);
  if (!userChallenge || userChallenge.status !== 'submitted') {
    return res.status(400).json({ error: 'Invalid state: No pending submission to reject.' });
  }

  const challenge = db.challenges.get(challengeId);
  const rejectionFeedback = notes || 'Proof does not meet protocol criteria. Please inspect guidelines and resubmit.';

  // Transition to 'rejected' so farmer can correct evidence and resubmit
  userChallenge.status = 'rejected';
  userChallenge.verificationNotes = `Revision Requested: ${rejectionFeedback}`;
  db.saveUserChallenge(userChallenge);

  db.logActivity(
    targetUserId,
    'challenge_started',
    `Revision requested for challenge: ${challenge?.title || challengeId}`,
    0
  );

  return res.json({
    message: 'Submission rejected and returned to farmer with feedback for correction and resubmission.',
    userChallenge,
  });
});


// POST /api/challenges/:id/complete (Self-completion endpoint - DISABLED in production)
router.post('/:id/complete', authenticate, (req: AuthRequest, res: Response) => {
  // STRICT SECURITY CHECK: Disable self-verification reward paths in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden: Self-verification reward paths are strictly disabled in production. Submissions must be inspected by an authorized administrator.',
    });
  }

  // In non-production, normal farmers must also NOT be allowed to verify their own submissions
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: Farmers cannot self-verify challenges. Please submit your proof for inspector verification via POST /api/challenges/:id/submit.',
    });
  }

  const challengeId = req.params.id;
  const challenge = db.challenges.get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found.' });
  }

  const userId = req.user.id;
  const now = new Date().toISOString();

  let userChallenge = db.getUserChallenge(userId, challengeId);
  if (userChallenge && (userChallenge.status === 'verified' || (userChallenge.status as any) === 'completed')) {
    return res.status(400).json({ error: 'Challenge has already been completed.' });
  }

  const rewardResult = db.recordRewardTransaction(
    userId,
    challengeId,
    challenge.points,
    `Admin test completion: ${challenge.title}`,
    challenge.practiceId,
    'Admin-Test'
  );

  if (rewardResult.isDuplicate) {
    return res.status(400).json({ error: 'Duplicate reward detected.', isDuplicate: true });
  }

  if (!userChallenge) {
    userChallenge = {
      id: `uc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      challengeId,
      practiceId: challenge.practiceId,
      status: 'verified',
      startedAt: now,
      submittedAt: now,
      verifiedAt: now,
      completedAt: now,
      proofNote: 'Admin test completion in development mode.',
      verifiedBy: req.user.name,
    };
  } else {
    userChallenge.status = 'verified';
    userChallenge.verifiedAt = now;
    userChallenge.completedAt = now;
    userChallenge.verifiedBy = req.user.name;
  }

  db.saveUserChallenge(userChallenge);

  const updatedPoints = req.user.points + challenge.points;
  const levelData = calculateLevel(updatedPoints);

  const updatedUser = db.updateUser(userId, {
    points: updatedPoints,
    level: levelData.level,
    levelTitle: levelData.levelTitle,
  });

  return res.json({
    message: `Admin completed challenge "${challenge.title}".`,
    pointsEarned: challenge.points,
    totalPoints: updatedUser?.points,
    userChallenge,
    transaction: rewardResult.transaction,
  });
});

export default router;

