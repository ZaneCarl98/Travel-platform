from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from .models import City, Post, Profile, PostLike, Favorite, PostRating, Comment, Checkin
from .forms import PostForm, UserUpdateForm, ProfileUpdateForm, CommentForm
from django.db.models import Avg, Count

def home(request):
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
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = UserCreationForm()
    return render(request, 'register.html', {'form': form})

def login_view(request):
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
    logout(request)
    return redirect('home')

@login_required
def create_post(request):
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
def profile_view(request):
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

    return render(request, 'profile.html', {
        'user_form': user_form,
        'profile_form': profile_form,
    })

@login_required
def toggle_like(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    like, created = PostLike.objects.get_or_create(user=request.user, post=post)

    if not created:
        like.delete()

    return redirect('post_detail', post_id=post.id)

@login_required
def toggle_favorite(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    favorite, created = Favorite.objects.get_or_create(user=request.user, post=post)

    if not created:
        favorite.delete()

    return redirect('post_detail', post_id=post.id)

@login_required
def rate_post(request, post_id):
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
    post = get_object_or_404(Post, id=post_id)
    Checkin.objects.get_or_create(
        user=request.user,
        city=post.city,
        defaults={'post': post}
    )
    return redirect('post_detail', post_id=post.id)


@login_required
def footprint_view(request):
    checkins = Checkin.objects.filter(user=request.user).select_related('city', 'post').order_by('-checkin_date')
    return render(request, 'footprint.html', {'checkins': checkins})

def city_detail(request, city_id):
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