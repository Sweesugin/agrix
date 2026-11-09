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
  points: number;
  level: number;
  levelTitle: string;
  streak: number; // days
  lastActiveDate: string; // YYYY-MM-DD
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
  estimatedCompletion: string; // e.g. "15 minutes", "1 day", "1 week"
  points: number;
  steps: string[];
  scientificContext?: string;
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
  badgeEligibleId?: string;
  createdAt: string;
}

export type ChallengeStatus = 'not_started' | 'in_progress' | 'completed';

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  status: ChallengeStatus;
  startedAt?: string;
  completedAt?: string;
  proofNote?: string;
  proofImageUrl?: string;
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
  type: 'challenge_started' | 'challenge_completed' | 'badge_earned' | 'post_created' | 'streak_maintained';
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
  createdAt: string;
}
