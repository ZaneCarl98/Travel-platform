import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, User, Heart, FileText, ChevronRight, Bookmark, Trash2 } from 'lucide-react';
import FootprintMap from '@/components/FootprintMap';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  isAuthenticated,
  getCurrentUser,
  getUserProfile,
  getUserCheckins,
  getUserPosts,
  getUserFavorites,
  deletePost,
} from '@/services/api';

type ProfileView = 'home' | 'myPosts' | 'favorites' | 'footprint';

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const hasMapState = typeof window !== 'undefined' && !!sessionStorage.getItem('footprintMapState');
  const loggedIn = isAuthenticated();
  const currentUser = getCurrentUser();
  const userId = currentUser?.id;

  const resolveInitialView = (): ProfileView => {
    if (tabParam === 'myPosts') return 'myPosts';
    if (tabParam === 'favorites') return 'favorites';
    if (tabParam === 'footprint' || hasMapState) return 'footprint';
    return 'home';
  };

  const [activeView, setActiveView] = useState<ProfileView>(resolveInitialView());

  useEffect(() => {
    if (!loggedIn || !userId) {
      navigate('/login');
      return;
    }

    if (tabParam === 'myPosts') setActiveView('myPosts');
    else if (tabParam === 'favorites') setActiveView('favorites');
    else if (tabParam === 'footprint') setActiveView('footprint');
  }, [loggedIn, userId, navigate, tabParam]);

  const { data: profileData } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getUserProfile(userId as number),
    enabled: !!userId && loggedIn,
  });

  const { data: checkinsData = [] } = useQuery({
    queryKey: ['checkins', userId],
    queryFn: () => getUserCheckins(userId as number),
    enabled: !!userId && loggedIn,
  });

  const { data: myPostsData = [] } = useQuery({
    queryKey: ['myPosts', userId],
    queryFn: () => getUserPosts(userId as number),
    enabled: !!userId && loggedIn,
  });

  const { data: favoritesData = [] } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => getUserFavorites(userId as number),
    enabled: !!userId && loggedIn,
  });

  if (!loggedIn || !userId || !currentUser) {
    return null;
  }

  const user = profileData || currentUser;
  const checkins = checkinsData;
  const myPosts = myPostsData;
  const favorites = favoritesData;

  const handleDeletePost = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();

    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;

    try {
      await deletePost(postId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myPosts', userId] }),
        queryClient.invalidateQueries({ queryKey: ['favorites', userId] }),
      ]);
      alert('Post deleted successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete post');
    }
  };

  const menuItems = [
    { icon: FileText, label: 'My Posts', count: myPosts.length, view: 'myPosts' as ProfileView },
    { icon: Bookmark, label: 'Favorites', count: favorites.length, view: 'favorites' as ProfileView },
    { icon: User, label: 'Personal Information', view: 'personalInfo' as const },
    { icon: MapPin, label: 'Check-in Footprint', count: checkins.length, view: 'footprint' as ProfileView },
  ];

  if (activeView === 'home') {
    return (
      <div className="min-h-screen">
        <div className="sticky top-16 z-40 border-b bg-card/90 backdrop-blur-sm">
          <div className="container flex items-center justify-between py-3">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Personal Homepage</h2>
            <div className="w-10" />
          </div>
        </div>

        <div className="container py-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt="Avatar" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                    {user.display_name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <h1 className="text-xl font-bold text-foreground">{user.display_name}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              {user.bio && (
                <p className="max-w-md text-center text-sm text-muted-foreground">{user.bio}</p>
              )}
              <div className="flex gap-8 pt-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{myPosts.length}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{favorites.length}</p>
                  <p className="text-xs text-muted-foreground">Favorites</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{checkins.length}</p>
                  <p className="text-xs text-muted-foreground">Cities</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
              {menuItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.label === 'Personal Information') {
                      navigate('/profile/info');
                    } else {
                      setActiveView(item.view as ProfileView);
                    }
                  }}
                  className={`flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50 ${
                    index < menuItems.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="flex-1 font-medium text-foreground">{item.label}</span>
                  {'count' in item && item.count !== undefined && (
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subViewTitle =
    activeView === 'myPosts'
      ? 'My Posts'
      : activeView === 'favorites'
      ? 'Favorites'
      : 'Check-in Footprint';

  const posts = activeView === 'myPosts' ? myPosts : activeView === 'favorites' ? favorites : [];

  return (
    <div className="min-h-screen">
      <div className="sticky top-16 z-40 border-b bg-card/90 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3">
          <Button variant="outline" size="icon" onClick={() => setActiveView('home')} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">{subViewTitle}</h2>
          <div className="w-10" />
        </div>
      </div>

      <div className="container py-8">
        {activeView === 'footprint' ? (
          <div className="space-y-6">
            <p className="text-center text-muted-foreground">
              Cities you have visited are highlighted below. Click a country to zoom in.
            </p>
            <FootprintMap checkins={checkins} />
            <div className="mx-auto max-w-2xl space-y-3">
              <h3 className="text-lg font-semibold">Check-in History</h3>
              {checkins.map((checkin) => (
                <div key={checkin.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{checkin.city?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(checkin.checkin_date).toLocaleDateString()}
                      {checkin.note ? ` · ${checkin.note}` : ''}
                    </p>
                  </div>
                </div>
              ))}
              {checkins.length === 0 && (
                <p className="py-12 text-center text-muted-foreground">No check-ins yet. Start exploring!</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {posts.length === 0 && (
              <p className="py-12 text-center text-muted-foreground">
                {activeView === 'myPosts'
                  ? "You haven't posted any updates yet."
                  : "You haven't saved any favorites yet."}
              </p>
            )}
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="flex w-full items-start gap-4 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50"
              >
                {post.images?.[0] && (
                  <img
                    src={post.images[0].image_url}
                    alt={post.title}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {post.city?.name} · {new Date(post.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {post.likes_count}
                    </span>
                    <span>⭐ {post.avg_rating ?? 'N/A'}</span>
                  </div>
                </div>

                {activeView === 'myPosts' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeletePost(e, post.id)}
                    aria-label="Delete post"
                    className="mt-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <ChevronRight className="mt-2 h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;