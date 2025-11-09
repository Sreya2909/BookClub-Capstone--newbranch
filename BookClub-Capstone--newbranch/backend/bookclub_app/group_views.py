from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging

from .exceptions import (
    InvalidInputException,
    ResourceNotFoundException,
    PermissionDeniedException
)
from .models import ReadingGroup, GroupMembership
from .serializers import ReadingGroupSerializer

logger = logging.getLogger('bookclub_app')

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_reading_group(request):
    """
    Create a new reading group with error handling
    """
    try:
        # Validate required fields
        book_id = request.data.get('book')
        if not book_id:
            raise InvalidInputException("Book ID is required")

        max_members = request.data.get('max_members')
        if not max_members or int(max_members) < 2:
            raise InvalidInputException("Max members must be at least 2")

        # Create group
        serializer = ReadingGroupSerializer(data=request.data)
        if serializer.is_valid():
            group = serializer.save(creator=request.user)
            # Auto-join creator to group
            GroupMembership.objects.create(user=request.user, group=group)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # If serializer validation failed
        raise InvalidInputException(serializer.errors)

    except ValueError as e:
        # Handle type conversion errors
        logger.error(f"Value error in create_reading_group: {str(e)}")
        raise InvalidInputException("Invalid value provided for max_members")
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in create_reading_group: {str(e)}")
        raise

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_reading_group(request, group_id):
    """
    Join an existing reading group with error handling
    """
    try:
        # Try to get the group
        try:
            group = ReadingGroup.objects.get(id=group_id)
        except ReadingGroup.DoesNotExist:
            raise ResourceNotFoundException(f"Reading group {group_id} not found")

        # Check if group is full
        if group.is_full:
            raise InvalidInputException("This group is already full")

        # Check if user is already a member
        if GroupMembership.objects.filter(user=request.user, group=group).exists():
            raise InvalidInputException("You are already a member of this group")

        # Join group
        GroupMembership.objects.create(user=request.user, group=group)
        
        return Response({
            "message": "Successfully joined the group",
            "group": ReadingGroupSerializer(group).data
        })

    except (InvalidInputException, ResourceNotFoundException) as e:
        # Let these exceptions propagate as they are already handled
        raise
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in join_reading_group: {str(e)}")
        raise

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def leave_reading_group(request, group_id):
    """
    Leave a reading group with error handling
    """
    try:
        # Try to get the group
        try:
            group = ReadingGroup.objects.get(id=group_id)
        except ReadingGroup.DoesNotExist:
            raise ResourceNotFoundException(f"Reading group {group_id} not found")

        # Try to get membership
        try:
            membership = GroupMembership.objects.get(
                user=request.user,
                group=group
            )
        except GroupMembership.DoesNotExist:
            raise InvalidInputException("You are not a member of this group")

        # Check if user is creator and there are other members
        if group.creator == request.user and group.member_count > 1:
            raise PermissionDeniedException(
                "As the group creator, you cannot leave while other members are present"
            )

        # Leave group
        membership.delete()
        
        return Response({
            "message": "Successfully left the group"
        })

    except (InvalidInputException, ResourceNotFoundException, PermissionDeniedException) as e:
        # Let these exceptions propagate as they are already handled
        raise
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in leave_reading_group: {str(e)}")
        raise