# bookclub_app/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Book, DiscussionPost, ReadingGroup, Comment, ReadingProgress, Chapter, ChapterSchedule, Reaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'genre', 'description', 'total_pages', 'total_chapters', 'cover_image']

class ReadingGroupSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    creator_name = serializers.CharField(source='creator.username', read_only=True)

    class Meta:
        model = ReadingGroup
        fields = [
            'id', 'name', 'book', 'book_title', 'creator', 'creator_name',
            'start_date', 'end_date', 'member_count', 'is_full'
        ]
        read_only_fields = ['creator']

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("End date must be after start date.")
        return data
    
# Add to serializers.py
class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'author', 'author_name', 'content', 'created_at']
        read_only_fields = ['author', 'post']


class ReactionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Reaction
        fields = ['id', 'post', 'user', 'user_name', 'emoji', 'created_at']
        read_only_fields = ['user', 'post', 'created_at']

class DiscussionPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)

    class Meta:
        model = DiscussionPost
        fields = [
            'id', 'group', 'author', 'author_name', 'chapter', 'chapter_title',
            'content', 'created_at', 'comments', 'reactions'
        ]
        read_only_fields = ['author', 'group']
        # Make chapter optional
        extra_kwargs = {
            'chapter': {'required': False, 'allow_null': True}
        }

class ReadingProgressSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    chapter_title = serializers.CharField(source='current_chapter.title', read_only=True, allow_null=True)
    book_details = BookSerializer(source='book', read_only=True)

    class Meta:
        model = ReadingProgress
        fields = [
            'id', 'user', 'book', 'book_title', 'book_details', 'group', 'reading_speed_minutes',
            'current_page', 'current_chapter', 'chapter_title', 'chapter_deadline',
            'chapter_status', 'last_read_at', 'created_at'
        ]
        read_only_fields = ['user', 'last_read_at', 'created_at']
        extra_kwargs = {
            'current_chapter': {'required': False, 'allow_null': True},
            'chapter_deadline': {'required': False, 'allow_null': True}
        }

class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['id', 'chapter_number', 'title', 'book']

class ChapterScheduleSerializer(serializers.ModelSerializer):
    chapter_number = serializers.IntegerField(source='chapter.chapter_number', read_only=True)
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)
    
    class Meta:
        model = ChapterSchedule
        fields = [
            'id', 'user', 'group', 'chapter', 'chapter_number', 'chapter_title',
            'target_completion_date', 'completed', 'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'completed_at', 'created_at', 'updated_at']