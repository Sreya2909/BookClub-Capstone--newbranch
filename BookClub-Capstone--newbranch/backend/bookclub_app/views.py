from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils.dateparse import parse_date

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Book, DiscussionPost, ReadingGroup, GroupMembership, ReadingProgress, Chapter, ChapterSchedule, Reaction
from .serializers import (
    DiscussionPostSerializer,
    UserSerializer,
    BookSerializer,
    ReadingGroupSerializer,
    ReadingProgressSerializer,
    ChapterSerializer,
    ChapterScheduleSerializer,
)
import re

# ==== AUTH ====

@api_view(["GET"])
@permission_classes([AllowAny])
def check_username(request):
    """Check if username is available."""
    username = request.GET.get("username")
    
    if not username:
        return Response(
            {"error": "Username parameter required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    # Check if username exists
    is_available = not User.objects.filter(username=username).exists()
    
    return Response({
        "username": username,
        "available": is_available
    })


def validate_password_strength(password):
    """Validate password meets all requirements."""
    errors = []
    
    if len(password) < 6:
        errors.append("Password must be at least 6 characters long")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'[0-9]', password):
        errors.append("Password must contain at least one number")
    
    if not (re.search(r'[a-zA-Z]', password) and re.search(r'[0-9]', password)):
        errors.append("Password must contain both letters and numbers")
    
    # Check for 3 or more consecutive same digits
    if re.search(r'(\d)\1{2,}', password):
        errors.append("Password cannot contain consecutive repeating digits (e.g., 111, 222)")
    
    return errors

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user with validation."""
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate username length
    if len(username) < 3:
        return Response(
            {"username": ["Username must be at least 3 characters long"]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {"username": ["Username already taken"]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate password strength
    password_errors = validate_password_strength(password)
    if password_errors:
        return Response(
            {"password": password_errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(username=username, password=password)
    return Response(
        {"message": "User created successfully. Please log in."}, 
        status=status.HTTP_201_CREATED
    )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def user_login(request):
    """User login endpoint."""
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(username=username, password=password)

    if user:
        login(request, user)
        return Response(UserSerializer(user).data)

    return Response(
        {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """Logout current user."""
    logout(request)
    return Response({"message": "Logged out"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user(request):
    """Fetch current logged-in user details."""
    return Response(UserSerializer(request.user).data)


# ==== BOOKS ====

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def book_list(request):
    """List or search for books."""
    query = request.GET.get("search", "")
    genre = request.GET.get("genre", "")
    books = Book.objects.all()

    if query:
        books = books.filter(Q(title__icontains=query) | Q(author__icontains=query))
    if genre:
        books = books.filter(genre__iexact=genre)

    return Response(BookSerializer(books, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def book_detail(request, pk):
    """Get book details and available groups."""
    try:
        book = Book.objects.prefetch_related("readinggroup_set").get(pk=pk)
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

    available_groups = book.readinggroup_set.filter(memberships__isnull=False).distinct()
    available_groups = [g for g in available_groups if not g.is_full]

    data = BookSerializer(book).data
    data["available_groups"] = ReadingGroupSerializer(available_groups, many=True).data
    return Response(data)


# ==== GROUPS ====

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_list_create(request):
    """List or create reading groups."""
    if request.method == "POST":
        serializer = ReadingGroupSerializer(data=request.data)
        if serializer.is_valid():
            # Save the group with the creator
            group = serializer.save(creator=request.user)
            # Automatically add creator as a member
            GroupMembership.objects.create(user=request.user, group=group)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # GET: list user's groups
    user_groups = ReadingGroup.objects.filter(memberships__user=request.user)
    return Response(ReadingGroupSerializer(user_groups, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_group(request, pk):
    """Join a reading group."""
    try:
        group = ReadingGroup.objects.get(pk=pk)
    except ReadingGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

    if group.is_full:
        return Response({"error": "Group is full"}, status=status.HTTP_400_BAD_REQUEST)

    if GroupMembership.objects.filter(user=request.user, group=group).exists():
        return Response({"error": "Already a member"}, status=status.HTTP_400_BAD_REQUEST)

    GroupMembership.objects.create(user=request.user, group=group)
    return Response({"message": "Joined group successfully"})


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def leave_group(request, pk):
    """Leave a reading group."""
    try:
        group = ReadingGroup.objects.get(pk=pk)
    except ReadingGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if user is a member
    try:
        membership = GroupMembership.objects.get(user=request.user, group=group)
    except GroupMembership.DoesNotExist:
        return Response({"error": "Not a member of this group"}, status=status.HTTP_400_BAD_REQUEST)

    # Prevent creator from leaving if there are other members
    if group.creator == request.user and group.member_count > 1:
        return Response(
            {"error": "As the group creator, you cannot leave while other members are present. Transfer ownership or wait for others to leave first."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Delete membership and related reading progress
    membership.delete()
    
    # Also delete the user's reading progress for this group
    ReadingProgress.objects.filter(user=request.user, group=group).delete()
    
    return Response({"message": "Left group successfully"})


# ==== DISCUSSIONS ====

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_discussion(request, group_id):
    """
    List or create discussion posts in a group.
    Automatically attaches group and user to new posts.
    """
    group = get_object_or_404(ReadingGroup, id=group_id)

    # Check if user is a member
    if not GroupMembership.objects.filter(group=group, user=request.user).exists():
        return Response(
            {"error": "Not a member of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "POST":
        # Automatically assign author and group
        serializer = DiscussionPostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user, group=group)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # GET: list all posts for the group
    posts = DiscussionPost.objects.filter(group=group).prefetch_related("comments", "reactions")
    return Response(DiscussionPostSerializer(posts, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_comment(request, post_id):
    """Add a comment/reply to a discussion post."""
    try:
        post = DiscussionPost.objects.get(id=post_id)
    except DiscussionPost.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if user is a member of the post's group
    if not GroupMembership.objects.filter(group=post.group, user=request.user).exists():
        return Response(
            {"error": "Not a member of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Create comment
    from .serializers import CommentSerializer
    serializer = CommentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(author=request.user, post=post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_reaction(request, post_id):
    """Toggle an emoji reaction for the authenticated user on a discussion post.
    If the same emoji reaction exists from the user it will be removed, otherwise it will be added.
    Returns the updated list of reactions for the post.
    """
    try:
        post = DiscussionPost.objects.get(id=post_id)
    except DiscussionPost.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check membership
    if not GroupMembership.objects.filter(group=post.group, user=request.user).exists():
        return Response({"error": "Not a member of this group"}, status=status.HTTP_403_FORBIDDEN)

    emoji = request.data.get('emoji')
    if not emoji:
        return Response({"error": "Emoji is required"}, status=status.HTTP_400_BAD_REQUEST)

    existing = Reaction.objects.filter(post=post, user=request.user, emoji=emoji).first()
    if existing:
        existing.delete()
        action = 'removed'
    else:
        Reaction.objects.create(post=post, user=request.user, emoji=emoji)
        action = 'added'

    # Return updated reactions
    reactions_qs = Reaction.objects.filter(post=post)
    from .serializers import ReactionSerializer
    return Response({'action': action, 'reactions': ReactionSerializer(reactions_qs, many=True).data})


# ==== GROUP DETAILS ====

@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def group_detail(request, group_id):
    """Get group details including members list."""
    try:
        group = ReadingGroup.objects.prefetch_related('memberships__user', 'book').get(id=group_id)
    except ReadingGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if user is a member
    if not GroupMembership.objects.filter(group=group, user=request.user).exists():
        return Response(
            {"error": "Not a member of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )
    # Handle PATCH/PUT to allow the group creator to update group fields (e.g., end_date)
    if request.method in ("PATCH", "PUT"):
        # Only the creator can change group-level settings
        if group.creator != request.user:
            return Response({"error": "Only the group creator can modify the group"}, status=status.HTTP_403_FORBIDDEN)

        # Allow partial update of end_date (client may send only end_date)
        new_end = request.data.get('end_date')
        if not new_end:
            return Response({"error": "end_date is required"}, status=status.HTTP_400_BAD_REQUEST)

        parsed = parse_date(new_end)
        if not parsed:
            return Response({"error": "Invalid date format for end_date"}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure new end_date is not before start_date
        if group.start_date and parsed < group.start_date:
            return Response({"error": "end_date cannot be before group's start_date"}, status=status.HTTP_400_BAD_REQUEST)

        group.end_date = parsed
        group.save()
        return Response(ReadingGroupSerializer(group).data)

    members = [
        {
            'id': m.user.id,
            'username': m.user.username,
            'joined_at': m.joined_at
        }
        for m in group.memberships.all()
    ]

    data = ReadingGroupSerializer(group).data
    data['members'] = members
    data['book_details'] = BookSerializer(group.book).data
    return Response(data)


# ==== READING PROGRESS ====

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reading_progress_list(request):
    """Get all reading progress for the current user across all groups."""
    progress_list = ReadingProgress.objects.filter(user=request.user).select_related('book', 'group')
    serializer = ReadingProgressSerializer(progress_list, many=True)
    return Response(serializer.data)


@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
def reading_progress(request, group_id):
    """Manage reading progress for a user in a group."""
    try:
        group = ReadingGroup.objects.select_related('book').get(id=group_id)
    except ReadingGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check membership
    if not GroupMembership.objects.filter(group=group, user=request.user).exists():
        return Response(
            {"error": "Not a member of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        # Get or create progress (don't set speed by default - let frontend show selection)
        try:
            progress = ReadingProgress.objects.get(
                user=request.user,
                book=group.book,
                group=group
            )
        except ReadingProgress.DoesNotExist:
            # Create new progress without speed explicitly set
            # Use 0 to indicate "not set yet" so frontend shows selection dialog
            progress = ReadingProgress.objects.create(
                user=request.user,
                book=group.book,
                group=group,
                reading_speed_minutes=0,  # 0 means not set yet
                current_page=1
            )
        return Response(ReadingProgressSerializer(progress).data)

    elif request.method == "POST":
        # Create/Update reading speed (initial setup)
        progress, created = ReadingProgress.objects.get_or_create(
            user=request.user,
            book=group.book,
            group=group
        )
        serializer = ReadingProgressSerializer(progress, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "PUT":
        # Update progress (page navigation, chapter completion)
        try:
            progress = ReadingProgress.objects.get(
                user=request.user,
                book=group.book,
                group=group
            )
        except ReadingProgress.DoesNotExist:
            return Response({"error": "Progress not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReadingProgressSerializer(progress, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==== GROUP PROGRESS STATISTICS ====

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def group_progress_stats(request, group_id):
    """Get group progress statistics showing member completion status."""
    try:
        group = ReadingGroup.objects.select_related('book').get(id=group_id)
    except ReadingGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check membership
    if not GroupMembership.objects.filter(group=group, user=request.user).exists():
        return Response(
            {"error": "Not a member of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Get all members
    members = GroupMembership.objects.filter(group=group).select_related('user')
    total_members = members.count()
    total_pages = group.book.total_pages if group.book else 100

    # Calculate progress for each member
    from datetime import datetime, timedelta
    today = datetime.now().date()
    
    # Calculate expected progress based on schedule
    start_date = group.start_date
    deadline = group.end_date  # Use end_date instead of deadline
    
    if start_date and deadline:
        total_days = (deadline - start_date).days
        elapsed_days = (today - start_date).days
        
        if elapsed_days < 0:
            # Not started yet
            expected_progress = 0
        elif elapsed_days >= total_days:
            # Past deadline
            expected_progress = 100
        else:
            # In progress
            expected_progress = (elapsed_days / total_days) * 100 if total_days > 0 else 0
    else:
        expected_progress = 0

    # Categorize members
    completed = []  # Finished the book
    on_track = []   # Progress >= expected
    behind = []     # Progress < expected
    not_started = []  # No progress yet

    for membership in members:
        try:
            progress = ReadingProgress.objects.get(
                user=membership.user,
                book=group.book,
                group=group
            )
            current_page = progress.current_page or 1
            progress_percent = (current_page / total_pages) * 100 if total_pages > 0 else 0
            
            member_data = {
                'username': membership.user.username,
                'current_page': current_page,
                'progress_percent': round(progress_percent, 1),
                'last_read': progress.last_read_at
            }
            
            if current_page >= total_pages:
                completed.append(member_data)
            elif progress_percent >= expected_progress:
                on_track.append(member_data)
            else:
                behind.append(member_data)
                
        except ReadingProgress.DoesNotExist:
            not_started.append({
                'username': membership.user.username,
                'current_page': 0,
                'progress_percent': 0,
                'last_read': None
            })

    return Response({
        'total_members': total_members,
        'expected_progress': round(expected_progress, 1),
        'completed': {
            'count': len(completed),
            'members': completed
        },
        'on_track': {
            'count': len(on_track),
            'members': on_track
        },
        'behind': {
            'count': len(behind),
            'members': behind
        },
        'not_started': {
            'count': len(not_started),
            'members': not_started
        }
    })


# ==== CHAPTER SCHEDULES ====

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_group_chapters(request, group_id):
    """Get all chapters for a group's book"""
    try:
        group = ReadingGroup.objects.get(id=group_id)
    except ReadingGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is a member
    if not GroupMembership.objects.filter(group=group, user=request.user).exists():
        return Response(
            {"error": "Not a member of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )
    
    chapters = Chapter.objects.filter(book=group.book).order_by('chapter_number')
    serializer = ChapterSerializer(chapters, many=True)
    
    return Response({
        'book_id': group.book.id,
        'book_title': group.book.title,
        'total_chapters': group.book.total_chapters,
        'group_start_date': group.start_date,
        'group_end_date': group.end_date,
        'chapters': serializer.data
    })


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def chapter_schedule_list(request, group_id):
    """Get or create chapter schedules for a user in a group"""
    try:
        group = ReadingGroup.objects.get(id=group_id)
    except ReadingGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is a member
    if not GroupMembership.objects.filter(group=group, user=request.user).exists():
        return Response(
            {"error": "Not a member of this group"},
            status=status.HTTP_403_FORBIDDEN,
        )
    
    if request.method == "GET":
        schedules = ChapterSchedule.objects.filter(
            user=request.user,
            group=group
        ).select_related('chapter')
        
        serializer = ChapterScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    elif request.method == "POST":
        # Bulk create/update chapter schedules
        schedules_data = request.data.get('schedules', [])
        
        if not schedules_data:
            return Response(
                {"error": "No schedules provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_schedules = []
        errors = []
        
        for schedule_data in schedules_data:
            chapter_id = schedule_data.get('chapter')
            target_date = schedule_data.get('target_completion_date')
            
            if not chapter_id or not target_date:
                errors.append(f"Missing chapter or date in schedule")
                continue
            
            try:
                chapter = Chapter.objects.get(id=chapter_id, book=group.book)
            except Chapter.DoesNotExist:
                errors.append(f"Chapter {chapter_id} not found")
                continue
            
            # Validate date is within group's schedule
            target_date_obj = parse_date(target_date)
            if target_date_obj < group.start_date or target_date_obj > group.end_date:
                errors.append(f"Chapter {chapter.chapter_number}: Date must be between {group.start_date} and {group.end_date}")
                continue
            
            # Create or update schedule
            schedule, created = ChapterSchedule.objects.update_or_create(
                user=request.user,
                group=group,
                chapter=chapter,
                defaults={'target_completion_date': target_date}
            )
            
            created_schedules.append(ChapterScheduleSerializer(schedule).data)
        
        return Response({
            'created': len(created_schedules),
            'schedules': created_schedules,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created_schedules else status.HTTP_400_BAD_REQUEST)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def chapter_schedule_detail(request, group_id, schedule_id):
    """Update or delete a specific chapter schedule"""
    try:
        group = ReadingGroup.objects.get(id=group_id)
    except ReadingGroup.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        schedule = ChapterSchedule.objects.get(
            id=schedule_id,
            user=request.user,
            group=group
        )
    except ChapterSchedule.DoesNotExist:
        return Response({"error": "Schedule not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == "PUT":
        # Update schedule
        target_date = request.data.get('target_completion_date')
        completed = request.data.get('completed')
        
        if target_date:
            target_date_obj = parse_date(target_date)
            if target_date_obj < group.start_date or target_date_obj > group.end_date:
                return Response(
                    {"error": f"Date must be between {group.start_date} and {group.end_date}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            schedule.target_completion_date = target_date
        
        if completed is not None:
            schedule.completed = completed
            if completed:
                from django.utils import timezone
                schedule.completed_at = timezone.now()
            else:
                schedule.completed_at = None
        
        schedule.save()
        serializer = ChapterScheduleSerializer(schedule)
        return Response(serializer.data)
    
    elif request.method == "DELETE":
        schedule.delete()
        return Response({"message": "Schedule deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
