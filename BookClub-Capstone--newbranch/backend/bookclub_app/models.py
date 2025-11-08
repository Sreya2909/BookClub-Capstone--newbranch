# Create your models here.
# bookclub_app/models.py
from django.db import models
from django.contrib.auth.models import User

class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    genre = models.CharField(max_length=100)
    description = models.TextField()
    total_pages = models.PositiveIntegerField()
    total_chapters = models.PositiveIntegerField()
    cover_image = models.CharField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.title

class Chapter(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='chapters')
    chapter_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)

    class Meta:
        ordering = ['chapter_number']

class ReadingGroup(models.Model):
    name = models.CharField(max_length=255)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def member_count(self):
        return self.memberships.count()

    @property
    def is_full(self):
        return self.member_count >= 10

    def __str__(self):
        return f"{self.name} ({self.book.title})"

class GroupMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(ReadingGroup, on_delete=models.CASCADE, related_name='memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'group')

class DiscussionPost(models.Model):
    group = models.ForeignKey(ReadingGroup, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    post = models.ForeignKey(DiscussionPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Reaction(models.Model):
    """Emoji reaction on a discussion post by a user."""
    post = models.ForeignKey(DiscussionPost, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user', 'emoji')

    def __str__(self):
        return f"{self.user.username} reacted {self.emoji} on post {self.post.id}"
class ReadingProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    group = models.ForeignKey(ReadingGroup, on_delete=models.CASCADE, null=True, blank=True)
    reading_speed_minutes = models.IntegerField(default=1, help_text='Minutes per page')
    current_page = models.IntegerField(default=1)
    current_chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, blank=True)
    chapter_deadline = models.DateField(null=True, blank=True)
    chapter_status = models.CharField(
        max_length=20,
        choices=[('in_progress', 'In Progress'), ('completed', 'Completed')],
        default='in_progress'
    )
    last_read_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'book', 'group')

class ChapterSchedule(models.Model):
    """Personal chapter completion schedule for each user in a group"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(ReadingGroup, on_delete=models.CASCADE)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)
    target_completion_date = models.DateField()
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'group', 'chapter')
        ordering = ['chapter__chapter_number']

    def __str__(self):
        return f"{self.user.username} - {self.chapter.title} - {self.target_completion_date}"