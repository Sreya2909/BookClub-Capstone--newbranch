
# Register your models here.
# bookclub_app/admin.py
from django.contrib import admin
from .models import Book, Chapter, ReadingGroup, GroupMembership, DiscussionPost, Comment

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'genre', 'total_chapters']

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ['book', 'chapter_number', 'title']
    list_filter = ['book']

@admin.register(ReadingGroup)
class ReadingGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'book', 'creator', 'start_date', 'end_date', 'member_count']
    list_filter = ['book', 'creator']

@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'group', 'joined_at']
    list_filter = ['group']

@admin.register(DiscussionPost)
class DiscussionPostAdmin(admin.ModelAdmin):
    list_display = ['group', 'author', 'chapter', 'created_at']
    list_filter = ['group']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['post', 'author', 'created_at']