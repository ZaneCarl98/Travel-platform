from django.contrib.auth import authenticate, get_user_model
from django.core.paginator import Paginator
from django.db.models import Count, Avg
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import City, Post, PostLike, Favorite, PostRating, Comment, Checkin, Profile
from .utils import geocode_city

User = get_user_model()


# =========================
# Helper Functions
# =========================


def require_auth(request):
    """Check if user is authenticated and return error response if not.
    
    Args:
        request: DRF request object
        
    Returns:
        Response with 401 status if not authenticated, None otherwise
    """
    if not request.user or not request.user.is_authenticated:
        return Response({"message": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    return None


def serialize_user(user, request=None):
    """Convert User object to dictionary with profile information.
    
    Args:
        user: User instance to serialize
        request: Optional request object for building absolute URLs
        
    Returns:
        Dictionary containing user and profile data
    """
    profile, _ = Profile.objects.get_or_create(user=user)

    avatar_url = ""
    if hasattr(profile, 'avatar') and profile.avatar:
        avatar_url = request.build_absolute_uri(profile.avatar.url) if request else profile.avatar.url
    elif getattr(profile, 'avatar_url', ''):
        avatar_url = profile.avatar_url

    display_name = getattr(profile, 'display_name', '') or user.username

    return {
        "id": user.id,
        "email": user.email,
        "display_name": display_name,
        "avatar_url": avatar_url,
        "bio": getattr(profile, 'bio', '') or '',
        "age": getattr(profile, 'age', None),
        "gender": getattr(profile, 'gender', '') or '',
        "mbti": getattr(profile, 'mbti', '') or '',
        "constellation": getattr(profile, 'constellation', '') or '',
        "created_at": user.date_joined.isoformat() if user.date_joined else "",
    }


def serialize_city(city):
    """Convert City object to dictionary.
    
    Args:
        city: City instance to serialize
        
    Returns:
        Dictionary containing city data including coordinates
    """
    return {
        "id": city.id,
        "name": city.name,
        "country": city.country,
        "description": city.description,
        "image_url": city.image_url,
        "latitude": getattr(city, "latitude", None),
        "longitude": getattr(city, "longitude", None),
    }


def serialize_post(post, request=None):
    """Convert Post object to dictionary with related data.
    
    Args:
        post: Post instance to serialize
        request: Optional request object for building absolute URLs
        
    Returns:
        Dictionary containing post data with author, city, ratings, and user interactions
    """
    user = request.user if request and request.user.is_authenticated else None

    average_rating = PostRating.objects.filter(post=post).aggregate(avg=Avg("score"))["avg"]
    likes_count = PostLike.objects.filter(post=post).count()
    favorites_count = Favorite.objects.filter(post=post).count()
    comments_count = Comment.objects.filter(post=post).count()

    is_liked = False
    is_favorited = False
    user_rating = None

    if user:
        is_liked = PostLike.objects.filter(user=user, post=post).exists()
        is_favorited = Favorite.objects.filter(user=user, post=post).exists()
        rating = PostRating.objects.filter(user=user, post=post).first()
        if rating:
            user_rating = rating.score

    images = []
    if getattr(post, "image", None):
        try:
            image_url = request.build_absolute_uri(post.image.url) if request else post.image.url
        except Exception:
            image_url = ""
        images.append({
            "id": post.id,
            "post_id": post.id,
            "image_url": image_url,
            "sort_order": 0,
            "created_at": post.created_at.isoformat() if post.created_at else None,
        })

    return {
        "id": post.id,
        "author_id": post.author.id,
        "city_id": post.city.id,
        "title": post.title,
        "content": post.content,
        "route_text": post.route_text,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
        "author": serialize_user(post.author, request),
        "city": serialize_city(post.city),
        "images": images,
        "likes_count": likes_count,
        "favorites_count": favorites_count,
        "comments_count": comments_count,
        "avg_rating": round(average_rating, 1) if average_rating is not None else None,
        "is_liked": is_liked,
        "is_favorited": is_favorited,
        "user_rating": user_rating,
    }


def serialize_comment(comment, request=None):
    """Convert Comment object to dictionary with user information.
    
    Args:
        comment: Comment instance to serialize
        request: Optional request object for building absolute URLs
        
    Returns:
        Dictionary containing comment data with minimal user info
    """
    return {
        "id": comment.id,
        "post_id": comment.post.id,
        "user_id": comment.user.id,
        "content": comment.content,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
        "user": {
            "id": comment.user.id,
            "display_name": serialize_user(comment.user, request)["display_name"],
            "avatar_url": serialize_user(comment.user, request)["avatar_url"],
        }
    }


def serialize_checkin(checkin):
    """Convert Checkin object to dictionary with city information.
    
    Args:
        checkin: Checkin instance to serialize
        
    Returns:
        Dictionary containing check-in data with associated city
    """
    return {
        "id": checkin.id,
        "user_id": checkin.user.id,
        "city_id": checkin.city.id,
        "post_id": checkin.post.id if checkin.post else None,
        "checkin_date": checkin.checkin_date.isoformat() if checkin.checkin_date else None,
        "note": checkin.note,
        "created_at": checkin.checkin_date.isoformat() if checkin.checkin_date else None,
        "city": serialize_city(checkin.city),
    }


def paginate_queryset(queryset, page, page_size=10):
    """Paginate a queryset and return paginated results.
    
    Args:
        queryset: Django QuerySet to paginate
        page: Page number (1-indexed)
        page_size: Number of items per page (default: 10)
        
    Returns:
        Dictionary with paginated data, total count, and pagination info
    """
    paginator = Paginator(queryset, page_size)
    current_page = paginator.get_page(page)
    return {
        "data": list(current_page.object_list),
        "total": paginator.count,
        "page": current_page.number,
        "page_size": page_size,
    }


# =========================
# Auth APIs
# =========================


@api_view(['POST'])
def api_register(request):
    """Register a new user account.
    
    Required fields: email, password, display_name
    Creates User and Profile instances, returns JWT token
    
    Args:
        request: DRF request object
        
    Returns:
        Response with access token and user data on success,
        error message on failure
    """
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    display_name = request.data.get("display_name", "").strip()

    if not email or not password or not display_name:
        return Response({"message": "email, password and display_name are required"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"message": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=display_name).exists():
        return Response({"message": "Display name already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=display_name,
        email=email,
        password=password
    )

    profile, _ = Profile.objects.get_or_create(user=user)
    if hasattr(profile, 'display_name'):
        profile.display_name = display_name
        profile.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        "token": str(refresh.access_token),
        "user": serialize_user(user, request),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def api_login(request):
    """Authenticate user and return JWT token.
    
    Required fields: email, password
    Uses Django authentication backend
    
    Args:
        request: DRF request object
        
    Returns:
        Response with access token and user data on success,
        error message on invalid credentials
    """
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not email or not password:
        return Response({"message": "email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"message": "Invalid email or password"}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=user_obj.username, password=password)
    if not user:
        return Response({"message": "Invalid email or password"}, status=status.HTTP_400_BAD_REQUEST)

    refresh = RefreshToken.for_user(user)
    return Response({
        "token": str(refresh.access_token),
        "user": serialize_user(user, request),
    })


# =========================
# City APIs
# =========================


@api_view(['GET'])
def api_popular_cities(request):
    """Get top 6 cities ordered by number of posts.
    
    Annotates cities with post count and returns most popular ones.
    
    Args:
        request: DRF request object
        
    Returns:
        List of city objects with basic information
    """
    cities = (
        City.objects.annotate(post_count=Count('post'))
        .order_by('-post_count', 'name')[:6]
    )
    data = [serialize_city(city) for city in cities]
    return Response(data)


@api_view(['GET'])
def api_search_cities(request):
    """Search cities by name.
    
    Query parameter: q (search query, optional)
    Returns all cities if no query provided.
    
    Args:
        request: DRF request object
        
    Returns:
        List of matching city objects
    """
    query = request.GET.get("q", "").strip()
    cities = City.objects.all()

    if query:
        cities = cities.filter(name__icontains=query)

    data = [serialize_city(city) for city in cities]
    return Response(data)


@api_view(['GET'])
def api_city_detail(request, city_id):
    """Get details of a specific city.
    
    Args:
        request: DRF request object
        city_id: Primary key of the city
        
    Returns:
        City object with full details
    """
    city = get_object_or_404(City, id=city_id)
    return Response(serialize_city(city))


@api_view(['GET'])
def api_city_posts(request, city_id):
    """Get posts for a specific city with pagination and sorting.
    
    Args:
        request: DRF request object
        city_id: Primary key of the city
        
    Query parameters:
        sort: 'rating' (default) or 'latest'
        page: Page number (default: 1)
        
    Returns:
        Paginated list of posts for the city
    """
    city = get_object_or_404(City, id=city_id)
    sort = request.GET.get("sort", "rating")
    page = int(request.GET.get("page", 1))

    posts = Post.objects.filter(city=city)

    if sort == "latest":
        posts = posts.order_by("-created_at")
    else:
        posts = posts.annotate(
            average_rating=Avg("postrating__score"),
            like_total=Count("postlike", distinct=True)
        ).order_by("-average_rating", "-like_total", "-created_at")

    paginated = paginate_queryset(posts, page, page_size=10)
    paginated["data"] = [serialize_post(post, request) for post in paginated["data"]]
    return Response(paginated)


# =========================
# Post APIs
# =========================


@api_view(['GET'])
def api_post_detail(request, post_id):
    """Get detailed information about a specific post.
    
    Args:
        request: DRF request object
        post_id: Primary key of the post
        
    Returns:
        Post object with author, city, ratings, and check-in status
    """
    post = get_object_or_404(Post, id=post_id)
    post_data = serialize_post(post, request)

    user_checked_in = False
    if request.user.is_authenticated:
        user_checked_in = Checkin.objects.filter(user=request.user, city=post.city).exists()

    post_data["user_checked_in"] = user_checked_in
    return Response(post_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def api_create_post(request):
    """Create a new travel post.
    
    Authentication required.
    Supports image upload and route information.
    
    Required fields: title, content, city_name
    Optional fields: route_text, route_stops, total_days, images
    
    Auto-creates city if it doesn't exist and geocodes coordinates.
    
    Args:
        request: DRF request object
        
    Returns:
        Created post object on success
    """
    title = request.data.get("title", "").strip()
    content = request.data.get("content", "").strip()
    city_name = request.data.get("city_name", "").strip()
    route_text = request.data.get("route_text", "").strip()
    route_stops = request.data.get("route_stops", "")
    total_days = request.data.get("total_days", "")

    if not title or not content or not city_name:
        return Response({"message": "title, content and city_name are required"}, status=status.HTTP_400_BAD_REQUEST)

    city, created = City.objects.get_or_create(
        name=city_name,
        defaults={
            "country": "",
            "description": "",
            "image_url": "",
            "latitude": None,
            "longitude": None,
        }
    )

    if created or city.latitude is None or city.longitude is None:
        lat, lng = geocode_city(city.name)
        if lat is not None and lng is not None:
            city.latitude = lat
            city.longitude = lng
            city.save()

    full_route_text = route_text
    if route_stops:
        full_route_text += f"\nRoute stops: {route_stops}"
    if total_days:
        full_route_text += f"\nTotal days: {total_days}"

    post = Post.objects.create(
        author=request.user,
        city=city,
        title=title,
        content=content,
        route_text=full_route_text.strip()
    )

    uploaded_images = request.FILES.getlist("images")
    if uploaded_images:
        post.image = uploaded_images[0]
        post.save()

    return Response(serialize_post(post, request), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_toggle_like(request, post_id):
    """Toggle like status on a post.
    
    Authentication required.
    Creates like if not exists, deletes if exists.
    
    Args:
        request: DRF request object
        post_id: Primary key of the post
        
    Returns:
        Current like status and total likes count
    """
    post = get_object_or_404(Post, id=post_id)
    like, created = PostLike.objects.get_or_create(user=request.user, post=post)

    liked = True
    if not created:
        like.delete()
        liked = False

    likes_count = PostLike.objects.filter(post=post).count()
    return Response({
        "liked": liked,
        "likes_count": likes_count,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_toggle_favorite(request, post_id):
    """Toggle favorite status on a post.
    
    Authentication required.
    Creates favorite if not exists, deletes if exists.
    
    Args:
        request: DRF request object
        post_id: Primary key of the post
        
    Returns:
        Current favorite status
    """
    post = get_object_or_404(Post, id=post_id)
    favorite, created = Favorite.objects.get_or_create(user=request.user, post=post)

    favorited = True
    if not created:
        favorite.delete()
        favorited = False

    return Response({
        "favorited": favorited,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_rate_post(request, post_id):
    """Rate a post with score 1-5.
    
    Authentication required.
    Creates or updates rating for the current user.
    
    Args:
        request: DRF request object
        post_id: Primary key of the post
        
    Request data:
        score: Integer between 1 and 5
        
    Returns:
        Average rating and user's rating
    """
    post = get_object_or_404(Post, id=post_id)
    try:
        score = int(request.data.get("score", 0))
    except (TypeError, ValueError):
        score = 0

    if not 1 <= score <= 5:
        return Response({"message": "score must be between 1 and 5"}, status=status.HTTP_400_BAD_REQUEST)

    rating, created = PostRating.objects.get_or_create(
        user=request.user,
        post=post,
        defaults={"score": score}
    )
    if not created:
        rating.score = score
        rating.save()

    avg_rating = PostRating.objects.filter(post=post).aggregate(avg=Avg("score"))["avg"]
    return Response({
        "avg_rating": round(avg_rating, 1) if avg_rating is not None else None,
        "user_rating": score,
    })


@api_view(['GET', 'POST'])
def api_post_comments(request, post_id):
    """Get comments for a post or add a new comment.
    
    GET: Returns paginated comments (no auth required)
    POST: Creates new comment (auth required)
    
    Args:
        request: DRF request object
        post_id: Primary key of the post
        
    Query parameters (GET):
        page: Page number (default: 1)
        
    Request data (POST):
        content: Comment text (required)
        
    Returns:
        GET: Paginated list of comments
        POST: Created comment object
    """
    post = get_object_or_404(Post, id=post_id)

    if request.method == 'GET':
        page = int(request.GET.get("page", 1))
        comments = Comment.objects.filter(post=post).order_by("-created_at")
        paginated = paginate_queryset(comments, page, page_size=10)
        paginated["data"] = [serialize_comment(comment, request) for comment in paginated["data"]]
        return Response(paginated)

    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    content = request.data.get("content", "").strip()
    if not content:
        return Response({"message": "content is required"}, status=status.HTTP_400_BAD_REQUEST)

    comment = Comment.objects.create(
        user=request.user,
        post=post,
        content=content,
    )
    return Response(serialize_comment(comment, request), status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_delete_post(request, post_id):
    """Delete a post (only by author).
    
    Authentication required.
    Users can only delete their own posts.
    
    Args:
        request: DRF request object
        post_id: Primary key of the post to delete
        
    Returns:
        Success message on deletion
    """
    post = get_object_or_404(Post, id=post_id)

    if post.author != request.user:
        return Response({"message": "You can only delete your own posts"}, status=status.HTTP_403_FORBIDDEN)

    post.delete()
    return Response({"message": "Post deleted successfully"}, status=status.HTTP_200_OK)


# =========================
# Profile APIs
# =========================


@api_view(['GET'])
def api_user_profile(request, user_id):
    """Get user profile information.
    
    Args:
        request: DRF request object
        user_id: Primary key of the user
        
    Returns:
        User object with profile data
    """
    user = get_object_or_404(User, id=user_id)
    return Response(serialize_user(user, request))


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def api_update_profile(request):
    """Update current user's profile information.
    
    Authentication required.
    Supports partial updates (PATCH) and full updates (PUT).
    Handles avatar image upload.
    
    Updatable fields:
        display_name, bio, age, gender, mbti, constellation, avatar
    
    Args:
        request: DRF request object
        
    Returns:
        Updated user object with profile data
    """
    user = request.user
    profile, _ = Profile.objects.get_or_create(user=user)

    display_name = request.data.get('display_name')
    bio = request.data.get('bio')
    age = request.data.get('age')
    gender = request.data.get('gender')
    mbti = request.data.get('mbti')
    constellation = request.data.get('constellation')
    avatar = request.FILES.get('avatar')

    if display_name is not None:
      display_name = display_name.strip()
      if display_name:
          if hasattr(profile, 'display_name'):
              profile.display_name = display_name
          else:
              user.username = display_name

    if bio is not None and hasattr(profile, 'bio'):
        profile.bio = bio

    if age is not None and hasattr(profile, 'age'):
        profile.age = int(age) if str(age).strip() else None

    if gender is not None and hasattr(profile, 'gender'):
        profile.gender = gender

    if mbti is not None and hasattr(profile, 'mbti'):
        profile.mbti = mbti

    if constellation is not None and hasattr(profile, 'constellation'):
        profile.constellation = constellation

    if avatar:
        if hasattr(profile, 'avatar'):
            profile.avatar = avatar
        elif hasattr(profile, 'avatar_url'):
            pass

    user.save()
    profile.save()

    return Response(serialize_user(user, request))


@api_view(['GET'])
def api_user_posts(request, user_id):
    """Get all posts by a specific user.
    
    Args:
        request: DRF request object
        user_id: Primary key of the user
        
    Returns:
        List of posts authored by the user, ordered by creation date
    """
    user = get_object_or_404(User, id=user_id)
    posts = (
        Post.objects.filter(author=user)
        .select_related('author', 'city')
        .order_by('-created_at')
    )
    return Response([serialize_post(post, request) for post in posts])


@api_view(['GET'])
def api_user_favorites(request, user_id):
    """Get all posts favorited by a specific user.
    
    Args:
        request: DRF request object
        user_id: Primary key of the user
        
    Returns:
        List of favorited posts ordered by favorite creation date
    """
    user = get_object_or_404(User, id=user_id)
    favorites = (
        Favorite.objects.filter(user=user)
        .select_related('post', 'post__author', 'post__city')
        .order_by('-created_at')
    )
    return Response([serialize_post(favorite.post, request) for favorite in favorites if favorite.post_id])


# =========================
# Check-in APIs
# =========================


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_create_checkin(request):
    """Create a check-in at a city.
    
    Authentication required.
    Records user's visit to a city with optional note and post reference.
    
    Required fields: city_id
    Optional fields: post_id, note
    
    Args:
        request: DRF request object
        
    Request data:
        city_id: Primary key of the city
        post_id: Optional primary key of associated post
        note: Optional note about the check-in
        
    Returns:
        Created check-in object with city information
    """
    city_id = request.data.get("city_id")
    post_id = request.data.get("post_id")
    note = request.data.get("note", "")

    if not city_id:
        return Response({"message": "city_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    city = get_object_or_404(City, id=city_id)
    post = None
    if post_id:
        post = get_object_or_404(Post, id=post_id)

    checkin, created = Checkin.objects.get_or_create(
        user=request.user,
        city=city,
        defaults={
            "post": post,
            "note": note,
        }
    )

    if not created:
        if post:
            checkin.post = post
        if note:
            checkin.note = note
        checkin.save()

    return Response(serialize_checkin(checkin), status=status.HTTP_201_CREATED)


@api_view(['GET'])
def api_user_checkins(request, user_id):
    """Get all check-ins for a specific user.
    
    Args:
        request: DRF request object
        user_id: Primary key of the user
        
    Returns:
        List of user's check-ins with city information, ordered by date
    """
    user = get_object_or_404(User, id=user_id)
    checkins = Checkin.objects.filter(user=user).select_related("city", "post").order_by("-checkin_date")
    data = [serialize_checkin(checkin) for checkin in checkins]
    return Response(data)