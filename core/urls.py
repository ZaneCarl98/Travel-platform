from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('posts/create/', views.create_post, name='create_post'),
    path('posts/<int:post_id>/', views.post_detail, name='post_detail'),
    path('profile/', views.profile_view, name='profile'),
    path('posts/<int:post_id>/like/', views.toggle_like, name='toggle_like'),
    path('posts/<int:post_id>/favorite/', views.toggle_favorite, name='toggle_favorite'),
    path('posts/<int:post_id>/rate/', views.rate_post, name='rate_post'),
    path('posts/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('posts/<int:post_id>/checkin/', views.add_checkin, name='add_checkin'),
    path('footprint/', views.footprint_view, name='footprint'),
    path('cities/<int:city_id>/', views.city_detail, name='city_detail'),
]