import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Heart,
  Share2,
  Flag,
  Image as ImageIcon,
  Send,
  Sparkles,
  Info,
  ShieldAlert,
  CheckCircle2,
  PlusCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CommunityPost } from '../types';

interface CommunityPageProps {
  onSelectTab: (tab: string) => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ onSelectTab }) => {
  const { user, refreshUser, showUnlockedBadge } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filterCrop, setFilterCrop] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // New Post modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postCrop, setPostCrop] = useState(user?.mainCrop || 'Tomato');
  const [postCategory, setPostCategory] = useState('Soil Health');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active commenting post id
  const [commentInputPostId, setCommentInputPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Report modal
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Unsafe chemical or fertilizer advice');

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getPosts({
        crop: filterCrop !== 'All' ? filterCrop : undefined,
        category: filterCategory !== 'All' ? filterCategory : undefined,
      });
      setPosts(data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [filterCrop, filterCategory]);

  const handleLike = async (postId: string) => {
    try {
      const res = await api.likePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLikedByMe: res.isLiked, likesCount: res.likesCount }
            : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await api.createPost({
        content: postContent,
        crop: postCrop,
        category: postCategory,
        imageUrl: postImageUrl || undefined,
      });

      setPostContent('');
      setPostImageUrl('');
      setCreateModalOpen(false);
      await refreshUser();
      await loadPosts();

      if (res.newlyUnlockedBadges && res.newlyUnlockedBadges.length > 0) {
        showUnlockedBadge(res.newlyUnlockedBadges[0]);
      }
    } catch (err: any) {
      alert(err.message || 'Could not publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      const res = await api.addComment(postId, commentText);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [...p.comments, res.comment],
                totalComments: p.totalComments + 1,
              }
            : p
        )
      );
      setCommentText('');
      setCommentInputPostId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    }
  };

  const handleReport = async () => {
    if (!reportingPostId) return;
    try {
      await api.reportPost(reportingPostId, reportReason);
      alert('Report submitted for agricultural moderation review.');
      setReportingPostId(null);
      await loadPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Farmer Community Knowledge Board
            </h1>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Share field photographs, discuss soil observations, ask questions, and learn from local regenerative experiences.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Share Experience (+10 pts)</span>
        </button>
      </div>

      {/* Peer Advice Caution Banner */}
      <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Community Peer Sharing Disclaimer:</strong> User posts reflect individual farmer observations and regional experiments. They should not be considered verified agricultural recommendations without local authority endorsement.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-700">Filter Crop:</span>
          {['All', 'Tomato', 'Rice', 'Banana', 'Wheat', 'Sugarcane', 'Vegetables'].map((crop) => (
            <button
              key={crop}
              onClick={() => setFilterCrop(crop)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filterCrop === crop
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {crop}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-700">Category:</span>
          {['All', 'Soil Health', 'Water Conservation', 'Pest Management', 'Biodiversity'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filterCategory === cat
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* POSTS FEED */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-16 text-center text-stone-400">Loading community updates...</div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-stone-400 bg-white rounded-3xl border border-stone-200">
            No community posts found for the selected filter. Be the first to share!
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-5 flex items-center justify-between border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      post.userAvatar ||
                      'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={post.userName}
                    className="w-10 h-10 rounded-full object-cover border border-stone-200"
                  />
                  <div>
                    <div className="font-bold text-stone-900 text-sm">{post.userName}</div>
                    <div className="text-[11px] text-stone-500">
                      {post.userLocation} •{' '}
                      <span className="text-emerald-700 font-semibold">{post.userCrop}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    {post.category}
                  </span>
                  <button
                    onClick={() => setReportingPostId(post.id)}
                    className="p-1.5 text-stone-400 hover:text-amber-700 rounded-lg"
                    title="Report post for moderation"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-5 space-y-4">
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Optional Photograph */}
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden max-h-96 border border-stone-200">
                    <img
                      src={post.imageUrl}
                      alt="Farm observation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="text-[10px] text-stone-400">
                  Published: {new Date(post.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Interaction Bar */}
              <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 font-bold transition-colors ${
                      post.isLikedByMe ? 'text-red-600' : 'text-stone-600 hover:text-red-600'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        post.isLikedByMe ? 'fill-red-600 text-red-600' : 'text-stone-400'
                      }`}
                    />
                    <span>{post.likesCount} Helpful</span>
                  </button>

                  <button
                    onClick={() =>
                      setCommentInputPostId(commentInputPostId === post.id ? null : post.id)
                    }
                    className="flex items-center gap-1.5 font-bold text-stone-600 hover:text-emerald-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-stone-400" />
                    <span>{post.totalComments} Comments</span>
                  </button>
                </div>

                <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Peer Learning
                </div>
              </div>

              {/* Comments Thread */}
              {post.comments.length > 0 && (
                <div className="p-5 bg-stone-50/50 border-t border-stone-100 space-y-3">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Comments ({post.totalComments}):
                  </div>
                  {post.comments.map((comm) => (
                    <div key={comm.id} className="p-3 bg-white rounded-xl border border-stone-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">{comm.userName}</span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(comm.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-stone-600">{comm.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              {commentInputPostId === post.id && (
                <div className="p-4 bg-white border-t border-stone-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a constructive comment or question..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* CREATE POST MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-emerald-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">
                  Share Sustainable Field Learning
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  What did you observe or implement on your farm?
                </label>
                <textarea
                  rows={4}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="e.g. Applied paddy straw mulch around tomato roots this weekend. Topsoil held moisture across 3 hot sunny afternoons and weeds were suppressed."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Crop</label>
                  <select
                    value={postCrop}
                    onChange={(e) => setPostCrop(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white"
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Rice">Rice / Paddy</option>
                    <option value="Banana">Banana</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Groundnut">Groundnut</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Millets">Millets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white"
                  >
                    <option value="Soil Health">Soil Health</option>
                    <option value="Water Conservation">Water Conservation</option>
                    <option value="Organic Farming">Organic Farming</option>
                    <option value="Pest Management">Pest Management</option>
                    <option value="Biodiversity">Biodiversity</option>
                    <option value="Waste Reduction">Waste Reduction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Optional Photo URL (Unsplash or direct image)
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="url"
                    value={postImageUrl}
                    onChange={(e) => setPostImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Posting...' : 'Publish to Board (+10 pts)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-amber-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-600" />
              Report Community Content
            </h3>
            <p className="text-xs text-stone-600">
              Flag posts that violate agricultural safety or promote harmful practices.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white"
              >
                <option value="Unsafe chemical or fertilizer advice">Unsafe chemical dosage</option>
                <option value="Misleading agricultural claims">Misleading claims</option>
                <option value="Inappropriate or abusive language">Inappropriate language</option>
                <option value="Spam or promotional advertising">Spam or ads</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReportingPostId(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="px-5 py-2 text-xs font-bold bg-amber-600 text-white rounded-xl"
              >
                Submit Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
