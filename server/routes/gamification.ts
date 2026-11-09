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
  const completedChallenges = userChallenges.filter((uc) => uc.status === 'completed');

  // Breakdown by category
  const categoryCounts: Record<string, number> = {};
  completedChallenges.forEach((uc) => {
    const c = db.challenges.get(uc.challengeId);
    if (c) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }
  });

  // Recent activities
  const recentActivities = db.getUserActivities(user.id).slice(0, 8);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      location: user.location,
      mainCrop: user.mainCrop,
      soilType: user.soilType,
      farmingMethod: user.farmingMethod,
      points: user.points,
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
  });
});

// GET /api/leaderboard or /api/gamification/leaderboard
router.get(['/leaderboard', '/'], optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const { period = 'global' } = req.query; // 'global' or 'monthly'

  const allUsers = db.getAllUsers().filter((u) => u.role === 'farmer');

  // Compute badge counts for all users
  const userBadgeCounts = new Map<string, number>();
  Array.from(db.userBadges.values()).forEach((ub) => {
    userBadgeCounts.set(ub.userId, (userBadgeCounts.get(ub.userId) || 0) + 1);
  });

  const sorted = allUsers.map((u) => {
    // For demonstration, monthly points can be slightly partitioned or same
    const displayPoints = period === 'monthly' ? Math.round(u.points * 0.65) : u.points;
    return {
      id: u.id,
      name: u.name,
      location: `${u.location}, ${u.state}`,
      crop: u.mainCrop,
      points: displayPoints,
      level: u.level,
      levelTitle: u.levelTitle,
      streak: u.streak,
      badgesCount: userBadgeCounts.get(u.id) || 0,
      avatarUrl: u.avatarUrl,
      isCurrentUser: req.user ? req.user.id === u.id : false,
    };
  });

  sorted.sort((a, b) => b.points - a.points);

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
