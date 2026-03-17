import type {
  User,
  City,
  Post,
  Comment,
  Checkin,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CreatePostRequest,
  UpdateProfileRequest,
  PaginatedResponse,
} from '@/types/api';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function getAuthToken(): string | null {
  return sessionStorage.getItem('auth_token');
}

function clearAuthStorage() {
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('current_user');
}

async function fetchPublicApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchAuthApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthStorage();
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const result = await fetchPublicApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  sessionStorage.setItem('auth_token', result.token);
  sessionStorage.setItem('current_user', JSON.stringify(result.user));
  return result;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const result = await fetchPublicApi<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  sessionStorage.setItem('auth_token', result.token);
  sessionStorage.setItem('current_user', JSON.stringify(result.user));
  return result;
}

export function logout(): void {
  clearAuthStorage();
}

export function getCurrentUser(): User | null {
  const data = sessionStorage.getItem('current_user');
  return data ? JSON.parse(data) : null;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export async function getPopularCities(): Promise<City[]> {
  return fetchPublicApi<City[]>('/cities/popular');
}

export async function searchCities(keyword: string): Promise<City[]> {
  return fetchPublicApi<City[]>(`/cities/search?q=${encodeURIComponent(keyword)}`);
}

export async function getCityDetail(cityId: number): Promise<City> {
  return fetchPublicApi<City>(`/cities/${cityId}`);
}

export async function getCityPosts(
  cityId: number,
  page: number = 1
): Promise<PaginatedResponse<Post>> {
  return fetchPublicApi<PaginatedResponse<Post>>(
    `/cities/${cityId}/posts?sort=rating&page=${page}`
  );
}

export async function getPostDetail(postId: number): Promise<Post> {
  return fetchAuthApi<Post>(`/posts/${postId}`);
}

export async function createPost(data: CreatePostRequest): Promise<Post> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('city_name', data.city_name);
  formData.append('route_text', data.route_text);
  formData.append('route_stops', JSON.stringify(data.route_stops));
  formData.append('total_days', String(data.total_days));

  data.images.forEach((file) => {
    formData.append('images', file);
  });

  return fetchAuthApi<Post>('/posts', {
    method: 'POST',
    body: formData,
  });
}

export async function toggleLike(
  postId: number
): Promise<{ liked: boolean; likes_count: number }> {
  return fetchAuthApi(`/posts/${postId}/like`, {
    method: 'POST',
  });
}

export async function toggleFavorite(
  postId: number
): Promise<{ favorited: boolean }> {
  return fetchAuthApi(`/posts/${postId}/favorite`, {
    method: 'POST',
  });
}

export async function ratePost(
  postId: number,
  score: number
): Promise<{ avg_rating: number; user_rating: number }> {
  return fetchAuthApi(`/posts/${postId}/rate`, {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
}

export async function getPostComments(
  postId: number,
  page: number = 1
): Promise<PaginatedResponse<Comment>> {
  return fetchPublicApi(`/posts/${postId}/comments?page=${page}`);
}

export async function addComment(
  postId: number,
  content: string
): Promise<Comment> {
  return fetchAuthApi(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getUserProfile(userId: number): Promise<User> {
  return fetchAuthApi<User>(`/users/${userId}/profile`);
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const formData = new FormData();

  if (data.display_name) formData.append('display_name', data.display_name);
  if (data.bio !== undefined) formData.append('bio', data.bio);
  if (data.age !== undefined) formData.append('age', String(data.age));
  if (data.gender) formData.append('gender', data.gender);
  if (data.mbti) formData.append('mbti', data.mbti);
  if (data.constellation) formData.append('constellation', data.constellation);
  if (data.avatar) formData.append('avatar', data.avatar);

  const result = await fetchAuthApi<User>('/users/profile', {
    method: 'PUT',
    body: formData,
  });

  sessionStorage.setItem('current_user', JSON.stringify(result));
  return result;
}

export async function checkin(
  cityId: number,
  postId?: number,
  note?: string
): Promise<Checkin> {
  return fetchAuthApi('/checkins', {
    method: 'POST',
    body: JSON.stringify({
      city_id: cityId,
      post_id: postId,
      note,
    }),
  });
}

export async function getUserCheckins(userId: number): Promise<Checkin[]> {
  return fetchAuthApi<Checkin[]>(`/users/${userId}/checkins`);
}

export async function getUserPosts(userId: number): Promise<Post[]> {
  return fetchAuthApi<Post[]>(`/users/${userId}/posts`);
}

export async function getUserFavorites(userId: number): Promise<Post[]> {
  return fetchAuthApi<Post[]>(`/users/${userId}/favorites`);
}

export async function deletePost(postId: number): Promise<{ message: string }> {
  return fetchAuthApi<{ message: string }>(`/posts/${postId}/delete`, {
    method: 'DELETE',
  });
}