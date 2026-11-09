import { Router, Response } from 'express';
import { db, calculateLevel } from '../db/store';
import { optionalAuthenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/gamification/profile
router.get('/profile', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const user = req.user || db.getUserById('user_ramesh')!;
  const levelInfo = calculateLevel(user.points);

  const allBadges = Array.from(db.badges.values());
  const userBadgeEntries = Array.from(db.userBadges.values()).filter((ub) => ub.userId === user.id);
  const userBadgeMap = new Map<string, string>();
  userBadgeEntries.forEach((ub) => userBadgeMap.set(ub.badgeId, ub.unlockedAt));

  const badgesWithStatus = allBadges.map((badge) => {
    const isUnlocked = userBadgeMap.has(badge.id);
    return {
      ...badge,
      unlocked: isUnlocked,
      unlockedAt: userBadgeMap.get(badge.id) || null,
    };
  });

  const userChallenges = Array.from(db.userChallenges.values()).filter((uc) => uc.userId === user.id);
  const completedChallenges = userChallenges.filter(
    (uc) => uc.status === 'verified' || (uc.status as any) === 'completed'
  );

  // Breakdown by category
  const categoryCounts: Record<string, number> = {};
  completedChallenges.forEach((uc) => {
    const c = db.challenges.get(uc.challengeId);
    if (c) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }
  });

  // User transactions
  const transactions = db.getRewardTransactionsForUser(user.id);
  const monthlyPoints = db.getMonthlyPointsForUser(user.id);

  // Recent activities
  const recentActivities = db.getUserActivities(user.id).slice(0, 8);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      location: user.location,
      state: user.state,
      mainCrop: user.mainCrop,
      soilType: user.soilType,
      farmingMethod: user.farmingMethod,
      points: user.points,
      monthlyPoints,
      level: user.level,
      levelTitle: user.levelTitle,
      streak: user.streak,
    },
    levelInfo,
    badges: badgesWithStatus,
    unlockedBadgesCount: userBadgeEntries.length,
    totalBadgesCount: allBadges.length,
    completedChallengesCount: completedChallenges.length,
    categoryCounts,
    recentActivities,
    transactionsCount: transactions.length,
    recentTransactions: transactions.slice(0, 5),
  });
});

// GET /api/gamification/transactions
router.get('/transactions', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || 'user_ramesh';
  const transactions = db.getRewardTransactionsForUser(userId);

  return res.json({
    userId,
    count: transactions.length,
    transactions,
  });
});

// GET /api/leaderboard or /api/gamification/leaderboard
router.get(['/leaderboard', '/'], optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const { period = 'global' } = req.query; // 'global' or 'monthly'

  const allUsers = db.getAllUsers().filter((u) => u.role === 'farmer');

  const userBadgeCounts = new Map<string, number>();
  Array.from(db.userBadges.values()).forEach((ub) => {
    userBadgeCounts.set(ub.userId, (userBadgeCounts.get(ub.userId) || 0) + 1);
  });

  const sorted = allUsers.map((u) => {
    // True calculation from transaction ledger for monthly rankings
    const points = period === 'monthly' ? db.getMonthlyPointsForUser(u.id) : u.points;
    const transactions = db.getRewardTransactionsForUser(u.id);

    return {
      id: u.id,
      name: u.name,
      location: `${u.location}, ${u.state}`,
      crop: u.mainCrop,
      points,
      level: u.level,
      levelTitle: u.levelTitle,
      streak: u.streak,
      badgesCount: userBadgeCounts.get(u.id) || 0,
      verifiedChallengesCount: transactions.length,
      avatarUrl: u.avatarUrl,
      isCurrentUser: req.user ? req.user.id === u.id : false,
    };
  });

  // Sort by points descending, then by streak
  sorted.sort((a, b) => b.points - a.points || b.streak - a.streak);

  const leaderboardWithRank = sorted.map((item, index) => ({
    rank: index + 1,
    ...item,
  }));

  const currentUserRank = req.user
    ? leaderboardWithRank.find((item) => item.id === req.user?.id)
    : null;

  return res.json({
    period,
    totalParticipants: leaderboardWithRank.length,
    leaderboard: leaderboardWithRank,
    currentUserRank,
  });
});

export default router;
