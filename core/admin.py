from django.contrib import admin
from .models import City, Post, Profile, PostLike, Favorite, PostRating, Comment, Checkin

admin.site.register(City)
admin.site.register(Post)
admin.site.register(Profile)
admin.site.register(PostLike)
admin.site.register(Favorite)
admin.site.register(PostRating)
admin.site.register(Comment)
admin.site.register(Checkin)