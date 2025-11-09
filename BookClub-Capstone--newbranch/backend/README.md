# BookClub Backend

## Project Structure

```
backend/
├── bookclub/                # Django project settings
│   ├── settings.py         ✅ Global error handlers, logging config
│   ├── urls.py            ✅ API route configuration
│   └── wsgi.py
├── bookclub_app/          # Main application
│   ├── models.py          ✅ Database models
│   ├── views.py          ✅ API endpoints with error handling
│   ├── serializers.py    ✅ Data validation
│   ├── exceptions.py     ✅ Custom exceptions
│   ├── urls.py          ✅ App routes
│   └── tests.py         ✅ Unit tests
├── logs/                 # Application logs directory
│   └── debug.log        ✅ Debug and error logs
└── manage.py
```

## Features

### Error Handling

- Custom exception classes for specific error cases
- Global exception handler middleware
- Detailed error responses with proper HTTP status codes
- Input validation using serializers
- Database integrity error handling
- Authentication/Authorization error handling
- Rate limiting and throttling

### API Error Response Format

```json
{
  "status": "error",
  "code": "INVALID_REQUEST",
  "detail": "Detailed error message",
  "field_errors": {
    "field_name": ["Error message"]
  }
}
```

### Exception Examples

#### Custom Exceptions

```python
class GroupNotFoundException(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Group not found.'
    default_code = 'group_not_found'

class InvalidMembershipException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid membership operation.'
    default_code = 'invalid_membership'
```

#### View Error Handling

```python
try:
    group = Group.objects.get(id=group_id)
except Group.DoesNotExist:
    raise GroupNotFoundException()

try:
    group.add_member(user)
except ValidationError as e:
    raise InvalidMembershipException(detail=str(e))
```

### Input Validation

```python
class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name', 'description']

    def validate_name(self, value):
        if len(value) < 3:
            raise serializers.ValidationError(
                "Group name must be at least 3 characters long."
            )
        return value
```

## Logging Configuration

The application uses Django's logging framework to track errors and debug information. Logs are stored in the `logs` directory.

### Log Levels

- DEBUG: Detailed information for debugging
- INFO: General application information
- WARNING: Minor issues that don't affect functionality
- ERROR: Serious issues that affect functionality
- CRITICAL: Critical issues that require immediate attention

### Log Files

- `logs/debug.log`: Contains all log entries including debug information
- Console output: Warning and higher severity logs are also output to console

## Development Setup

1. Create required directories:

```bash
mkdir logs  # Create logs directory if it doesn't exist
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run migrations:

```bash
python manage.py migrate
```

4. Create a superuser:

```bash
python manage.py createsuperuser
```

5. Run development server:

```bash
python manage.py runserver
```

## Testing

Run tests with coverage:

```bash
python manage.py test
coverage run manage.py test
coverage report
```

## API Documentation

API documentation is available at `/api/docs/` when running the development server.
