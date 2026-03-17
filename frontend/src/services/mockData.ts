/**
 * mockData.ts
 *
 * This module provides mock data for local development and UI demos when backend
 * services are not available.
 *
 * Contains sample users, cities, posts, comments, and checkins.
 */

import type { City, Post, Comment, User, Checkin } from '@/types/api';

export const mockUser: User = {
  id: 1,
  email: 'traveler@example.com',
  display_name: 'Explorer Zhang',
  avatar_url: null,
  bio: 'Travel enthusiast 🌍 | Photographer 📸 | Foodie 🍜 | Exploring the world one city at a time.',
  age: 28,
  gender: 'Male',
  mbti: 'ENFP',
  constellation: 'Leo',
  created_at: '2024-01-15T08:00:00Z',
};

// mockFavorites is defined after mockPosts below

export const mockCities: City[] = [
  { id: 1, name: 'Tokyo', country: 'Japan', description: 'A vibrant metropolis blending ultramodern and traditional, from neon-lit skyscrapers to historic temples.', image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600', latitude: 35.6762, longitude: 139.6503 },
  { id: 2, name: 'Paris', country: 'France', description: 'The City of Light, renowned for its art, fashion, gastronomy and culture.', image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600', latitude: 48.8566, longitude: 2.3522 },
  { id: 3, name: 'London', country: 'United Kingdom', description: 'A world-leading city with history, culture, and modern innovation around every corner.', image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600', latitude: 51.5074, longitude: -0.1278 },
  { id: 4, name: 'New York', country: 'United States of America', description: 'The city that never sleeps, famous for Broadway, Central Park, and iconic skyline.', image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600', latitude: 40.7128, longitude: -74.0060 },
  { id: 5, name: 'Sydney', country: 'Australia', description: 'A harbour city known for its stunning Opera House and beautiful beaches.', image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600', latitude: -33.8688, longitude: 151.2093 },
  { id: 6, name: 'Bangkok', country: 'Thailand', description: 'A city of ornate shrines, vibrant street life, and incredible food markets.', image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600', latitude: 13.7563, longitude: 100.5018 },
];

export const mockPosts: Post[] = [
  {
    id: 1, author_id: 1, city_id: 1, title: '3-Day Tokyo Adventure Guide',
    content: 'Day 1: Start at Senso-ji Temple in Asakusa, then explore Akihabara for anime culture. Evening at Shibuya Crossing.\n\nDay 2: Visit Meiji Shrine, stroll through Harajuku, and enjoy Shinjuku at night.\n\nDay 3: Day trip to Kamakura or explore Odaiba.',
    route_text: 'Senso-ji → Akihabara → Shibuya → Meiji Shrine → Harajuku → Shinjuku → Kamakura',
    created_at: '2024-03-10T10:00:00Z', updated_at: null,
    author: mockUser,
    city: mockCities[0],
    images: [
      { id: 1, post_id: 1, image_url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800', sort_order: 0, created_at: '' },
      { id: 2, post_id: 1, image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', sort_order: 1, created_at: '' },
      { id: 3, post_id: 1, image_url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800', sort_order: 2, created_at: '' },
    ],
    likes_count: 128, avg_rating: 4.5, is_liked: false, is_favorited: false, user_rating: 0,
  },
  {
    id: 2, author_id: 1, city_id: 1, title: 'Tokyo Food & Photography Tour',
    content: 'Best spots for food photography in Tokyo. From Tsukiji to hidden ramen shops.',
    route_text: 'Tsukiji Market → Ramen Street → Izakaya Alley',
    created_at: '2024-03-08T10:00:00Z', updated_at: null,
    author: mockUser, city: mockCities[0], images: [
      { id: 4, post_id: 2, image_url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', sort_order: 0, created_at: '' },
    ],
    likes_count: 85, avg_rating: 4.2, is_liked: false, is_favorited: false, user_rating: 0,
  },
  {
    id: 3, author_id: 1, city_id: 1, title: 'Cherry Blossom Season Guide',
    content: 'Where to see the best cherry blossoms in Tokyo during spring.',
    route_text: 'Ueno Park → Chidorigafuchi → Meguro River',
    created_at: '2024-03-05T10:00:00Z', updated_at: null,
    author: mockUser, city: mockCities[0], images: [
      { id: 5, post_id: 3, image_url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800', sort_order: 0, created_at: '' },
    ],
    likes_count: 210, avg_rating: 4.8, is_liked: false, is_favorited: false, user_rating: 0,
  },
];

export const mockComments: Comment[] = [
  { id: 1, user_id: 2, post_id: 1, content: 'Amazing guide! Followed the route and had a wonderful time.', created_at: '2024-03-11T08:00:00Z', user: { ...mockUser, id: 2, display_name: 'Sarah T.', email: '' } },
  { id: 2, user_id: 3, post_id: 1, content: 'The photos are beautiful! Which camera did you use?', created_at: '2024-03-11T12:00:00Z', user: { ...mockUser, id: 3, display_name: 'Mike L.', email: '' } },
  { id: 3, user_id: 4, post_id: 1, content: 'I would also recommend visiting TeamLab Borderless!', created_at: '2024-03-12T09:00:00Z', user: { ...mockUser, id: 4, display_name: 'Yuki K.', email: '' } },
];

export const mockCheckins: Checkin[] = [
  { id: 1, user_id: 1, city_id: 1, post_id: null, checkin_date: '2024-03-10', note: 'First time in Tokyo!', created_at: '', city: mockCities[0] },
  { id: 2, user_id: 1, city_id: 2, post_id: null, checkin_date: '2024-02-14', note: 'Valentine in Paris', created_at: '', city: mockCities[1] },
  { id: 3, user_id: 1, city_id: 3, post_id: null, checkin_date: '2024-01-20', note: 'London trip', created_at: '', city: mockCities[2] },
];

export const mockFavorites: Post[] = [
  mockPosts[2],
];
