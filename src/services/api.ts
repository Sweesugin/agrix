import {
  User,
  Challenge,
  Badge,
  CommunityPost,
  CommunityComment,
  MarketplaceProduct,
  CartItem,
  ScoredPractice,
  LevelInfo,
  UserActivity,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('agrix_token');
  const demoUserId = localStorage.getItem('agrix_demo_user_id');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (demoUserId) {
    headers['x-demo-user-id'] = demoUserId;
  }

  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async register(profileData: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async getMe(): Promise<{ user: User; levelInfo: LevelInfo; badges: Badge[] }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch current user');
    return data;
  },

  async switchDemoUser(userId: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to switch user');
    return data;
  },

  // Profile
  async getProfile(): Promise<{
    user: User;
    levelInfo: LevelInfo;
    badges: Badge[];
    challenges: any[];
    stats: any;
  }> {
    const res = await fetch(`${API_BASE}/users/profile`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
  },

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  // Recommendations
  async getRecommendations(algorithm: 'weighted_multifactor' | 'baseline' = 'weighted_multifactor'): Promise<{
    algorithm?: string;
    factorWeights?: any;
    farmerContext: any;
    recommendations: ScoredPractice[];
  }> {
    const res = await fetch(`${API_BASE}/recommendations?algorithm=${algorithm}`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch recommendations');
    return data;
  },

  async generateRecommendations(params: any): Promise<{
    farmerContext: any;
    recommendations: ScoredPractice[];
  }> {
    const res = await fetch(`${API_BASE}/recommendations/generate`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate recommendations');
    return data;
  },

  // Challenges
  async getChallenges(params: { category?: string; difficulty?: string; status?: string } = {}): Promise<{
    total: number;
    challenges: Challenge[];
  }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/challenges?${query}`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch challenges');
    return data;
  },

  async startChallenge(challengeId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/challenges/${challengeId}/start`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start challenge');
    return data;
  },

  async submitChallenge(challengeId: string, proofNote: string, proofImageUrl?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/challenges/${challengeId}/submit`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ proofNote, proofImageUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit challenge proof');
    return data;
  },

  async verifyChallenge(challengeId: string, targetUserId?: string, verificationNotes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/challenges/${challengeId}/verify`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ targetUserId, verificationNotes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify challenge');
    return data;
  },

  async getPendingSubmissions(): Promise<{ count: number; pendingSubmissions: any[] }> {
    const res = await fetch(`${API_BASE}/challenges/pending-verification`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch pending submissions');
    return data;
  },

  async completeChallenge(challengeId: string, proofNote?: string, proofImageUrl?: string): Promise<{
    message: string;
    pointsEarned: number;
    totalPoints: number;
    currentLevel: number;
    levelTitle: string;
    newlyUnlockedBadges: Badge[];
    userChallenge: any;
  }> {
    const res = await fetch(`${API_BASE}/challenges/${challengeId}/complete`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ proofNote, proofImageUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to complete challenge');
    return data;
  },

  // Gamification & Leaderboard
  async getTransactions(): Promise<{ userId: string; count: number; transactions: any[] }> {
    const res = await fetch(`${API_BASE}/gamification/transactions`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch reward transactions');
    return data;
  },

  async getGamificationProfile(): Promise<{
    user: any;
    levelInfo: LevelInfo;
    badges: Badge[];
    unlockedBadgesCount: number;
    totalBadgesCount: number;
    completedChallengesCount: number;
    categoryCounts: Record<string, number>;
    recentActivities: UserActivity[];
  }> {
    const res = await fetch(`${API_BASE}/gamification/profile`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch gamification profile');
    return data;
  },

  async getLeaderboard(period: 'global' | 'monthly' = 'global'): Promise<{
    period: string;
    totalParticipants: number;
    leaderboard: any[];
    currentUserRank: any;
  }> {
    const res = await fetch(`${API_BASE}/leaderboard?period=${period}`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch leaderboard');
    return data;
  },

  // Community
  async getPosts(params: { crop?: string; category?: string } = {}): Promise<{
    total: number;
    posts: CommunityPost[];
  }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/community/posts?${query}`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch posts');
    return data;
  },

  async createPost(postData: {
    content: string;
    imageUrl?: string;
    category?: string;
    crop?: string;
  }): Promise<{
    message: string;
    post: CommunityPost;
    pointsEarned: number;
    newlyUnlockedBadges: Badge[];
  }> {
    const res = await fetch(`${API_BASE}/community/posts`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(postData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create post');
    return data;
  },

  async likePost(postId: string): Promise<{ postId: string; isLiked: boolean; likesCount: number }> {
    const res = await fetch(`${API_BASE}/community/posts/${postId}/like`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to like post');
    return data;
  },

  async addComment(postId: string, content: string): Promise<{ message: string; comment: CommunityComment }> {
    const res = await fetch(`${API_BASE}/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add comment');
    return data;
  },

  async reportPost(postId: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/community/posts/${postId}/report`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to report post');
    return data;
  },

  // Marketplace
  async getProducts(params: { category?: string; search?: string; ecoScore?: string } = {}): Promise<{
    total: number;
    products: MarketplaceProduct[];
  }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/products?${query}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch products');
    return data;
  },

  async getCart(): Promise<{ items: CartItem[]; itemCount: number; subtotal: number }> {
    const res = await fetch(`${API_BASE}/cart`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch cart');
    return data;
  },

  async addToCart(productId: string, quantity: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add to cart');
    return data;
  },

  async removeFromCart(productId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/cart/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove from cart');
    return data;
  },

  async checkoutCart(): Promise<{ success: boolean; orderId: string; message: string }> {
    const res = await fetch(`${API_BASE}/cart/checkout`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    return data;
  },

  // AI Assistant
  async askAI(prompt: string, history: Array<{ role: 'user' | 'model'; text: string }> = []): Promise<{
    reply: string;
    disclaimer: string;
    source: 'gemini' | 'rule_fallback';
    userContextAttached: boolean;
  }> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ prompt, history }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI Assistant is currently unavailable');
    return data;
  },

  async explainPractice(practiceId: string): Promise<{
    success: boolean;
    explanation: any;
  }> {
    const res = await fetch(`${API_BASE}/ai/explain-practice`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ practiceId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate practice explanation');
    return data;
  },

  // Research Evaluation APIs
  async compareAlgorithms(params?: any): Promise<any> {
    const query = params ? new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/evaluation/recommendations/compare?${query}`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to compare algorithms');
    return data;
  },

  async getEvaluationMetrics(): Promise<any> {
    const res = await fetch(`${API_BASE}/evaluation/metrics`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch evaluation metrics');
    return data;
  },

  // Admin APIs
  async getAdminDashboard(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Admin access required');
    return data;
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
    return data;
  },

  async createChallenge(challengeData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/challenges`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(challengeData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create challenge');
    return data;
  },

  async deleteChallenge(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/challenges/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete challenge');
    return data;
  },

  async createProduct(productData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create product');
    return data;
  },

  async deleteProduct(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete product');
    return data;
  },

  async getAdminReports(): Promise<{ reports: any[] }> {
    const res = await fetch(`${API_BASE}/admin/reports`, {
      headers: getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch reports');
    return data;
  },

  async resolveReport(reportId: string, action: 'delete_post' | 'dismiss'): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resolve report');
    return data;
  },
};
