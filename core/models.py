from django.db import models
from django.contrib.auth.models import User


class City(models.Model):
    """Model representing a city with geographic and descriptive information."""

    # Basic city information
    name = models.CharField(max_length=100)  # Name of the city
    country = models.CharField(max_length=100)  # Country where the city is located
    description = models.TextField(blank=True)  # Detailed description of the city
    image_url = models.URLField(blank=True)  # URL to the city's image

    # Geographic coordinates for map display
    latitude = models.FloatField(blank=True, null=True)  # Latitude coordinate
    longitude = models.FloatField(blank=True, null=True)  # Longitude coordinate

    def __str__(self):
        return self.name


class Post(models.Model):
    """Model representing a travel post created by users about a city."""

    # Post authorship and location
    author = models.ForeignKey(User, on_delete=models.CASCADE)  # User who created the post
    city = models.ForeignKey(City, on_delete=models.CASCADE)  # City associated with the post

    # Post content
    title = models.CharField(max_length=200)  # Title of the post
    content = models.TextField()  # Main content of the post
    route_text = models.TextField(blank=True)  # Travel route description
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)  # Post image

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)  # Creation timestamp
    updated_at = models.DateTimeField(auto_now=True)  # Last update timestamp

    def __str__(self):
        return self.title


class PostLike(models.Model):
    """Model representing a user's like on a post."""

    # Like relationship
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # User who liked the post
    post = models.ForeignKey(Post, on_delete=models.CASCADE)  # Post that was liked
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when the like was created

    class Meta:
        unique_together = ('user', 'post')  # Ensure one like per user per post

    def __str__(self):
        return f"{self.user.username} likes {self.post.title}"


class Favorite(models.Model):
    """Model representing a user's favorite post."""

    # Favorite relationship
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # User who favorited the post
    post = models.ForeignKey(Post, on_delete=models.CASCADE)  # Post that was favorited
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when the favorite was created

    class Meta:
        unique_together = ('user', 'post')  # Ensure one favorite per user per post

    def __str__(self):
        return f"{self.user.username} favorited {self.post.title}"


class PostRating(models.Model):
    """Model representing a user's rating score for a post."""

    # Rating relationship
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # User who rated the post
    post = models.ForeignKey(Post, on_delete=models.CASCADE)  # Post that was rated
    score = models.IntegerField()  # Rating score value
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when the rating was created

    class Meta:
        unique_together = ('user', 'post')  # Ensure one rating per user per post

    def __str__(self):
        return f"{self.user.username} rated {self.post.title} ({self.score})"


class Comment(models.Model):
    """Model representing a comment on a post."""

    # Comment relationship
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # User who made the comment
    post = models.ForeignKey(Post, on_delete=models.CASCADE)  # Post being commented on
    content = models.TextField()  # Comment text content
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when the comment was created

    def __str__(self):
        return f"{self.user.username} commented on {self.post.title}"


class Checkin(models.Model):
    """Model representing a user's check-in at a city."""

    # Check-in information
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # User who checked in
    city = models.ForeignKey(City, on_delete=models.CASCADE)  # City where user checked in
    post = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True,
                             blank=True)  # Optional post associated with check-in
    checkin_date = models.DateTimeField(auto_now_add=True)  # Timestamp of check-in
    note = models.CharField(max_length=300, blank=True)  # Optional note for the check-in

    class Meta:
        unique_together = ('user', 'city')  # Ensure one check-in per user per city

    def __str__(self):
        return f"{self.user.username} checked in at {self.city.name}"


class Profile(models.Model):
    """Model representing extended user profile information."""

    # Profile association
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Linked User account

    # Profile display information
    display_name = models.CharField(max_length=100, blank=True)  # Display name for the profile
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)  # Avatar image file
    avatar_url = models.URLField(blank=True)  # Alternative avatar URL
    bio = models.TextField(blank=True)  # Personal biography/description

    # Personal attributes
    age = models.PositiveIntegerField(blank=True, null=True)  # User's age
    gender = models.CharField(max_length=20, blank=True)  # User's gender
    mbti = models.CharField(max_length=10, blank=True)  # MBTI personality type
    constellation = models.CharField(max_length=20, blank=True)  # Astrological constellation

    def __str__(self):
        return self.display_name or self.user.username
