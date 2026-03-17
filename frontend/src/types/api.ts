/**
 * ============================================================
 *  (Database Entity Types)
 * 
 * 。
 * APIJSON。
 * ============================================================
 */

/**  (users) */
export interface User {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  gender: string | null;
  mbti: string | null;
  constellation: string | null;
  created_at: string;
}

/**  (cities) */
export interface City {
  id: number;
  name: string;
  country: string;
  description: string | null;
  image_url: string | null;
  /**  () */
  latitude: number | null;
  /**  () */
  longitude: number | null;
}

/** / (posts) */
export interface Post {
  id: number;
  author_id: number;
  city_id: number;
  title: string;
  content: string;
  route_text: string | null;
  created_at: string;
  updated_at: string | null;
  //  (joined fields for display)
  author?: User;
  city?: City;
  images?: PostImage[];
  likes_count?: number;
  favorites_count?: number;
  comments_count?: number;
  avg_rating?: number;
  is_liked?: boolean;       // 
  is_favorited?: boolean;   // 
  user_rating?: number;     // 
}

/**  (post_images) */
export interface PostImage {
  id: number;
  post_id: number;
  image_url: string;
  sort_order: number;
  created_at: string;
}

/**  (post_likes) */
export interface PostLike {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
}

/**  (post_ratings) */
export interface PostRating {
  id: number;
  user_id: number;
  post_id: number;
  score: number; // 1-5
  created_at: string;
}

/**  (favorites) */
export interface Favorite {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
}

/**  (checkins) */
export interface Checkin {
  id: number;
  user_id: number;
  city_id: number;
  post_id: number | null;
  checkin_date: string;
  note: string | null;
  created_at: string;
  city?: City;
}

/**  (comments) */
export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
  created_at: string;
  user?: User;
}

/**
 * ============================================================
 * API / (API Request/Response Types)
 * ============================================================
 */

/**  */
export interface LoginRequest {
  email: string;
  password: string;
}

/**  */
export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

/** / */
export interface AuthResponse {
  token: string;
  user: User;
}

/**  */
export interface CreatePostRequest {
  city_name: string;
  title: string;
  content: string;
  route_text: string;
  route_stops: string[]; // 
  total_days: number;
  images: File[];        // 
}

/**  */
export interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
  age?: number;
  gender?: string;
  mbti?: string;
  constellation?: string;
  avatar?: File;
}

/**  */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}
