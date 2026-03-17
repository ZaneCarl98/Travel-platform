import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { isAuthenticated, getPopularCities } from '@/services/api';

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const loggedIn = isAuthenticated();

  const {
    data: cities = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['popularCities'],
    queryFn: getPopularCities,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/city/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCityClick = (cityId: number) => {
    navigate(`/city/${cityId}`);
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-primary px-4 py-20 md:py-32">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920"
            alt="Travel destination"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="container relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-4xl font-bold text-primary-foreground md:text-6xl"
          >
            Discover Your Next Adventure
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 text-lg text-primary-foreground/80 md:text-xl"
          >
            Share routes, photos, and travel experiences with fellow explorers
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onSubmit={handleSearch}
            className="mx-auto flex max-w-lg items-center gap-2 rounded-full bg-card p-2 shadow-lg"
          >
            <Search className="ml-3 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search a city name..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Search for a city"
            />
            <Button type="submit" className="rounded-full px-6">
              Search
            </Button>
          </motion.form>
        </div>
      </section>

      <section className="container py-8">
        <div className="rounded-2xl bg-secondary p-8 text-center md:p-12">
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">Share Your Journey</h2>
          <p className="mb-5 text-muted-foreground">
            Help fellow travelers by sharing your routes and photos
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 text-lg"
            onClick={() => navigate(loggedIn ? '/create' : '/login')}
          >
            Post an Update
          </Button>
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold">Popular Destinations</h2>
          <p className="text-muted-foreground">
            Explore trending cities recommended by our community
          </p>
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground">Loading cities...</div>
        )}

        {isError && (
          <div className="text-center text-red-500">
            Failed to load cities: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city, index) => (
              <motion.div
                key={city.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => handleCityClick(city.id)}
                className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                role="button"
                tabIndex={0}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={city.image_url || '/placeholder.svg'}
                    alt={`${city.name}, ${city.country}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-1 text-primary-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">{city.country}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4">
                  <h3 className="text-xl font-semibold">{city.name}</h3>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;