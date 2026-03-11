from django import forms
from django.contrib.auth.models import User
from .models import Post, Profile, Comment


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['city', 'title', 'content', 'route_text', 'image']


class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'email']


class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['avatar_url', 'bio']

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['content']