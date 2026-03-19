from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count

from .models import (
    City,
    Post,
    Profile,
    PostLike,
    Favorite,
    PostRating,
    Comment,
    Checkin,
)
from .forms import (
    PostForm,
    UserUpdateForm,
    ProfileUpdateForm,
    CommentForm,
)


# =========================
# Home & Auth Views
# =========================


def home(request):
    """Render home page with cities and posts, supporting search functionality.
    
    Args:
        request: HTTP request object
        
    Returns:
        Rendered home.html template with cities, posts, and search query
    """
    query = request.GET.get('search', '')

    cities = City.objects.all()
    posts = Post.objects.all().order_by('-created_at')

    if query:
        cities = cities.filter(name__icontains=query)
        posts = posts.filter(city__name__icontains=query)

    return render(request, 'home.html', {
        'cities': cities,
        'posts': posts,
        'query': query,
    })


def register_view(request):
    """Handle user registration with Django's built-in UserCreationForm.
    
    Args:
        request: HTTP request object
        
    Returns:
        Rendered register.html template with registration form
    """
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = UserCreationForm()
    return render(request, 'register.html', {'form': form})


def login_view(request):
    """Handle user login with Django's built-in AuthenticationForm.
    
    Args:
        request: HTTP request object
        
    Returns:
        Rendered login.html template with authentication form
    """
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('home')
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})


def logout_view(request):
    """Log out current user and redirect to home page.
    
    Args:
        request: HTTP request object
        
    Returns:
        Redirect to home page
    """
    logout(request)
    return redirect('home')


# =========================
# Post Management Views
# =========================


@login_required
def create_post(request):
    """Create a new travel post (requires authentication).
    
    Args:
        request: HTTP request object
        
    Returns:
        Rendered create_post.html template with post form
    """
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            return redirect('home')
    else:
        form = PostForm()
    return render(request, 'create_post.html', {'form': form})


def post_detail(request, post_id):
    """Display detailed information about a specific post.
    
    Args:
        request: HTTP request object
        post_id: Primary key of the post
        
    Returns:
        Rendered post_detail.html template with post details, ratings,
        comments, and user interaction status
    """
    post = get_object_or_404(Post, id=post_id)
    like_count = PostLike.objects.filter(post=post).count()
    favorite_count = Favorite.objects.filter(post=post).count()

    ratings = PostRating.objects.filter(post=post)
    rating_count = ratings.count()
    average_rating = 0
    if rating_count > 0:
        average_rating = sum(r.score for r in ratings) / rating_count

    comments = Comment.objects.filter(post=post).order_by('-created_at')
    comment_form = CommentForm()

    user_liked = False
    user_favorited = False
    user_rating = None
    user_checked_in = False

    if request.user.is_authenticated:
        user_liked = PostLike.objects.filter(user=request.user, post=post).exists()
        user_favorited = Favorite.objects.filter(user=request.user, post=post).exists()
        existing_rating = PostRating.objects.filter(user=request.user, post=post).first()
        if existing_rating:
            user_rating = existing_rating.score
        user_checked_in = Checkin.objects.filter(user=request.user, city=post.city).exists()

    return render(request, 'post_detail.html', {
        'post': post,
        'like_count': like_count,
        'favorite_count': favorite_count,
        'user_liked': user_liked,
        'user_favorited': user_favorited,
        'average_rating': average_rating,
        'rating_count': rating_count,
        'user_rating': user_rating,
        'comments': comments,
        'comment_form': comment_form,
        'user_checked_in': user_checked_in,
    })


@login_required
def toggle_like(request, post_id):
    """Toggle like status on a post (requires authentication).
    
    Creates a like if it doesn't exist, deletes it if it does.
    
    Args:
        request: HTTP request object
        post_id: Primary key of the post
        
    Returns:
        Redirect to post detail page
    """
    post = get_object_or_404(Post, id=post_id)
    like, created = PostLike.objects.get_or_create(user=request.user, post=post)

    if not created:
        like.delete()

    return redirect('post_detail', post_id=post.id)


@login_required
def toggle_favorite(request, post_id):
    """Toggle favorite status on a post (requires authentication).
    
    Creates a favorite if it doesn't exist, deletes it if it does.
    
    Args:
        request: HTTP request object
        post_id: Primary key of the post
        
    Returns:
        Redirect to post detail page
    """
    post = get_object_or_404(Post, id=post_id)
    favorite, created = Favorite.objects.get_or_create(user=request.user, post=post)

    if not created:
        favorite.delete()

    return redirect('post_detail', post_id=post.id)


@login_required
def rate_post(request, post_id):
    """Rate a post with score 1-5 (requires authentication).
    
    Creates or updates rating for the current user.
    
    Args:
        request: HTTP request object
        post_id: Primary key of the post
        
    Returns:
        Redirect to post detail page
    """
    post = get_object_or_404(Post, id=post_id)

    if request.method == 'POST':
        score = int(request.POST.get('score', 0))
        if 1 <= score <= 5:
            rating, created = PostRating.objects.get_or_create(
                user=request.user,
                post=post,
                defaults={'score': score}
            )
            if not created:
                rating.score = score
                rating.save()

    return redirect('post_detail', post_id=post.id)


@login_required
def add_comment(request, post_id):
    """Add a comment to a post (requires authentication).
    
    Args:
        request: HTTP request object
        post_id: Primary key of the post
        
    Returns:
        Redirect to post detail page
    """
    post = get_object_or_404(Post, id=post_id)

    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.user = request.user
            comment.post = post
            comment.save()

    return redirect('post_detail', post_id=post.id)


@login_required
def add_checkin(request, post_id):
    """Check in at a city associated with a post (requires authentication).
    
    Creates a check-in record for the current user at the post's city.
    
    Args:
        request: HTTP request object
        post_id: Primary key of the post
        
    Returns:
        Redirect to post detail page
    """
    post = get_object_or_404(Post, id=post_id)
    Checkin.objects.get_or_create(
        user=request.user,
        city=post.city,
        defaults={'post': post}
    )
    return redirect('post_detail', post_id=post.id)


# =========================
# User Profile & Footprint Views
# =========================


@login_required
def footprint_view(request):
    """Display user's travel footprint with all check-ins (requires authentication).
    
    Args:
        request: HTTP request object
        
    Returns:
        Rendered footprint.html template with user's check-in history
    """
    checkins = Checkin.objects.filter(user=request.user).select_related('city', 'post').order_by('-checkin_date')
    return render(request, 'footprint.html', {'checkins': checkins})


@login_required
def profile_view(request):
    """Display and update user profile (requires authentication).
    
    Shows user's posts, favorites, and check-ins along with profile edit form.
    
    Args:
        request: HTTP request object
        
    Returns:
        Rendered profile.html template with profile forms and user data
    """
    profile, created = Profile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        user_form = UserUpdateForm(request.POST, instance=request.user)
        profile_form = ProfileUpdateForm(request.POST, instance=profile)

        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            return redirect('profile')
    else:
        user_form = UserUpdateForm(instance=request.user)
        profile_form = ProfileUpdateForm(instance=profile)

    my_posts = Post.objects.filter(author=request.user).order_by('-created_at')
    my_favorites = Favorite.objects.filter(user=request.user).select_related('post', 'post__city').order_by('-created_at')
    my_checkins = Checkin.objects.filter(user=request.user).select_related('city').order_by('-checkin_date')

    return render(request, 'profile.html', {
        'user_form': user_form,
        'profile_form': profile_form,
        'my_posts': my_posts,
        'my_favorites': my_favorites,
        'my_checkins': my_checkins,
    })


# =========================
# City & Post Management Views
# =========================


def city_detail(request, city_id):
    """Display city details with associated posts sorted by rating.
    
    Args:
        request: HTTP request object
        city_id: Primary key of the city
        
    Returns:
        Rendered city_detail.html template with city info and posts
    """
    city = get_object_or_404(City, id=city_id)

    posts = (
        Post.objects.filter(city=city)
        .annotate(
            average_rating=Avg('postrating__score'),
            like_total=Count('postlike', distinct=True)
        )
        .order_by('-average_rating', '-like_total', '-created_at')
    )

    return render(request, 'city_detail.html', {
        'city': city,
        'posts': posts,
    })


@login_required
def edit_post(request, post_id):
    """Edit an existing post (requires authentication and ownership).
    
    Only the post author can edit the post.
    
    Args:
        request: HTTP request object
        post_id: Primary key of the post
        
    Returns:
        Rendered edit_post.html template with post form
    """
    post = get_object_or_404(Post, id=post_id, author=request.user)

    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES, instance=post)
        if form.is_valid():
            form.save()
            return redirect('post_detail', post_id=post.id)
    else:
        form = PostForm(instance=post)

    return render(request, 'edit_post.html', {
        'form': form,
        'post': post,
    })


@login_required
def delete_post(request, post_id):
    """Delete a post (requires authentication and ownership).
    
    Only the post author can delete the post.
    
    Args:
        request: HTTP request object
        post_id: Primary key of the post
        
    Returns:
        Rendered delete_post.html template or redirect to profile after deletion
    """
    post = get_object_or_404(Post, id=post_id, author=request.user)

    if request.method == 'POST':
        post.delete()
        return redirect('profile')

    return render(request, 'delete_post.html', {
        'post': post,
    })