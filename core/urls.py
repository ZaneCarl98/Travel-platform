from django.urls import path
from . import views
from . import api_views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path('posts/create/', views.create_post, name='create_post'),
    path('posts/<int:post_id>/', views.post_detail, name='post_detail'),
    path('posts/<int:post_id>/edit/', views.edit_post, name='edit_post'),
    path('posts/<int:post_id>/delete/', views.delete_post, name='delete_post'),
    path('posts/<int:post_id>/like/', views.toggle_like, name='toggle_like'),
    path('posts/<int:post_id>/favorite/', views.toggle_favorite, name='toggle_favorite'),
    path('posts/<int:post_id>/rate/', views.rate_post, name='rate_post'),
    path('posts/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('posts/<int:post_id>/checkin/', views.add_checkin, name='add_checkin'),

    path('profile/', views.profile_view, name='profile'),
    path('footprint/', views.footprint_view, name='footprint'),
    path('cities/<int:city_id>/', views.city_detail, name='city_detail'),

    path('api/users/<int:user_id>/posts', api_views.api_user_posts, name='api_user_posts'),
    path('api/users/<int:user_id>/favorites', api_views.api_user_favorites, name='api_user_favorites'),

    # API - auth
    path('api/auth/login', api_views.api_login, name='api_login'),
    path('api/auth/register', api_views.api_register, name='api_register'),

    # API - city
    path('api/cities/popular', api_views.api_popular_cities, name='api_popular_cities'),
    path('api/cities/search', api_views.api_search_cities, name='api_search_cities'),
    path('api/cities/<int:city_id>', api_views.api_city_detail, name='api_city_detail'),
    path('api/cities/<int:city_id>/posts', api_views.api_city_posts, name='api_city_posts'),

    # API - post
    path('api/posts', api_views.api_create_post, name='api_create_post'),
    path('api/posts/<int:post_id>', api_views.api_post_detail, name='api_post_detail'),
    path('api/posts/<int:post_id>/like', api_views.api_toggle_like, name='api_toggle_like'),
    path('api/posts/<int:post_id>/favorite', api_views.api_toggle_favorite, name='api_toggle_favorite'),
    path('api/posts/<int:post_id>/rate', api_views.api_rate_post, name='api_rate_post'),
    path('api/posts/<int:post_id>/comments', api_views.api_post_comments, name='api_post_comments'),
    path('api/posts/<int:post_id>/delete', api_views.api_delete_post, name='api_delete_post'),

    # API - profile
    path('api/users/<int:user_id>/profile', api_views.api_user_profile, name='api_user_profile'),
    path('api/users/profile', api_views.api_update_profile, name='api_update_profile'),

    # API - checkin
    path('api/checkins', api_views.api_create_checkin, name='api_create_checkin'),
    path('api/users/<int:user_id>/checkins', api_views.api_user_checkins, name='api_user_checkins'),

]