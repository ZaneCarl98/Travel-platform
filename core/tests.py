from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import City, Post, PostLike, Favorite, PostRating, Checkin


User = get_user_model()


# =========================
# Authentication API Tests
# =========================


class AuthApiTests(APITestCase):
    """Test cases for authentication APIs including registration and login."""
    
    def test_register_then_login_returns_token_and_user(self):
        """Test user registration followed by login returns valid token and user data.
        
        Steps:
        1. Register a new user with email, password, and display_name
        2. Verify response contains token and user data
        3. Login with the same credentials
        4. Verify login response also contains token and user data
        """
        register_url = reverse("api_register")
        payload = {
            "email": "newuser@example.com",
            "password": "StrongPass123!",
            "display_name": "newuser",
        }
        res = self.client.post(register_url, payload, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertIn("token", res.data)
        self.assertIn("user", res.data)
        self.assertEqual(res.data["user"]["email"], payload["email"])

        login_url = reverse("api_login")
        res2 = self.client.post(
            login_url,
            {"email": payload["email"], "password": payload["password"]},
            format="json",
        )
        self.assertEqual(res2.status_code, 200)
        self.assertIn("token", res2.data)
        self.assertIn("user", res2.data)

    def test_login_wrong_password_returns_400(self):
        """Test login with incorrect password returns 400 error.
        
        Steps:
        1. Create a user with known credentials
        2. Attempt login with wrong password
        3. Verify response status code is 400
        """
        user = User.objects.create_user(username="u1", email="u1@example.com", password="RightPass123!")
        login_url = reverse("api_login")
        res = self.client.post(login_url, {"email": user.email, "password": "wrong"}, format="json")
        self.assertEqual(res.status_code, 400)


# =========================
# City API Tests
# =========================


class CityApiTests(APITestCase):
    """Test cases for city-related APIs."""
    
    def test_popular_cities_sorted_by_post_count_desc(self):
        """Test popular cities endpoint returns cities sorted by post count descending.
        
        Creates 3 cities with different post counts and verifies:
        - City with most posts appears first
        - Cities are ordered by post count descending
        """
        c1 = City.objects.create(name="A", country="X")
        c2 = City.objects.create(name="B", country="X")
        c3 = City.objects.create(name="C", country="X")
        author = User.objects.create_user(username="author", email="author@example.com", password="Pass123!@#")

        Post.objects.create(author=author, city=c1, title="p1", content="c")
        Post.objects.create(author=author, city=c1, title="p2", content="c")
        Post.objects.create(author=author, city=c2, title="p3", content="c")

        url = reverse("api_popular_cities")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        ids = [item["id"] for item in res.data]
        self.assertTrue(ids.index(c1.id) < ids.index(c2.id))
        self.assertTrue(ids.index(c2.id) < ids.index(c3.id))

    def test_search_cities_by_name(self):
        """Test city search functionality filters by name substring.
        
        Steps:
        1. Create multiple cities
        2. Search with partial name match
        3. Verify only matching city is returned
        """
        City.objects.create(name="London", country="UK")
        City.objects.create(name="Paris", country="FR")
        url = reverse("api_search_cities")
        res = self.client.get(url, {"q": "lon"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], "London")


# =========================
# Post API Tests
# =========================


class PostApiTests(APITestCase):
    """Test cases for post-related APIs."""
    
    def _auth_as(self, email="t@example.com", username="tester", password="Pass123!@#"):
        """Helper method to authenticate user and set authorization header.
        
        Args:
            email: User email address
            username: Username
            password: User password
            
        Returns:
            Created user instance
        """
        user = User.objects.create_user(username=username, email=email, password=password)
        login_url = reverse("api_login")
        res = self.client.post(login_url, {"email": email, "password": password}, format="json")
        token = res.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return user

    def test_create_post_requires_auth(self):
        """Test that creating a post requires authentication.
        
        Verifies unauthenticated requests to create post endpoint
        return 401 or 403 status code.
        """
        url = reverse("api_create_post")
        res = self.client.post(url, {"title": "t", "content": "c", "city_name": "Tokyo"}, format="json")
        self.assertIn(res.status_code, (401, 403))

    def test_create_post_creates_city_if_needed(self):
        """Test creating a post auto-creates city if it doesn't exist.
        
        Steps:
        1. Authenticate as user
        2. Create post with non-existent city name
        3. Verify post is created successfully
        4. Verify city is auto-created
        """
        self._auth_as()
        url = reverse("api_create_post")
        payload = {
            "title": "My trip",
            "content": "Nice city",
            "city_name": "NewCityName",
            "route_text": "A → B",
            "route_stops": ["A", "B"],
            "total_days": 2,
        }
        res = self.client.post(url, payload, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["title"], payload["title"])
        self.assertTrue(City.objects.filter(name="NewCityName").exists())

    def test_toggle_like_creates_and_deletes_like(self):
        """Test toggle like functionality creates and deletes likes.
        
        Steps:
        1. Authenticate and create a post
        2. First toggle should create like
        3. Second toggle should delete like
        4. Verify like existence after each operation
        """
        user = self._auth_as()
        city = City.objects.create(name="Tokyo", country="JP")
        post = Post.objects.create(author=user, city=city, title="t", content="c")

        url = reverse("api_toggle_like", kwargs={"post_id": post.id})
        res1 = self.client.post(url, {}, format="json")
        self.assertEqual(res1.status_code, 200)
        self.assertTrue(PostLike.objects.filter(user=user, post=post).exists())

        res2 = self.client.post(url, {}, format="json")
        self.assertEqual(res2.status_code, 200)
        self.assertFalse(PostLike.objects.filter(user=user, post=post).exists())

    def test_rate_post_validates_range_and_persists(self):
        """Test post rating validates score range and persists correctly.
        
        Steps:
        1. Authenticate and create a post
        2. Try invalid score (6) - should fail
        3. Submit valid score (5) - should succeed
        4. Verify rating is saved in database
        """
        user = self._auth_as()
        city = City.objects.create(name="Tokyo", country="JP")
        post = Post.objects.create(author=user, city=city, title="t", content="c")

        url = reverse("api_rate_post", kwargs={"post_id": post.id})
        res_bad = self.client.post(url, {"score": 6}, format="json")
        self.assertEqual(res_bad.status_code, 400)

        res_ok = self.client.post(url, {"score": 5}, format="json")
        self.assertEqual(res_ok.status_code, 200)
        self.assertTrue(PostRating.objects.filter(user=user, post=post, score=5).exists())

    def test_favorite_toggle_creates_and_deletes(self):
        """Test toggle favorite functionality creates and deletes favorites.
        
        Steps:
        1. Authenticate and create a post
        2. First toggle should create favorite
        3. Second toggle should delete favorite
        4. Verify favorite existence after each operation
        """
        user = self._auth_as()
        city = City.objects.create(name="Tokyo", country="JP")
        post = Post.objects.create(author=user, city=city, title="t", content="c")
        url = reverse("api_toggle_favorite", kwargs={"post_id": post.id})

        res1 = self.client.post(url, {}, format="json")
        self.assertEqual(res1.status_code, 200)
        self.assertTrue(Favorite.objects.filter(user=user, post=post).exists())

        res2 = self.client.post(url, {}, format="json")
        self.assertEqual(res2.status_code, 200)
        self.assertFalse(Favorite.objects.filter(user=user, post=post).exists())


# =========================
# Check-in API Tests
# =========================


class CheckinApiTests(APITestCase):
    """Test cases for check-in related APIs."""
    
    def _auth_as(self, email="c@example.com", username="checkinuser", password="Pass123!@#"):
        """Helper method to authenticate user and set authorization header.
        
        Args:
            email: User email address
            username: Username
            password: User password
            
        Returns:
            Created user instance
        """
        user = User.objects.create_user(username=username, email=email, password=password)
        login_url = reverse("api_login")
        res = self.client.post(login_url, {"email": email, "password": password}, format="json")
        token = res.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return user

    def test_checkin_unique_per_user_and_city(self):
        """Test check-in uniqueness constraint per user and city combination.
        
        Steps:
        1. Authenticate and create a city
        2. Create first check-in - should succeed
        3. Create second check-in for same city - should update existing
        4. Verify only one check-in record exists
        5. Verify note field is updated
        """
        user = self._auth_as()
        city = City.objects.create(name="Paris", country="FR")
        url = reverse("api_create_checkin")

        res1 = self.client.post(url, {"city_id": city.id, "note": "first"}, format="json")
        self.assertEqual(res1.status_code, 201)
        self.assertEqual(Checkin.objects.filter(user=user, city=city).count(), 1)

        res2 = self.client.post(url, {"city_id": city.id, "note": "updated"}, format="json")
        self.assertEqual(res2.status_code, 201)
        self.assertEqual(Checkin.objects.filter(user=user, city=city).count(), 1)
        self.assertEqual(Checkin.objects.get(user=user, city=city).note, "updated")
