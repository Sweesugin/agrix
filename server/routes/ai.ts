import { Router, Response } from 'express';
import { askAgriXAssistant } from '../services/gemini';
import { optionalAuthenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Rate limiting in-memory map for basic throttling
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ipOrId: string): boolean {
  const now = Date.now();
  const current = requestCounts.get(ipOrId);
  if (!current || now > current.resetTime) {
    requestCounts.set(ipOrId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (current.count >= 25) {
    return false; // exceed 25 requests per minute
  }
  current.count += 1;
  return true;
}

// POST /api/ai/chat
router.post('/chat', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.id || req.ip || 'anonymous';
    if (!checkRateLimit(clientId)) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before sending another query.',
      });
    }

    const { prompt, history = [] } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const userProfile = req.user
      ? {
          name: req.user.name,
          mainCrop: req.user.mainCrop,
          soilType: req.user.soilType,
          farmingMethod: req.user.farmingMethod,
          farmSize: req.user.farmSize,
          location: req.user.location,
          state: req.user.state,
          experienceLevel: req.user.experienceLevel,
        }
      : undefined;

    const result = await askAgriXAssistant(prompt.trim(), userProfile, history);

    return res.json({
      reply: result.reply,
      disclaimer: result.disclaimer,
      source: result.source,
      userContextAttached: !!userProfile,
    });
  } catch (err: any) {
    console.error('AI chat endpoint error:', err);
    return res.status(500).json({
      error: 'Failed to generate advisory response. Please try again.',
    });
  }
});

export default router;
