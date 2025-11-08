bookclub-frontend/
├── public/
├── src/
│   ├── api/
│   │   └── axiosConfig.js        ✅ Axios instance with credentials
│   ├── context/
│   │   └── AuthContext.js        ✅ Auth state (user, login, logout)
│   ├── components/
│   │   ├── layout/
│   │   │   └── NavBar.js
│   │   ├── auth/
│   │   │   ├── LoginForm.js
│   │   │   └── RegisterForm.js
│   │   └── books/
│   │       ├── BookList.js
│   │       └── BookDetail.js
│   ├── pages/
│   │   ├── Home.js               ✅ Main dashboard
│   │   ├── Login.js
│   │   ├── Register.js
│   │   └── BookSearch.js
│   ├── App.js
│   ├── index.js
│   └── utils/
│       └── PrivateRoute.js       ✅ Protect routes
└── package.json