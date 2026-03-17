import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Star, Bookmark, MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCityDetail, getCityPosts } from '@/services/api';

const CityDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const cityId = Number(id);

  const {
    data: city,
    isLoading: cityLoading,
    isError: cityError,
    error: cityErrorObj,
  } = useQuery({
    queryKey: ['cityDetail', cityId],
    queryFn: () => getCityDetail(cityId),
    enabled: !!cityId,
  });

  const {
    data: postsResponse,
    isLoading: postsLoading,
    isError: postsError,
    error: postsErrorObj,
  } = useQuery({
    queryKey: ['cityPosts', cityId],
    queryFn: () => getCityPosts(cityId, 1),
    enabled: !!cityId,
  });

  const posts = postsResponse?.data || [];

  if (cityLoading || postsLoading) {
    return <div className="p-8 text-center">Loading city details...</div>;
  }

  if (cityError || postsError) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load city detail:{' '}
        {cityErrorObj instanceof Error
          ? cityErrorObj.message
          : postsErrorObj instanceof Error
          ? postsErrorObj.message
          : 'Unknown error'}
      </div>
    );
  }

  if (!city) {
    return <div className="p-8 text-center">City not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <img
                src={city.image_url || '/placeholder.svg'}
                alt={city.name}
                className="h-80 w-full object-cover"
              />
            </div>

            <div className="mt-6">
              <h1 className="mb-2 text-4xl font-bold">{city.name}</h1>
              <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{city.country}</span>
              </div>
              <p className="leading-7 text-muted-foreground">
                {city.description || 'No city description yet.'}
              </p>
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-3xl font-bold">Travel Guides</h2>

            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="cursor-pointer rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <h3 className="text-xl font-semibold">{post.title}</h3>
                      <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes_count ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{post.avg_rating ?? 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bookmark className="h-4 w-4" />
                          <span>{post.favorites_count ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments_count ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    <p className="mb-3 text-sm text-muted-foreground">
                      by {post.author?.display_name}
                    </p>

                    {post.images && post.images.length > 0 && (
                      <img
                        src={post.images[0].image_url}
                        alt={post.title}
                        className="mb-4 h-48 w-full rounded-xl object-cover"
                      />
                    )}

                    <p className="line-clamp-3 text-muted-foreground">
                      {post.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border bg-card p-6 text-muted-foreground">
                  No travel guides for this city yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityDetail;