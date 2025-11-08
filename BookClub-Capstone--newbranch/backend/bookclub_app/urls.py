# bookclub_app/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.user_login, name='login'),
    path('auth/logout/', views.user_logout, name='logout'),
    path('auth/user/', views.get_user, name='get_user'),
    path('check-username/', views.check_username, name='check-username'),

    # Books
    path('books/', views.book_list, name='book-list'),
    path('books/<int:pk>/', views.book_detail, name='book-detail'),

    # Groups
    path('groups/', views.group_list_create, name='group-list-create'),
    path('groups/<int:pk>/join/', views.join_group, name='join-group'),
    path('groups/<int:pk>/leave/', views.leave_group, name='leave-group'),
    path('groups/<int:group_id>/', views.group_detail, name='group-detail'),
    path('groups/<int:group_id>/discussion/', views.group_discussion, name='group-discussion'),
    path('groups/<int:group_id>/progress/', views.reading_progress, name='reading-progress'),
    path('groups/<int:group_id>/progress-stats/', views.group_progress_stats, name='group-progress-stats'),
    
    # Chapter Schedules
    path('groups/<int:group_id>/chapters/', views.get_group_chapters, name='group-chapters'),
    path('groups/<int:group_id>/chapter-schedules/', views.chapter_schedule_list, name='chapter-schedule-list'),
    path('groups/<int:group_id>/chapter-schedules/<int:schedule_id>/', views.chapter_schedule_detail, name='chapter-schedule-detail'),
    
    # Reading Progress
    path('reading-progress/', views.reading_progress_list, name='reading-progress-list'),
    
    # Comments
    path('posts/<int:post_id>/comments/', views.add_comment, name='add-comment'),
    path('posts/<int:post_id>/reactions/', views.toggle_reaction, name='toggle-reaction'),
]