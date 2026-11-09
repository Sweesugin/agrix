import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, calculateLevel } from '../db/store';
import { User, SoilType, FarmingMethod, ExperienceLevel } from '../db/types';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      location,
      state,
      farmSize,
      soilType,
      mainCrop,
      farmingMethod,
      experienceLevel,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 8);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Initial points: 20 points for completing profile on registration
    const initialPoints = 20;
    const lvl = calculateLevel(initialPoints);

    const newUser: User = {
      id: userId,
      name,
      email,
      passwordHash,
      role: 'farmer',
      phone: phone || '',
      location: location || '',
      state: state || '',
      farmSize: Number(farmSize) || 1,
      soilType: (soilType as SoilType) || 'Loamy',
      mainCrop: mainCrop || 'Vegetables',
      farmingMethod: (farmingMethod as FarmingMethod) || 'Conventional',
      experienceLevel: (experienceLevel as ExperienceLevel) || 'Beginner',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      points: initialPoints,
      level: lvl.level,
      levelTitle: lvl.levelTitle,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    db.createUser(newUser);
    db.logActivity(userId, 'challenge_started', 'Completed registration & set up farm profile! (+20 pts)', 20);

    const token = generateToken(newUser);

    // Return sanitized user object
    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update streak if active today
    const today = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = user.lastActiveDate === yesterday ? user.streak + 1 : 1;
      db.updateUser(user.id, {
        streak: newStreak,
        lastActiveDate: today,
      });
      user.streak = newStreak;
      user.lastActiveDate = today;

      // Check if streak award is triggered
      db.checkAndAwardBadges(user.id);
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { passwordHash: _, ...safeUser } = req.user;
  const levelInfo = calculateLevel(req.user.points);

  // Get user badges
  const userBadges = Array.from(db.userBadges.values())
    .filter((ub) => ub.userId === req.user!.id)
    .map((ub) => {
      const badge = db.badges.get(ub.badgeId);
      return { ...badge, unlockedAt: ub.unlockedAt };
    });

  return res.json({
    user: safeUser,
    levelInfo,
    badges: userBadges,
  });
});

// POST /api/auth/demo-switch (Quick switcher for testing and demonstration)
router.post('/demo-switch', (req, res: Response) => {
  const { userId } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;

  return res.json({
    message: `Switched to demo user ${user.name}`,
    token,
    user: safeUser,
  });
});

export default router;
