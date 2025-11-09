# BookClub - A Social Reading Experience

BookClub is a full-stack web application that enables users to create and participate in reading groups, track their reading progress, and engage in book discussions. Built with React and Django, it provides a rich, interactive platform for book lovers.

## Features

- 📚 Browse and search for books
- 👥 Create and join reading groups
- 📖 Track reading progress
- 📅 Schedule chapter reading
- 💬 Participate in group discussions
- 👍 React to discussion posts
- 📊 View group reading statistics

## Tech Stack

### Frontend

- React 18
- Material-UI v5
- React Router v6
- Axios for API calls
- Vite for build tooling
- Vitest and React Testing Library for testing

### Backend

- Django 5.2
- Django REST Framework
- SQLite database
- Session-based authentication
- CORS support for frontend integration

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:

   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Unix/Mac
   python -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install django djangorestframework django-cors-headers
   ```

4. Run migrations:

   ```bash
   python manage.py migrate
   ```

5. Create a superuser (optional):

   ```bash
   python manage.py createsuperuser
   ```

6. Start the development server:
   ```bash
   python manage.py runserver
   ```

The backend will be available at http://localhost:8000/

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173/

## API Endpoints

### Authentication

- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `POST /api/auth/logout/` - Logout user
- `GET /api/auth/profile/` - Get user profile
- `GET /api/check-username/` - Check username availability

### Books

- `GET /api/books/` - List/search books
- `GET /api/books/{id}/` - Get book details and available groups

### Groups

- `GET /api/groups/` - List user's groups
- `POST /api/groups/` - Create new group
- `GET /api/groups/{id}/` - Get group details
- `POST /api/groups/{id}/join/` - Join group
- `POST /api/groups/{id}/leave/` - Leave group
- `GET /api/groups/{id}/stats/` - Get group reading statistics

### Reading Progress

- `GET /api/groups/{id}/progress/` - Get reading progress
- `POST /api/groups/{id}/progress/` - Update reading speed
- `PUT /api/groups/{id}/progress/` - Update reading progress

### Discussions

- `GET /api/groups/{id}/discussion/` - List group discussions
- `POST /api/groups/{id}/discussion/` - Create discussion post
- `POST /api/posts/{id}/comments/` - Add comment to post
- `POST /api/posts/{id}/react/` - Add/remove reaction

### Chapter Management

- `GET /api/groups/{id}/chapters/` - List chapters
- `GET /api/groups/{id}/schedules/` - Get chapter schedules
- `POST /api/groups/{id}/schedules/` - Create/update schedules
- `PUT /api/groups/{id}/schedules/{schedule_id}/` - Update schedule
- `DELETE /api/groups/{id}/schedules/{schedule_id}/` - Delete schedule

## Testing

### Backend Tests

Run Django tests:

```bash
cd backend
python manage.py test
```

### Frontend Tests

Run React component tests:

```bash
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
