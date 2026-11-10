import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
  RewardTransaction,
  RecommendationLog,
  ExpertAssessment,
} from './types';
import {
  SEED_USERS,
  SEED_PRACTICES,
  SEED_CHALLENGES,
  SEED_BADGES,
  SEED_POSTS,
  SEED_COMMENTS,
  SEED_PRODUCTS,
  SEED_REWARD_TRANSACTIONS,
} from './seedData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/agrix_store.json');

export function calculateLevel(points: number): {
  level: number;
  levelTitle: string;
  nextLevelPoints: number;
  progressPercent: number;
} {
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

export class DataStore {
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
  rewardTransactions: Map<string, RewardTransaction> = new Map();
  recommendationLogs: RecommendationLog[] = [];
  expertAssessments: Map<string, ExpertAssessment> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    const loaded = this.loadFromFile();
    if (!loaded) {
      this.seed();
      this.persist();
    }
  }

  /**
   * Persists the in-memory state to JSON file using an atomic write pattern:
   * 1. Serialize entire state to JSON.
   * 2. Write to a unique temporary file on the same filesystem.
   * 3. Atomically rename the temporary file over the target DATA_FILE.
   * 
   * Architectural Note for Research / Production:
   * This file-backed persistence engine provides durability and atomic updates for a single Node.js process.
   * For horizontally scaled multi-container production environments, a centralized relational database
   * (e.g., PostgreSQL / Cloud SQL) with row-level ACID transactions should be used.
   */
  public persist(): void {
    try {
      const dataDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const serialized = {
        users: Array.from(this.users.entries()),
        practices: Array.from(this.practices.entries()),
        challenges: Array.from(this.challenges.entries()),
        userChallenges: Array.from(this.userChallenges.entries()),
        badges: Array.from(this.badges.entries()),
        userBadges: Array.from(this.userBadges.entries()),
        posts: Array.from(this.posts.entries()),
        comments: Array.from(this.comments.entries()),
        products: Array.from(this.products.entries()),
        cartItems: Array.from(this.cartItems.entries()),
        reports: Array.from(this.reports.entries()),
        activities: this.activities,
        rewardTransactions: Array.from(this.rewardTransactions.entries()),
        recommendationLogs: this.recommendationLogs,
        expertAssessments: Array.from(this.expertAssessments.entries()),
      };

      const jsonString = JSON.stringify(serialized, null, 2);
      const tempFile = `${DATA_FILE}.tmp.${process.pid}.${Date.now()}`;


      // Write to temporary file first
      fs.writeFileSync(tempFile, jsonString, 'utf-8');

      // Atomic rename over the destination
      fs.renameSync(tempFile, DATA_FILE);
    } catch (err: any) {
      console.warn('Atomic persistence warning (in-memory mode maintained):', err?.message || err);
    }
  }

  private loadFromFile(): boolean {
    try {
      if (!fs.existsSync(DATA_FILE)) return false;
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);

      if (!data.users || !data.practices) return false;

      this.users = new Map(data.users);
      this.practices = new Map(data.practices);
      this.challenges = new Map(data.challenges);
      this.userChallenges = new Map(data.userChallenges);
      this.badges = new Map(data.badges);
      this.userBadges = new Map(data.userBadges);
      this.posts = new Map(data.posts);
      this.comments = new Map(data.comments);
      this.products = new Map(data.products);
      this.cartItems = new Map(data.cartItems || []);
      this.reports = new Map(data.reports || []);
      this.activities = data.activities || [];
      this.rewardTransactions = new Map(data.rewardTransactions || []);
      this.recommendationLogs = data.recommendationLogs || [];
      this.expertAssessments = new Map(data.expertAssessments || []);

      // Ensure seed practices are current with newly added properties
      SEED_PRACTICES.forEach((sp) => {
        const existing = this.practices.get(sp.id);
        if (existing) {
          this.practices.set(sp.id, { ...existing, ...sp });
        } else {
          this.practices.set(sp.id, { ...sp });
        }
      });

      return true;
    } catch (err: any) {
      console.warn('Failed to load persisted data store, falling back to seed data:', err?.message || err);
      // Attempt safe backup of corrupted file for post-incident diagnostics
      try {
        if (fs.existsSync(DATA_FILE)) {
          const corruptedBackupPath = `${DATA_FILE}.corrupted.${Date.now()}`;
          fs.copyFileSync(DATA_FILE, corruptedBackupPath);
          console.warn(`Preserved corrupted store backup at ${corruptedBackupPath}`);
        }
      } catch (backupErr) {
        console.error('Failed to create backup of corrupted store:', backupErr);
      }
      return false;
    }
  }

  seed() {
    SEED_USERS.forEach((u) => this.users.set(u.id, { ...u }));
    SEED_PRACTICES.forEach((p) => this.practices.set(p.id, { ...p }));
    SEED_CHALLENGES.forEach((c) => this.challenges.set(c.id, { ...c }));
    SEED_BADGES.forEach((b) => this.badges.set(b.id, { ...b }));
    SEED_POSTS.forEach((p) => this.posts.set(p.id, { ...p }));
    SEED_COMMENTS.forEach((c) => this.comments.set(c.id, { ...c }));
    SEED_PRODUCTS.forEach((pr) => this.products.set(pr.id, { ...pr }));
    SEED_REWARD_TRANSACTIONS.forEach((tx) => this.rewardTransactions.set(tx.id, { ...tx }));

    // Seed initial user challenges
    // Ramesh Patel
    this.userChallenges.set('uc_1', {
      id: 'uc_1',
      userId: 'user_ramesh',
      challengeId: 'chal_1', // Mulching
      practiceId: 'prac_3',
      status: 'verified',
      startedAt: '2026-10-01T10:00:00Z',
      submittedAt: '2026-10-02T11:00:00Z',
      verifiedAt: '2026-10-02T12:00:00Z',
      completedAt: '2026-10-02T12:00:00Z',
      proofNote: 'Applied paddy straw across tomato rows.',
      verifiedBy: 'user_admin',
    });
    this.userChallenges.set('uc_2', {
      id: 'uc_2',
      userId: 'user_ramesh',
      challengeId: 'chal_4', // Sticky traps
      practiceId: 'prac_7',
      status: 'verified',
      startedAt: '2026-10-03T09:00:00Z',
      submittedAt: '2026-10-03T10:30:00Z',
      verifiedAt: '2026-10-03T11:00:00Z',
      completedAt: '2026-10-03T11:00:00Z',
      proofNote: 'Placed 10 yellow traps in greenhouse.',
      verifiedBy: 'user_admin',
    });
    this.userChallenges.set('uc_3', {
      id: 'uc_3',
      userId: 'user_ramesh',
      challengeId: 'chal_5', // Drip lateral flush
      practiceId: 'prac_2',
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
      practiceId: 'prac_1',
      status: 'verified',
      startedAt: '2026-09-20T08:00:00Z',
      submittedAt: '2026-09-27T09:00:00Z',
      verifiedAt: '2026-09-27T10:00:00Z',
      completedAt: '2026-09-27T10:00:00Z',
      proofNote: 'Installed perforated pipe in Samba plot.',
      verifiedBy: 'user_admin',
    });
    this.userChallenges.set('uc_5', {
      id: 'uc_5',
      userId: 'user_ananya',
      challengeId: 'chal_5', // Drip
      practiceId: 'prac_2',
      status: 'verified',
      startedAt: '2026-09-28T09:00:00Z',
      submittedAt: '2026-09-28T11:30:00Z',
      verifiedAt: '2026-09-28T12:00:00Z',
      completedAt: '2026-09-28T12:00:00Z',
      verifiedBy: 'user_admin',
    });
    this.userChallenges.set('uc_6', {
      id: 'uc_6',
      userId: 'user_ananya',
      challengeId: 'chal_7', // Percolation pit
      practiceId: 'prac_10',
      status: 'verified',
      startedAt: '2026-09-29T10:00:00Z',
      submittedAt: '2026-09-30T16:00:00Z',
      verifiedAt: '2026-09-30T17:00:00Z',
      completedAt: '2026-09-30T17:00:00Z',
      verifiedBy: 'user_admin',
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

  // --- User Methods ---
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
    this.persist();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };

    if (updates.points !== undefined) {
      const lvl = calculateLevel(updated.points);
      updated.level = lvl.level;
      updated.levelTitle = lvl.levelTitle;
    }

    this.users.set(id, updated);
    this.persist();
    return updated;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // --- Activity Methods ---
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
    this.persist();
    return act;
  }

  getUserActivities(userId: string): UserActivity[] {
    return this.activities.filter((a) => a.userId === userId);
  }

  getGlobalActivities(limit = 10): UserActivity[] {
    return this.activities.slice(0, limit);
  }

  // --- Reward Ledger & Transactions ---
  recordRewardTransaction(
    userId: string,
    challengeId: string,
    pointsAwarded: number,
    reason: string,
    practiceId?: string,
    verifiedBy?: string
  ): { transaction: RewardTransaction; isDuplicate: boolean } {
    // Check if an awarded transaction already exists for this user and challenge
    const existing = Array.from(this.rewardTransactions.values()).find(
      (tx) => tx.userId === userId && tx.challengeId === challengeId && tx.status === 'awarded'
    );

    if (existing) {
      return { transaction: existing, isDuplicate: true };
    }

    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tx: RewardTransaction = {
      id,
      userId,
      challengeId,
      practiceId,
      pointsAwarded,
      reason,
      status: 'awarded',
      timestamp: new Date().toISOString(),
      verifiedBy,
    };

    this.rewardTransactions.set(id, tx);
    this.persist();
    return { transaction: tx, isDuplicate: false };
  }

  getRewardTransactionsForUser(userId: string): RewardTransaction[] {
    return Array.from(this.rewardTransactions.values())
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getMonthlyPointsForUser(userId: string): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const transactions = Array.from(this.rewardTransactions.values()).filter(
      (tx) => tx.userId === userId && tx.status === 'awarded' && tx.timestamp >= startOfMonth
    );

    return transactions.reduce((acc, tx) => acc + tx.pointsAwarded, 0);
  }

  /**
   * Atomically executes challenge reward transaction and updates farmer points, level,
   * streak, activity log, and badge unlocks in a single coordinated operation.
   * Prevents partial updates or desynchronization between ledger and user points.
   */
  awardChallengePoints(
    userId: string,
    challengeId: string,
    points: number,
    reason: string,
    practiceId?: string,
    verifiedBy?: string
  ): {
    success: boolean;
    isDuplicate: boolean;
    pointsAwarded?: number;
    transaction?: RewardTransaction;
    updatedUser?: User;
    newlyUnlockedBadges?: Badge[];
    error?: string;
  } {
    // 1. Prevent duplicate rewards: check if awarded transaction already exists
    const existing = Array.from(this.rewardTransactions.values()).find(
      (tx) => tx.userId === userId && tx.challengeId === challengeId && tx.status === 'awarded'
    );
    if (existing) {
      return { success: false, isDuplicate: true, pointsAwarded: 0, transaction: existing };
    }

    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, isDuplicate: false, pointsAwarded: 0, error: 'Beneficiary user not found' };
    }

    const now = new Date().toISOString();
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tx: RewardTransaction = {
      id,
      userId,
      challengeId,
      practiceId,
      pointsAwarded: points,
      reason,
      status: 'awarded',
      timestamp: now,
      verifiedBy,
    };

    // 2. Add transaction to ledger
    this.rewardTransactions.set(id, tx);

    // 3. Atomically update user profile points & level
    const updatedPoints = user.points + points;
    const levelData = calculateLevel(updatedPoints);

    const today = now.split('T')[0];
    let newStreak = user.streak;
    if (user.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      newStreak = user.lastActiveDate === yesterday ? user.streak + 1 : 1;
    }

    user.points = updatedPoints;
    user.level = levelData.level;
    user.levelTitle = levelData.levelTitle;
    user.streak = newStreak;
    user.lastActiveDate = today;
    this.users.set(userId, user);

    // 4. Log activity
    const act: UserActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type: 'challenge_completed',
      title: reason,
      pointsEarned: points,
      timestamp: now,
    };
    this.activities.unshift(act);
    if (this.activities.length > 100) this.activities.pop();

    // 5. Check and award any earned badges
    const newlyUnlockedBadges = this.checkAndAwardBadges(userId);

    // 6. Atomically synchronize UserChallenge state if present
    if (challengeId) {
      const existingUc = this.getUserChallenge(userId, challengeId);
      if (existingUc) {
        existingUc.status = 'verified';
        existingUc.progress = 100;
        existingUc.verifiedBy = verifiedBy || 'system';
        existingUc.completedAt = now;
        this.saveUserChallenge(existingUc);
      }
    }

    // 7. Safe atomic persistence
    this.persist();

    return {
      success: true,
      isDuplicate: false,
      pointsAwarded: points,
      transaction: tx,
      updatedUser: user,
      newlyUnlockedBadges,
    };
  }

  // --- Expert Assessments for Research Evaluation ---
  saveExpertAssessment(assessment: ExpertAssessment): ExpertAssessment {
    this.expertAssessments.set(assessment.id, assessment);
    this.persist();
    return assessment;
  }

  getExpertAssessments(archetypeId?: string): ExpertAssessment[] {
    const all = Array.from(this.expertAssessments.values());
    if (archetypeId) {
      return all.filter((a) => a.archetypeId === archetypeId);
    }
    return all;
  }

  getAllExpertAssessments(): ExpertAssessment[] {
    return this.getExpertAssessments();
  }


  // --- Recommendation Logging ---
  logRecommendation(log: Omit<RecommendationLog, 'id' | 'timestamp'>): RecommendationLog {
    const completeLog: RecommendationLog = {
      ...log,
      id: `rec_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.recommendationLogs.unshift(completeLog);
    if (this.recommendationLogs.length > 500) this.recommendationLogs.pop();
    this.persist();
    return completeLog;
  }

  // --- Badges Check & Award ---
  checkAndAwardBadges(userId: string): Badge[] {
    const user = this.getUserById(userId);
    if (!user) return [];

    const existingUserBadges = Array.from(this.userBadges.values()).filter((ub) => ub.userId === userId);
    const awardedBadgeIds = new Set(existingUserBadges.map((ub) => ub.badgeId));
    const newlyAwarded: Badge[] = [];

    // Consider both 'verified' and 'completed' as valid completions
    const completedUserChallenges = Array.from(this.userChallenges.values()).filter(
      (uc) => uc.userId === userId && (uc.status === 'verified' || (uc.status as any) === 'completed')
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

    this.persist();
    return newlyAwarded;
  }

  // --- Entity Mutation Helpers Guaranteeing Atomic Persistence ---

  saveUserChallenge(uc: UserChallenge): UserChallenge {
    this.userChallenges.set(uc.id, uc);
    this.persist();
    return uc;
  }

  getUserChallenge(userId: string, challengeId: string): UserChallenge | undefined {
    return Array.from(this.userChallenges.values()).find(
      (uc) => uc.userId === userId && uc.challengeId === challengeId
    );
  }

  savePost(post: CommunityPost): CommunityPost {
    this.posts.set(post.id, post);
    this.persist();
    return post;
  }

  deletePost(id: string): boolean {
    const existed = this.posts.delete(id);
    if (existed) this.persist();
    return existed;
  }

  saveComment(comment: CommunityComment): CommunityComment {
    this.comments.set(comment.id, comment);
    this.persist();
    return comment;
  }

  saveReport(report: ReportItem): ReportItem {
    this.reports.set(report.id, report);
    this.persist();
    return report;
  }

  saveChallenge(challenge: Challenge): Challenge {
    this.challenges.set(challenge.id, challenge);
    this.persist();
    return challenge;
  }

  deleteChallenge(id: string): boolean {
    const existed = this.challenges.delete(id);
    if (existed) this.persist();
    return existed;
  }

  savePractice(practice: SustainablePractice): SustainablePractice {
    this.practices.set(practice.id, practice);
    this.persist();
    return practice;
  }

  deletePractice(id: string): boolean {
    const existed = this.practices.delete(id);
    if (existed) this.persist();
    return existed;
  }

  saveProduct(product: MarketplaceProduct): MarketplaceProduct {
    this.products.set(product.id, product);
    this.persist();
    return product;
  }

  deleteProduct(id: string): boolean {
    const existed = this.products.delete(id);
    if (existed) this.persist();
    return existed;
  }
}

export const db = new DataStore();

