export type UserRole = 'farmer' | 'admin';

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

export interface SustainablePractice {
  id: string;
  title: string;
  category: ChallengeCategory;
  suitableCrops: string[];
  suitableSoilTypes: SoilType[];
  suitableSeasons: string[];
  suitableFarmingMethods: FarmingMethod[];
  difficulty: DifficultyLevel;
  description: string;
  sustainabilityBenefit: string;
  whyRecommended?: string;
  estimatedCompletion: string;
  points: number;
  steps: string[];
  scientificContext?: string;
}

export interface ScoredPractice {
  practice: SustainablePractice;
  matchScore: number;
  matchReasons: string[];
  whyRecommended: string;
  challenge?: Challenge;
  userChallengeStatus?: 'not_started' | 'in_progress' | 'completed';
}

export interface Challenge {
  id: string;
  practiceId?: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: DifficultyLevel;
  duration: string;
  points: number;
  sustainabilityBenefit: string;
  instructions: string[];
  verificationHint: string;
  userStatus?: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  proofNote?: string;
  createdAt: string;
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
