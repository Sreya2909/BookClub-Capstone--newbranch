from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException
from rest_framework import status
from rest_framework.response import Response
import logging

logger = logging.getLogger('bookclub_app')

class BookClubException(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A server error occurred.'
    default_code = 'error'

class InvalidInputException(BookClubException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input provided.'
    default_code = 'invalid_input'

class ResourceNotFoundException(BookClubException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Requested resource not found.'
    default_code = 'not_found'

class AuthenticationRequiredException(BookClubException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication required.'
    default_code = 'authentication_required'

class PermissionDeniedException(BookClubException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Permission denied.'
    default_code = 'permission_denied'

def custom_exception_handler(exc, context):
    """
    Custom exception handler for REST framework that adds more detail
    to the standard error response.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # Log the error
    logger.error(f"Error occurred: {str(exc)}", exc_info=True,
                 extra={
                     'view': context['view'].__class__.__name__,
                     'error_type': exc.__class__.__name__
                 })

    if response is None:
        # Unhandled exception occurred
        return Response({
            'error': 'An unexpected error occurred',
            'detail': str(exc)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Add additional context to the error response
    if not isinstance(response.data, dict):
        response.data = {'detail': response.data}

    response.data['status_code'] = response.status_code
    response.data['error_type'] = exc.__class__.__name__

    # Add request information for debugging
    if 'view' in context:
        response.data['path'] = context['request'].path
        response.data['method'] = context['request'].method

    return response