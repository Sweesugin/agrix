import { Router, Response } from 'express';
import { db } from '../db/store';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { Challenge, SustainablePractice, MarketplaceProduct, Badge } from '../db/types';

const router = Router();

// Protect all admin routes
router.use(authenticate, requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', (req: AuthRequest, res: Response) => {
  const users = db.getAllUsers();
  const farmers = users.filter((u) => u.role === 'farmer');
  const userChallenges = Array.from(db.userChallenges.values());
  const completedChallenges = userChallenges.filter((uc) => uc.status === 'completed');
  const posts = Array.from(db.posts.values());
  const reportedPosts = posts.filter((p) => p.isReported);
  const products = Array.from(db.products.values());
  const practices = Array.from(db.practices.values());
  const challenges = Array.from(db.challenges.values());
  const badges = Array.from(db.badges.values());

  const totalPointsAwarded = farmers.reduce((sum, u) => sum + u.points, 0);

  // Crop distribution
  const cropStats: Record<string, number> = {};
  farmers.forEach((f) => {
    cropStats[f.mainCrop] = (cropStats[f.mainCrop] || 0) + 1;
  });

  // Farming methods breakdown
  const methodStats: Record<string, number> = {};
  farmers.forEach((f) => {
    methodStats[f.farmingMethod] = (methodStats[f.farmingMethod] || 0) + 1;
  });

  return res.json({
    stats: {
      totalUsers: users.length,
      totalFarmers: farmers.length,
      activeUsers: farmers.filter((f) => f.streak > 0).length,
      challengesCompleted: completedChallenges.length,
      totalChallenges: challenges.length,
      communityPosts: posts.length,
      reportedPostsCount: reportedPosts.length,
      productsCount: products.length,
      practicesCount: practices.length,
      badgesCount: badges.length,
      totalPointsAwarded,
    },
    cropStats,
    methodStats,
    recentReports: Array.from(db.reports.values()).slice(0, 10),
  });
});

// GET /api/admin/users
router.get('/users', (req: AuthRequest, res: Response) => {
  const users = db.getAllUsers().map(({ passwordHash: _, ...u }) => u);
  return res.json({ users });
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  if (role !== 'farmer' && role !== 'admin') {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const updated = db.updateUser(req.params.id, { role });
  if (!updated) return res.status(404).json({ error: 'User not found' });

  const { passwordHash: _, ...safeUser } = updated;
  return res.json({ message: 'User role updated', user: safeUser });
});

// CHALLENGES MANAGEMENT
// POST /api/admin/challenges
router.post('/challenges', (req: AuthRequest, res: Response) => {
  const { title, description, category, difficulty, duration, points, sustainabilityBenefit, instructions, verificationHint } = req.body;

  if (!title || !category || !points) {
    return res.status(400).json({ error: 'Title, category, and points are required' });
  }

  const id = `chal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newChallenge: Challenge = {
    id,
    practiceId: req.body.practiceId || 'prac_custom',
    title,
    description: description || '',
    category,
    difficulty: difficulty || 'Medium',
    duration: duration || '1 day',
    points: Number(points),
    sustainabilityBenefit: sustainabilityBenefit || '',
    instructions: instructions || ['Follow recommended practice steps.'],
    verificationHint: verificationHint || 'Share confirmation on community board.',
    createdAt: new Date().toISOString(),
  };

  db.challenges.set(id, newChallenge);
  return res.status(201).json({ message: 'Challenge created successfully', challenge: newChallenge });
});

// PUT /api/admin/challenges/:id
router.put('/challenges/:id', (req: AuthRequest, res: Response) => {
  const challenge = db.challenges.get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

  const updated: Challenge = {
    ...challenge,
    ...req.body,
    points: req.body.points !== undefined ? Number(req.body.points) : challenge.points,
  };

  db.challenges.set(challenge.id, updated);
  return res.json({ message: 'Challenge updated successfully', challenge: updated });
});

// DELETE /api/admin/challenges/:id
router.delete('/challenges/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  if (!db.challenges.has(id)) {
    return res.status(404).json({ error: 'Challenge not found' });
  }
  db.challenges.delete(id);
  return res.json({ message: 'Challenge deleted successfully' });
});

// PRACTICES MANAGEMENT
// POST /api/admin/practices
router.post('/practices', (req: AuthRequest, res: Response) => {
  const { title, category, suitableCrops, suitableSoilTypes, suitableSeasons, suitableFarmingMethods, difficulty, description, sustainabilityBenefit, points, steps } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }

  const id = `prac_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newPractice: SustainablePractice = {
    id,
    title,
    category,
    suitableCrops: suitableCrops || ['Vegetables'],
    suitableSoilTypes: suitableSoilTypes || ['Loamy'],
    suitableSeasons: suitableSeasons || ['All season'],
    suitableFarmingMethods: suitableFarmingMethods || ['Organic'],
    difficulty: difficulty || 'Easy',
    description: description || '',
    sustainabilityBenefit: sustainabilityBenefit || '',
    estimatedCompletion: '1 day',
    points: Number(points) || 50,
    steps: steps || ['Plan plot', 'Implement method', 'Monitor impact'],
    requiredMaterials: req.body.requiredMaterials || ['Standard agricultural implements'],
    precautions: req.body.precautions || ['Follow local extension advisories'],
    expectedBenefits: req.body.expectedBenefits || [sustainabilityBenefit || 'Resource conservation'],
    relatedChallengeId: req.body.relatedChallengeId || 'chal_custom',
  };

  db.practices.set(id, newPractice);
  return res.status(201).json({ message: 'Practice created successfully', practice: newPractice });
});

// PUT /api/admin/practices/:id
router.put('/practices/:id', (req: AuthRequest, res: Response) => {
  const practice = db.practices.get(req.params.id);
  if (!practice) return res.status(404).json({ error: 'Practice not found' });

  const updated: SustainablePractice = { ...practice, ...req.body };
  db.practices.set(practice.id, updated);
  return res.json({ message: 'Practice updated', practice: updated });
});

// DELETE /api/admin/practices/:id
router.delete('/practices/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  if (!db.practices.has(id)) return res.status(404).json({ error: 'Practice not found' });
  db.practices.delete(id);
  return res.json({ message: 'Practice deleted' });
});

// PRODUCTS MANAGEMENT
// POST /api/admin/products
router.post('/products', (req: AuthRequest, res: Response) => {
  const { name, category, description, price, unit, seller, imageUrl, sustainabilityBenefit, ecoScore } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }

  const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newProduct: MarketplaceProduct = {
    id,
    name,
    category,
    description: description || '',
    price: Number(price),
    unit: unit || '1 unit',
    seller: seller || 'AgriX Verified Producer',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=400&auto=format&fit=crop&q=80',
    sustainabilityBenefit: sustainabilityBenefit || 'Eco-friendly sustainable input',
    ecoScore: ecoScore || 'A',
    inStock: true,
    rating: 5.0,
    reviewsCount: 1,
  };

  db.products.set(id, newProduct);
  return res.status(201).json({ message: 'Product created', product: newProduct });
});

// PUT /api/admin/products/:id
router.put('/products/:id', (req: AuthRequest, res: Response) => {
  const prod = db.products.get(req.params.id);
  if (!prod) return res.status(404).json({ error: 'Product not found' });

  const updated: MarketplaceProduct = {
    ...prod,
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : prod.price,
  };
  db.products.set(prod.id, updated);
  return res.json({ message: 'Product updated', product: updated });
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  if (!db.products.has(id)) return res.status(404).json({ error: 'Product not found' });
  db.products.delete(id);
  return res.json({ message: 'Product deleted' });
});

// COMMUNITY MODERATION
// GET /api/admin/reports
router.get('/reports', (req: AuthRequest, res: Response) => {
  const reports = Array.from(db.reports.values());
  const enriched = reports.map((r) => {
    const post = db.posts.get(r.targetId);
    return { ...r, post };
  });
  return res.json({ reports: enriched });
});

// POST /api/admin/reports/:id/resolve
router.post('/reports/:id/resolve', (req: AuthRequest, res: Response) => {
  const report = db.reports.get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const { action } = req.body; // 'delete_post' or 'dismiss'
  report.status = 'resolved';

  if (action === 'delete_post') {
    db.posts.delete(report.targetId);
  } else if (action === 'dismiss') {
    const post = db.posts.get(report.targetId);
    if (post) {
      post.isReported = false;
      post.reportedReason = undefined;
      post.reportedBy = [];
    }
  }

  return res.json({ message: `Report marked as ${action}` });
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  if (!db.posts.has(id)) return res.status(404).json({ error: 'Post not found' });
  db.posts.delete(id);
  return res.json({ message: 'Post removed by administrator' });
});

// BADGES MANAGEMENT
// POST /api/admin/badges
router.post('/badges', (req: AuthRequest, res: Response) => {
  const { name, icon, description, criteria, targetCount, pointsReward, category } = req.body;
  if (!name || !criteria) return res.status(400).json({ error: 'Name and criteria are required' });

  const id = `badge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newBadge: Badge = {
    id,
    name,
    icon: icon || '🏅',
    description: description || '',
    criteria,
    targetCount: Number(targetCount) || 3,
    pointsReward: Number(pointsReward) || 50,
    category: category || 'General',
  };

  db.badges.set(id, newBadge);
  return res.status(201).json({ message: 'Badge added', badge: newBadge });
});

export default router;
