# BookClub Frontend

## Project Structure
```
bookclub-frontend/
├── public/
├── src/
│   ├── api/
│   │   └── axiosConfig.js        ✅ Axios instance with global error handling
│   ├── context/
│   │   └── AuthContext.js        ✅ Auth state management
│   ├── components/
│   │   ├── layout/
│   │   │   └── NavBar.js
│   │   ├── auth/
│   │   │   ├── LoginForm.js     ✅ Form validation
│   │   │   └── RegisterForm.js   ✅ Real-time validation
│   │   └── books/
│   │       ├── BookList.js       ✅ Error boundary wrapped
│   │       └── BookDetail.js     ✅ API error handling
│   ├── pages/
│   │   ├── Home.js              ✅ Main dashboard
│   │   ├── Login.js
│   │   ├── Register.js
│   │   └── BookSearch.js
│   ├── App.js                    ✅ Global error boundary
│   ├── index.js
│   └── utils/
│       ├── PrivateRoute.js       ✅ Route protection
│       └── ErrorBoundary.jsx     ✅ Error handling
└── package.json
```

## Features

### Error Handling
- Global ErrorBoundary for React components
- Axios interceptors for API error handling
- Form validation with real-time feedback
- Network error handling with retries
- User-friendly error messages
- Error state management
- Error logging and tracking

### Testing
- Unit tests for components using Vitest
- React Testing Library for component testing
- API mocking and error scenarios
- Form validation testing
- Error boundary testing
- Network error simulation

## Error Handling Examples

### Component Error Boundary
```jsx
<ErrorBoundary>
  <BookList />
</ErrorBoundary>
```

### API Error Handling
```javascript
try {
  const response = await api.post('/groups/', data);
} catch (err) {
  if (err.response) {
    // Backend error
    handleErrorMessage(err.response.data.detail);
  } else if (err.request) {
    // Network error
    handleNetworkError();
  }
}
```

### Form Validation
```jsx
const [errors, setErrors] = useState({});

const validateForm = () => {
  const newErrors = {};
  if (!data.name) newErrors.name = 'Name is required';
  if (!data.email) newErrors.email = 'Email is required';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build