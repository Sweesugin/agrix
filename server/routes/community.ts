import { Router, Response } from 'express';
import { db, calculateLevel } from '../db/store';
import { authenticate, optionalAuthenticate, AuthRequest } from '../middleware/auth';
import { CommunityPost, CommunityComment, ReportItem } from '../db/types';

const router = Router();

// GET /api/community/posts
router.get('/posts', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const { crop, category } = req.query;
  const currentUserId = req.user?.id;

  let posts = Array.from(db.posts.values());

  // Filter out posts that were taken down (unless admin)
  if (!req.user || req.user.role !== 'admin') {
    posts = posts.filter((p) => !p.isReported || (p.reportedBy && p.reportedBy.length < 3));
  }

  if (crop && crop !== 'All') {
    posts = posts.filter((p) => p.userCrop.toLowerCase() === (crop as string).toLowerCase());
  }

  if (category && category !== 'All') {
    posts = posts.filter((p) => p.category === category);
  }

  // Sort descending by creation date
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const enrichedPosts = posts.map((p) => {
    // Get comments for this post
    const comments = Array.from(db.comments.values()).filter((c) => c.postId === p.id);
    return {
      ...p,
      likesCount: p.likes.length,
      isLikedByMe: currentUserId ? p.likes.includes(currentUserId) : false,
      comments: comments.slice(-3), // recent 3 comments inline
      totalComments: comments.length,
    };
  });

  return res.json({
    total: enrichedPosts.length,
    posts: enrichedPosts,
  });
});

// POST /api/community/posts
router.post('/posts', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { content, imageUrl, category, crop } = req.body;
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post content cannot be empty' });
  }

  const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newPost: CommunityPost = {
    id: postId,
    userId: req.user.id,
    userName: req.user.name,
    userLocation: `${req.user.location}, ${req.user.state}`,
    userCrop: crop || req.user.mainCrop,
    userAvatar: req.user.avatarUrl,
    content: content.trim(),
    imageUrl: imageUrl || undefined,
    category: category || 'General Practice',
    likes: [],
    commentCount: 0,
    isReported: false,
    createdAt: new Date().toISOString(),
  };

  db.posts.set(postId, newPost);

  // Award +10 points for sharing with community!
  const pointsAwarded = 10;
  const updatedPoints = req.user.points + pointsAwarded;
  const levelData = calculateLevel(updatedPoints);

  db.updateUser(req.user.id, {
    points: updatedPoints,
    level: levelData.level,
    levelTitle: levelData.levelTitle,
  });

  db.logActivity(req.user.id, 'post_created', 'Shared farming practice with community (+10 pts)', pointsAwarded);

  // Check badges (e.g. 💬 Community Voice)
  const newlyUnlockedBadges = db.checkAndAwardBadges(req.user.id);

  return res.status(201).json({
    message: 'Post shared successfully! (+10 points)',
    post: {
      ...newPost,
      likesCount: 0,
      isLikedByMe: false,
      comments: [],
      totalComments: 0,
    },
    pointsEarned: pointsAwarded,
    newlyUnlockedBadges,
  });
});

// POST /api/community/posts/:id/like
router.post('/posts/:id/like', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const post = db.posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const userId = req.user.id;
  const likeIndex = post.likes.indexOf(userId);

  let liked = false;
  if (likeIndex >= 0) {
    post.likes.splice(likeIndex, 1);
    liked = false;
  } else {
    post.likes.push(userId);
    liked = true;
  }

  return res.json({
    postId: post.id,
    isLiked: liked,
    likesCount: post.likes.length,
  });
});

// GET /api/community/posts/:id/comments
router.get('/posts/:id/comments', (req, res: Response) => {
  const post = db.posts.get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comments = Array.from(db.comments.values())
    .filter((c) => c.postId === post.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return res.json({ comments });
});

// POST /api/community/posts/:id/comments
router.post('/posts/:id/comments', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const post = db.posts.get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { content } = req.body;
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }

  const commentId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newComment: CommunityComment = {
    id: commentId,
    postId: post.id,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    userAvatar: req.user.avatarUrl,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  db.comments.set(commentId, newComment);
  post.commentCount += 1;

  return res.status(201).json({
    message: 'Comment added',
    comment: newComment,
  });
});

// POST /api/community/posts/:id/report
router.post('/posts/:id/report', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const post = db.posts.get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { reason = 'Inappropriate or harmful advice' } = req.body;
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  post.isReported = true;
  post.reportedReason = reason;
  post.reportedBy = post.reportedBy || [];
  if (!post.reportedBy.includes(req.user.id)) {
    post.reportedBy.push(req.user.id);
  }

  const reportItem: ReportItem = {
    id: reportId,
    targetType: 'post',
    targetId: post.id,
    reportedByUserId: req.user.id,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.reports.set(reportId, reportItem);

  return res.json({
    message: 'Thank you. The post has been flagged for agricultural moderation review.',
    reportId,
  });
});

export default router;
