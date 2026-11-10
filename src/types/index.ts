export type UserRole = 'farmer' | 'admin' | 'inspector';

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
  role: UserRole;
  phone: string;
  location: string;
  state: string;
  farmSize: number;
  soilType: SoilType;
  mainCrop: string;
  farmingMethod: FarmingMethod;
  experienceLevel: ExperienceLevel;
  avatarUrl?: string;
  points: number;
  level: number;
  levelTitle: string;
  streak: number;
  lastActiveDate: string;
  createdAt: string;
}

export interface FactorWeights {
  crop: number; // 0.25
  soil: number; // 0.20
  season: number; // 0.15
  location: number; // 0.15
  farmingMethod: number; // 0.10
  experience: number; // 0.10
  farmSize: number; // 0.05
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
  suitableAgroClimates?: string[];
  suitableStates?: string[];
  suitableFarmingMethods: FarmingMethod[];
  difficulty: DifficultyLevel;
  description: string;
  sustainabilityBenefit: string;
  whyRecommended?: string;
  estimatedCompletion: string;
  points: number;
  steps: string[];
  requiredMaterials: string[];
  precautions: string[];
  expectedBenefits: string[];
  scientificContext?: string;
  sourceCitation?: string;
  relatedChallengeId: string;
  minFarmSize?: number;
  maxFarmSize?: number;
  safetyCritical?: boolean;
}

export interface ScoredPractice {
  practice: SustainablePractice;
  matchScore: number; // 0 to 100
  factorScores?: FactorScores;
  factorContributions?: Record<string, number>;
  matchReasons: string[];
  whyRecommended: string;
  challenge?: Challenge;
  userChallengeStatus?: ChallengeStatus;
  algorithm?: 'baseline' | 'weighted_multifactor';
}

export interface Challenge {
  id: string;
  practiceId: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: DifficultyLevel;
  duration: string;
  points: number;
  sustainabilityBenefit: string;
  instructions: string[];
  verificationHint: string;
  userStatus?: ChallengeStatus;
  startedAt?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  proofNote?: string;
  proofImageUrl?: string;
  verificationNotes?: string;
  createdAt: string;
}

export type ChallengeStatus = 'not_started' | 'in_progress' | 'submitted' | 'verified' | 'rejected' | 'completed';

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
  farmerProfileSnapshot: any;
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
  icon: string;
  description: string;
  criteria: string;
  category?: string;
  targetCount: number;
  pointsReward: number;
  unlocked?: boolean;
  unlockedAt?: string | null;
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
  likes: string[];
  likesCount: number;
  isLikedByMe: boolean;
  comments: CommunityComment[];
  totalComments: number;
  isReported: boolean;
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
  price: number;
  unit: string;
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
  itemTotal: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: string;
  title: string;
  pointsEarned: number;
  timestamp: string;
}

export interface LevelInfo {
  level: number;
  levelTitle: string;
  nextLevelPoints: number;
  progressPercent: number;
}

export interface AIExplainedPractice {
  practiceId: string;
  practiceTitle: string;
  overview: string;
  whyForFarmer: string;
  stepByStepGuidance: string[];
  requiredMaterials: string[];
  precautions: string[];
  expectedBenefits: string[];
  relatedChallengeId: string;
  sourceCitation: string;
  disclaimer: string;
  source: 'gemini' | 'rule_fallback';
  isAIGenerated?: boolean;
  verifiedAttributes?: {
    category: string;
    suitableCrops: string[];
    suitableSoilTypes: string[];
    verifiedSource: string;
  };
}

