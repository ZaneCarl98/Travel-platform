from django import forms
from django.contrib.auth.models import User
from .models import Post, Profile, Comment


class PostForm(forms.ModelForm):
    """Form for creating and updating travel posts."""

    class Meta:
        model = Post  # Bind to Post model
        fields = ['city', 'title', 'content', 'route_text', 'image']  # Fields to include in the form


class UserUpdateForm(forms.ModelForm):
    """Form for updating user account information."""

    class Meta:
        model = User  # Bind to User model
        fields = ['username', 'email']  # Editable user fields


class ProfileUpdateForm(forms.ModelForm):
    """Form for updating user profile information."""

    class Meta:
        model = Profile  # Bind to Profile model
        fields = ['avatar_url', 'bio']  # Editable profile fields


class CommentForm(forms.ModelForm):
    """Form for adding comments to posts."""

    class Meta:
        model = Comment  # Bind to Comment model
        fields = ['content']  # Comment content field only
