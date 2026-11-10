export type UserRole = 'farmer' | 'admin' | 'inspector' | 'expert';

export type SoilType =
  | 'Sandy'
  | 'Clay'
  | 'Loamy'
  | 'Silty'
  | 'Black soil'
  | 'Red soil'
  | 'Other';

export type FarmingMethod =
  | 'Conventional'
  | 'Organic'
  | 'Mixed'
  | 'Natural farming';

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Experienced';

export type ChallengeCategory =
  | 'Water Conservation'
  | 'Soil Health'
  | 'Organic Farming'
  | 'Pest Management'
  | 'Biodiversity'
  | 'Waste Reduction'
  | 'Energy Efficiency';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Advanced';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone: string;
  location: string;
  state: string;
  farmSize: number; // in acres
  soilType: SoilType;
  mainCrop: string;
  farmingMethod: FarmingMethod;
  experienceLevel: ExperienceLevel;
  avatarUrl?: string;
  organization?: string; // Verified institutional affiliation (e.g., TNAU, ICAR, KVK)
  points: number;
  level: number;
  levelTitle: string;
  streak: number; // days
  lastActiveDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface FactorWeights {
  crop: number; // 0.25 (25%)
  soil: number; // 0.20 (20%)
  season: number; // 0.15 (15%)
  location: number; // 0.15 (15%)
  farmingMethod: number; // 0.10 (10%)
  experience: number; // 0.10 (10%)
  farmSize: number; // 0.05 (5%)
}

export interface FactorScores {
  cropScore: number; // 0 - 100
  soilScore: number; // 0 - 100
  seasonScore: number; // 0 - 100
  locationScore: number; // 0 - 100
  farmingMethodScore: number; // 0 - 100
  experienceScore: number; // 0 - 100
  farmSizeScore: number; // 0 - 100
}

export interface SustainablePractice {
  id: string;
  title: string;
  category: ChallengeCategory;
  suitableCrops: string[];
  suitableSoilTypes: SoilType[];
  suitableSeasons: string[];
  suitableAgroClimates?: string[]; // e.g. ['Tropical', 'Semi-Arid', 'Subtropical', 'Humid', 'All']
  suitableStates?: string[]; // e.g. ['Tamil Nadu', 'Punjab', 'Gujarat', 'Maharashtra', 'Karnataka', 'All']
  suitableFarmingMethods: FarmingMethod[];
  difficulty: DifficultyLevel;
  description: string;
  sustainabilityBenefit: string;
  whyRecommended?: string;
  estimatedCompletion: string; // e.g. "15 minutes", "1 day", "1 week"
  points: number;
  steps: string[];
  requiredMaterials: string[];
  precautions: string[];
  expectedBenefits: string[];
  scientificContext?: string;
  sourceCitation?: string; // e.g. 'ICAR Bulletin / TNAU Agritech Portal'
  relatedChallengeId: string; // Exact bidirectional link to Challenge
  minFarmSize?: number; // in acres
  maxFarmSize?: number;
  safetyCritical?: boolean;
}

export interface Challenge {
  id: string;
  practiceId: string; // Exact bidirectional link to SustainablePractice
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: DifficultyLevel;
  duration: string;
  points: number;
  sustainabilityBenefit: string;
  instructions: string[];
  verificationHint: string;
  badgeEligibleId?: string;
  createdAt: string;
}

export type ChallengeStatus = 'not_started' | 'in_progress' | 'submitted' | 'verified' | 'rejected' | 'completed';

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  practiceId?: string;
  status: ChallengeStatus;
  startedAt?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  progress?: number;
  proofNote?: string;
  evidenceNote?: string;
  proofImageUrl?: string;
  verificationNotes?: string;
  feedback?: string;
  verifiedBy?: string;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  challengeId: string;
  practiceId?: string;
  pointsAwarded: number;
  reason: string;
  status: 'awarded' | 'revoked';
  timestamp: string;
  verifiedBy?: string;
}

export interface RecommendationLog {
  id: string;
  userId: string;
  algorithm: 'baseline' | 'weighted_multifactor';
  farmerProfileSnapshot: {
    crop: string;
    soil: string;
    season?: string;
    location: string;
    state?: string;
    farmingMethod: string;
    experienceLevel: string;
    farmSize: number;
  };
  recommendations: Array<{
    practiceId: string;
    title: string;
    compatibilityScore: number;
    factorScores: FactorScores;
    rank: number;
  }>;
  executionTimeMs: number;
  timestamp: string;
  userFeedback?: 'helpful' | 'unhelpful';
}

export interface Badge {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  description: string;
  criteria: string;
  category?: ChallengeCategory | 'General';
  targetCount: number;
  pointsReward: number;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userLocation: string;
  userCrop: string;
  userAvatar?: string;
  content: string;
  imageUrl?: string;
  category: string;
  likes: string[]; // array of userIds
  commentCount: number;
  isReported: boolean;
  reportedReason?: string;
  reportedBy?: string[];
  createdAt: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  category:
    | 'Seeds'
    | 'Organic fertilizers'
    | 'Compost'
    | 'Irrigation equipment'
    | 'Farming tools'
    | 'Sustainable products';
  description: string;
  price: number; // in INR or unit currency
  unit: string; // e.g., '5 kg bag', 'per kit', '100m roll'
  seller: string;
  imageUrl: string;
  sustainabilityBenefit: string;
  ecoScore: 'A+' | 'A' | 'B+';
  inStock: boolean;
  rating: number;
  reviewsCount: number;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  product: MarketplaceProduct;
  quantity: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  type:
    | 'challenge_started'
    | 'challenge_submitted'
    | 'challenge_verified'
    | 'challenge_completed'
    | 'badge_earned'
    | 'post_created'
    | 'streak_maintained';
  title: string;
  pointsEarned: number;
  timestamp: string;
}

export interface ReportItem {
  id: string;
  targetType: 'post' | 'comment';
  targetId: string;
  reportedByUserId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedAt?: string;
  createdAt: string;
}

export interface ExpertAssessment {
  id: string;
  expertUserId?: string;
  expertName?: string;
  evaluatorRole?: string;
  organization?: string;
  archetypeId: string;
  practiceId?: string;
  practiceTitle?: string;
  relevanceScore?: number;
  ecologicalValidity?: number;
  actionabilityScore?: number;
  expertNotes?: string;
  practiceRatings?: Record<string, number>; // practiceId -> grade 0-3
  notes?: string;
  timestamp?: string;
  createdAt?: string;
}

