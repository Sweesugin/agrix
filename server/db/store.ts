import {
  User,
  SustainablePractice,
  Challenge,
  UserChallenge,
  Badge,
  UserBadge,
  CommunityPost,
  CommunityComment,
  MarketplaceProduct,
  CartItem,
  UserActivity,
  ReportItem,
} from './types';
import {
  SEED_USERS,
  SEED_PRACTICES,
  SEED_CHALLENGES,
  SEED_BADGES,
  SEED_POSTS,
  SEED_COMMENTS,
  SEED_PRODUCTS,
} from './seedData';

export function calculateLevel(points: number): { level: number; levelTitle: string; nextLevelPoints: number; progressPercent: number } {
  if (points < 200) {
    return {
      level: 1,
      levelTitle: 'Seedling',
      nextLevelPoints: 200,
      progressPercent: Math.min(100, Math.round((points / 200) * 100)),
    };
  }
  if (points < 500) {
    return {
      level: 2,
      levelTitle: 'Grower',
      nextLevelPoints: 500,
      progressPercent: Math.min(100, Math.round(((points - 200) / 300) * 100)),
    };
  }
  if (points < 900) {
    return {
      level: 3,
      levelTitle: 'Cultivator',
      nextLevelPoints: 900,
      progressPercent: Math.min(100, Math.round(((points - 500) / 400) * 100)),
    };
  }
  if (points < 1400) {
    return {
      level: 4,
      levelTitle: 'Sustainable Farmer',
      nextLevelPoints: 1400,
      progressPercent: Math.min(100, Math.round(((points - 900) / 500) * 100)),
    };
  }
  return {
    level: 5,
    levelTitle: 'Green Champion',
    nextLevelPoints: 2000,
    progressPercent: 100,
  };
}

class DataStore {
  users: Map<string, User> = new Map();
  practices: Map<string, SustainablePractice> = new Map();
  challenges: Map<string, Challenge> = new Map();
  userChallenges: Map<string, UserChallenge> = new Map();
  badges: Map<string, Badge> = new Map();
  userBadges: Map<string, UserBadge> = new Map();
  posts: Map<string, CommunityPost> = new Map();
  comments: Map<string, CommunityComment> = new Map();
  products: Map<string, MarketplaceProduct> = new Map();
  cartItems: Map<string, CartItem> = new Map();
  activities: UserActivity[] = [];
  reports: Map<string, ReportItem> = new Map();

  constructor() {
    this.seed();
  }

  seed() {
    SEED_USERS.forEach((u) => this.users.set(u.id, { ...u }));
    SEED_PRACTICES.forEach((p) => this.practices.set(p.id, { ...p }));
    SEED_CHALLENGES.forEach((c) => this.challenges.set(c.id, { ...c }));
    SEED_BADGES.forEach((b) => this.badges.set(b.id, { ...b }));
    SEED_POSTS.forEach((p) => this.posts.set(p.id, { ...p }));
    SEED_COMMENTS.forEach((c) => this.comments.set(c.id, { ...c }));
    SEED_PRODUCTS.forEach((pr) => this.products.set(pr.id, { ...pr }));

    // Seed some initial user challenges & user badges for realistic profiles
    // Ramesh Patel
    this.userChallenges.set('uc_1', {
      id: 'uc_1',
      userId: 'user_ramesh',
      challengeId: 'chal_1', // Mulching
      status: 'completed',
      startedAt: '2026-10-01T10:00:00Z',
      completedAt: '2026-10-02T12:00:00Z',
      proofNote: 'Applied paddy straw across tomato rows.',
    });
    this.userChallenges.set('uc_2', {
      id: 'uc_2',
      userId: 'user_ramesh',
      challengeId: 'chal_4', // Sticky traps
      status: 'completed',
      startedAt: '2026-10-03T09:00:00Z',
      completedAt: '2026-10-03T11:00:00Z',
      proofNote: 'Placed 10 yellow traps in greenhouse.',
    });
    this.userChallenges.set('uc_3', {
      id: 'uc_3',
      userId: 'user_ramesh',
      challengeId: 'chal_5', // Drip lateral flush
      status: 'in_progress',
      startedAt: '2026-10-06T08:00:00Z',
    });

    this.userBadges.set('ub_1', {
      id: 'ub_1',
      userId: 'user_ramesh',
      badgeId: 'badge_first_step',
      unlockedAt: '2026-10-02T12:00:00Z',
    });
    this.userBadges.set('ub_2', {
      id: 'ub_2',
      userId: 'user_ramesh',
      badgeId: 'badge_community_voice',
      unlockedAt: '2026-10-06T14:30:00Z',
    });

    // Ananya Sharma
    this.userChallenges.set('uc_4', {
      id: 'uc_4',
      userId: 'user_ananya',
      challengeId: 'chal_3', // AWD
      status: 'completed',
      startedAt: '2026-09-20T08:00:00Z',
      completedAt: '2026-09-27T10:00:00Z',
      proofNote: 'Installed perforated pipe in Samba plot.',
    });
    this.userChallenges.set('uc_5', {
      id: 'uc_5',
      userId: 'user_ananya',
      challengeId: 'chal_5', // Drip
      status: 'completed',
      startedAt: '2026-09-28T09:00:00Z',
      completedAt: '2026-09-28T12:00:00Z',
    });
    this.userChallenges.set('uc_6', {
      id: 'uc_6',
      userId: 'user_ananya',
      challengeId: 'chal_7', // Percolation pit
      status: 'completed',
      startedAt: '2026-09-29T10:00:00Z',
      completedAt: '2026-09-30T17:00:00Z',
    });

    this.userBadges.set('ub_3', {
      id: 'ub_3',
      userId: 'user_ananya',
      badgeId: 'badge_first_step',
      unlockedAt: '2026-09-27T10:00:00Z',
    });
    this.userBadges.set('ub_4', {
      id: 'ub_4',
      userId: 'user_ananya',
      badgeId: 'badge_water_saver',
      unlockedAt: '2026-09-30T17:00:00Z',
    });
    this.userBadges.set('ub_5', {
      id: 'ub_5',
      userId: 'user_ananya',
      badgeId: 'badge_green_champion',
      unlockedAt: '2026-10-05T10:15:00Z',
    });
    this.userBadges.set('ub_6', {
      id: 'ub_6',
      userId: 'user_ananya',
      badgeId: 'badge_streak_cultivator',
      unlockedAt: '2026-10-06T09:00:00Z',
    });

    // Seed activities
    this.activities = [
      {
        id: 'act_1',
        userId: 'user_ananya',
        type: 'badge_earned',
        title: 'Earned the 🏆 Green Champion badge!',
        pointsEarned: 200,
        timestamp: '2026-10-05T10:15:00Z',
      },
      {
        id: 'act_2',
        userId: 'user_ramesh',
        type: 'post_created',
        title: 'Shared tomato mulching experience with photo',
        pointsEarned: 10,
        timestamp: '2026-10-06T14:30:00Z',
      },
      {
        id: 'act_3',
        userId: 'user_ramesh',
        type: 'challenge_started',
        title: 'Started challenge: Drip Lateral Flush & Leak Inspection',
        pointsEarned: 0,
        timestamp: '2026-10-06T08:00:00Z',
      },
      {
        id: 'act_4',
        userId: 'user_lakshmi',
        type: 'challenge_completed',
        title: 'Completed challenge: Establish a Vermicomposting Pit',
        pointsEarned: 90,
        timestamp: '2026-10-03T11:20:00Z',
      },
    ];
  }

  // User methods
  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };

    // Update level if points changed
    if (updates.points !== undefined) {
      const lvl = calculateLevel(updated.points);
      updated.level = lvl.level;
      updated.levelTitle = lvl.levelTitle;
    }

    this.users.set(id, updated);
    return updated;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Activity methods
  logActivity(userId: string, type: UserActivity['type'], title: string, pointsEarned: number = 0) {
    const act: UserActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type,
      title,
      pointsEarned,
      timestamp: new Date().toISOString(),
    };
    this.activities.unshift(act);
    if (this.activities.length > 100) this.activities.pop();
    return act;
  }

  getUserActivities(userId: string): UserActivity[] {
    return this.activities.filter((a) => a.userId === userId);
  }

  getGlobalActivities(limit = 10): UserActivity[] {
    return this.activities.slice(0, limit);
  }

  // Check and award badges for user
  checkAndAwardBadges(userId: string): Badge[] {
    const user = this.getUserById(userId);
    if (!user) return [];

    const existingUserBadges = Array.from(this.userBadges.values()).filter((ub) => ub.userId === userId);
    const awardedBadgeIds = new Set(existingUserBadges.map((ub) => ub.badgeId));
    const newlyAwarded: Badge[] = [];

    const completedUserChallenges = Array.from(this.userChallenges.values()).filter(
      (uc) => uc.userId === userId && uc.status === 'completed'
    );
    const completedChallengeIds = new Set(completedUserChallenges.map((uc) => uc.challengeId));
    const completedChallenges = Array.from(this.challenges.values()).filter((c) => completedChallengeIds.has(c.id));

    // Badge 1: 🌱 First Step
    if (!awardedBadgeIds.has('badge_first_step') && completedUserChallenges.length >= 1) {
      const b = this.badges.get('badge_first_step');
      if (b) newlyAwarded.push(b);
    }

    // Badge 2: 💧 Water Saver (3 water conservation challenges)
    const waterCount = completedChallenges.filter((c) => c.category === 'Water Conservation').length;
    if (!awardedBadgeIds.has('badge_water_saver') && waterCount >= 3) {
      const b = this.badges.get('badge_water_saver');
      if (b) newlyAwarded.push(b);
    }

    // Badge 3: 🌿 Soil Guardian (3 soil health challenges)
    const soilCount = completedChallenges.filter((c) => c.category === 'Soil Health').length;
    if (!awardedBadgeIds.has('badge_soil_guardian') && soilCount >= 3) {
      const b = this.badges.get('badge_soil_guardian');
      if (b) newlyAwarded.push(b);
    }

    // Badge 4: 🐝 Eco Protector (3 biodiversity or pest management)
    const ecoCount = completedChallenges.filter(
      (c) => c.category === 'Biodiversity' || c.category === 'Pest Management'
    ).length;
    if (!awardedBadgeIds.has('badge_eco_protector') && ecoCount >= 3) {
      const b = this.badges.get('badge_eco_protector');
      if (b) newlyAwarded.push(b);
    }

    // Badge 5: 🏆 Green Champion (1000 points)
    if (!awardedBadgeIds.has('badge_green_champion') && user.points >= 1000) {
      const b = this.badges.get('badge_green_champion');
      if (b) newlyAwarded.push(b);
    }

    // Badge 6: ☀️ Consistent Cultivator (5-day streak)
    if (!awardedBadgeIds.has('badge_streak_cultivator') && user.streak >= 5) {
      const b = this.badges.get('badge_streak_cultivator');
      if (b) newlyAwarded.push(b);
    }

    // Badge 7: 💬 Community Voice (1 community post)
    const userPosts = Array.from(this.posts.values()).filter((p) => p.userId === userId);
    if (!awardedBadgeIds.has('badge_community_voice') && userPosts.length >= 1) {
      const b = this.badges.get('badge_community_voice');
      if (b) newlyAwarded.push(b);
    }

    // Badge 8: 🌾 Harvest Innovator (challenges in at least 4 distinct categories)
    const uniqueCategories = new Set(completedChallenges.map((c) => c.category));
    if (!awardedBadgeIds.has('badge_harvest_innovator') && uniqueCategories.size >= 4) {
      const b = this.badges.get('badge_harvest_innovator');
      if (b) newlyAwarded.push(b);
    }

    // Award all newly unlocked badges
    newlyAwarded.forEach((badge) => {
      const ubId = `ub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      this.userBadges.set(ubId, {
        id: ubId,
        userId,
        badgeId: badge.id,
        unlockedAt: new Date().toISOString(),
      });

      // Bonus points for badge
      const newPoints = user.points + badge.pointsReward;
      this.updateUser(userId, { points: newPoints });

      this.logActivity(
        userId,
        'badge_earned',
        `Unlocked badge: ${badge.name}! (+${badge.pointsReward} pts)`,
        badge.pointsReward
      );
    });

    return newlyAwarded;
  }
}

export const db = new DataStore();
