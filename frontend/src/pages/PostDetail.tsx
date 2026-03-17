import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Heart, Bookmark,
  MessageCircle, MapPin, Star, Send, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPostDetail,
  toggleLike as toggleLikeApi,
  toggleFavorite as toggleFavoriteApi,
  ratePost as ratePostApi,
  getPostComments,
  addComment as addCommentApi,
  checkin as checkinApi,
  getCurrentUser,
  deletePost,
} from '@/services/api';

const parseRouteStops = (routeText?: string) => {
  if (!routeText) return [];

  const totalDaysRemoved = routeText.replace(/Total days:\s*\d+/gi, '').trim();
  const structuredMatch = totalDaysRemoved.match(/Route stops:\s*(.+)/i);

  if (structuredMatch) {
    const raw = structuredMatch[1].trim();

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter(Boolean);
      }
    } catch {}

    if (raw.includes('→')) {
      return raw.split('→').map((s) => s.trim()).filter(Boolean);
    }

    if (raw.includes(',')) {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }

    return raw ? [raw] : [];
  }

  if (totalDaysRemoved.includes('→')) {
    return totalDaysRemoved.split('→').map((s) => s.trim()).filter(Boolean);
  }

  return [];
};

const parseTotalDays = (routeText?: string) => {
  if (!routeText) return '3 days';
  const match = routeText.match(/Total days:\s*(\d+)/i);
  if (match) {
    return `${match[1]} day${match[1] === '1' ? '' : 's'}`;
  }
  return '3 days';
};

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const postId = Number(id);
  const currentUser = getCurrentUser();

  const {
    data: post,
    isLoading: postLoading,
    isError: postError,
    error: postErrorObj,
    refetch: refetchPost,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostDetail(postId),
    enabled: !!postId,
  });

  const {
    data: commentsData,
    isLoading: commentsLoading,
    isError: commentsError,
    error: commentsErrorObj,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => getPostComments(postId),
    enabled: !!postId,
  });

  const comments = commentsData?.data || [];
  const commentsCount = commentsData?.total ?? post?.comments_count ?? 0;

  const [photoIndex, setPhotoIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (post) {
      setLiked(post.is_liked || false);
      setLikesCount(post.likes_count || 0);
      setFavorited(post.is_favorited || false);
      setUserRating(post.user_rating || 0);
      setCheckedIn(Boolean((post as any).user_checked_in));
      setPhotoIndex(0);
    }
  }, [post]);

  const images = post?.images || [];
  const routeStops = useMemo(() => parseRouteStops(post?.route_text), [post?.route_text]);
  const totalDaysText = useMemo(() => parseTotalDays(post?.route_text), [post?.route_text]);
  const isAuthor = !!post && !!currentUser && currentUser.id === post.author_id;

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!post) return;

    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deletePost(post.id);
      alert('Post deleted successfully');
      navigate('/profile?tab=myPosts');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      const result = await toggleLikeApi(post.id);
      setLiked(result.liked);
      setLikesCount(result.likes_count);
      await refetchPost();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to like post');
    }
  };

  const handleFavorite = async () => {
    if (!post) return;

    try {
      const result = await toggleFavoriteApi(post.id);
      setFavorited(result.favorited);
      await refetchPost();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to favorite post');
    }
  };

  const handleRate = async (score: number) => {
    if (!post) return;

    try {
      const result = await ratePostApi(post.id, score);
      setUserRating(result.user_rating);
      await refetchPost();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to rate post');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await addCommentApi(post.id, commentText.trim());
      setCommentText('');
      setShowComments(true);
      await refetchComments();
      await refetchPost();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCheckin = async () => {
    if (!post || checkedIn) return;

    try {
      setCheckingIn(true);
      await checkinApi(post.city_id, post.id);
      setCheckedIn(true);
      await refetchPost();
      alert('Check-in successful');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  if (postLoading || commentsLoading) {
    return <div className="min-h-screen p-8 text-center">Loading post...</div>;
  }

  if (postError || commentsError) {
    return (
      <div className="min-h-screen p-8 text-center text-red-500">
        Failed to load post detail:{' '}
        {postErrorObj instanceof Error
          ? postErrorObj.message
          : commentsErrorObj instanceof Error
          ? commentsErrorObj.message
          : 'Unknown error'}
      </div>
    );
  }

  if (!post) {
    return <div className="min-h-screen p-8 text-center">Post not found.</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-16 z-40 border-b bg-card/90 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3">
          <Button variant="outline" size="icon" onClick={handleGoBack} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Update</h2>
          <div className="flex gap-2">
            {isAuthor && (
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="mr-1 h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleFavorite}>
              <Bookmark className={`mr-1 h-4 w-4 ${favorited ? 'fill-accent text-accent' : ''}`} />
              Collect
            </Button>
            <Button variant="outline" size="sm" onClick={handleCheckin} disabled={checkingIn || checkedIn}>
              <MapPin className="mr-1 h-4 w-4" />
              {checkingIn ? 'Checking...' : checkedIn ? 'Checked-in' : 'Check-in'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-accent text-accent" />
                <span className="text-lg font-semibold">
                  {post.avg_rating !== null && post.avg_rating !== undefined
                    ? post.avg_rating.toFixed(1)
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-2 text-sm text-muted-foreground">Your rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className="transition-transform hover:scale-110"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-5 w-5 ${star <= userRating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {images.length > 0 && (
              <div className="relative overflow-hidden rounded-xl bg-muted">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={photoIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={images[photoIndex]?.image_url}
                    alt={`Photo ${photoIndex + 1}`}
                    className="h-72 w-full object-cover md:h-96"
                  />
                </AnimatePresence>
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                      onClick={() => setPhotoIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
                      onClick={() => setPhotoIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
                <div className="absolute bottom-3 right-3 rounded-full bg-foreground/60 px-3 py-1 text-xs text-primary-foreground">
                  {photoIndex + 1} / {images.length}
                </div>
              </div>
            )}

            <div className="rounded-xl border bg-card p-6">
              <h1 className="mb-4 text-2xl font-bold">{post.title}</h1>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {post.content}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant={liked ? 'default' : 'outline'} onClick={handleLike}>
                <Heart className={`mr-1 h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                Like {likesCount}
              </Button>
              <Button variant={favorited ? 'default' : 'outline'} onClick={handleFavorite}>
                <Bookmark className={`mr-1 h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
                Favorite
              </Button>
              <Button variant="outline" onClick={() => setShowComments(!showComments)}>
                <MessageCircle className="mr-1 h-4 w-4" />
                Comments {commentsCount}
              </Button>
            </div>

            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 rounded-xl border bg-card p-6"
              >
                <h3 className="font-semibold">Comments</h3>

                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-xs text-primary">
                            {comment.user?.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{comment.user?.display_name}</p>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  )}
                </div>

                <form onSubmit={handleSubmitComment} className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Please write your comment here..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" aria-label="Submit comment" disabled={submittingComment}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </motion.div>
            )}
          </div>

          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-2 text-xl font-bold">Route</h2>
              <p className="mb-4 text-sm text-muted-foreground">Total time: {totalDaysText}</p>

              {routeStops.length > 0 ? (
                <div className="space-y-0">
                  {routeStops.map((stop, index) => (
                    <div key={index} className="relative flex items-start gap-3 pb-4">
                      {index < routeStops.length - 1 && (
                        <div className="absolute left-[11px] top-6 h-full w-0.5 bg-border" />
                      )}
                      <div className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      <div className="flex-1 rounded-lg border bg-secondary/50 px-4 py-2.5 text-sm font-medium">
                        {stop}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                  {post.route_text || 'No route information yet.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;