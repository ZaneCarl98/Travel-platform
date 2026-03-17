import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { searchCities } from '@/services/api';

const CitySearch = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const query = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q') || '';
  }, [location.search]);

  const {
    data: cities = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['searchCities', query],
    queryFn: () => searchCities(query),
    enabled: !!query,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="mb-2 text-3xl font-bold">Search Results</h1>
        <p className="mb-8 text-muted-foreground">
          Keyword:
          {' '}
          <span className="font-medium">{query || 'No keyword'}</span>
        </p>

        {isLoading && (
          <div className="text-center text-muted-foreground">Searching cities...</div>
        )}

        {isError && (
          <div className="text-center text-red-500">
            Failed to search cities:
            {' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cities.length > 0 ? (
              cities.map((city) => (
                <div
                  key={city.id}
                  onClick={() => navigate(`/city/${city.id}`)}
                  className="cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={city.image_url || '/placeholder.svg'}
                    alt={city.name}
                    className="h-52 w-full object-cover"
                  />
                  <div className="p-4">
                    <h2 className="mb-2 text-xl font-semibold">{city.name}</h2>
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{city.country}</span>
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {city.description || 'No description yet.'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border bg-card p-6 text-muted-foreground">
                No cities found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitySearch;