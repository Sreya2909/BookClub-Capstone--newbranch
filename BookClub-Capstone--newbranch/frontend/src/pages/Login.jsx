// src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Box, Typography, Link } from '@mui/material';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate(location.state?.from || '/home', { replace: true });
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "black",
      }}
    >
      {/*  Full-screen video */}
      <video
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/video.mp4" type="video/mp4" /> {/* Updated path */}
        Your browser does not support the video tag.
      </video>

      {/*  Overlay Content */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "rgba(0, 0, 0, 0.7)", // Main overlay
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          px: 2,
        }}
      >
        {/*  Login Form */}
        <Box
          sx={{
            maxWidth: 400,
            width: "100%",
            p: 4,
            bgcolor: "rgba(0, 0, 0, 0.6)", // More transparent black
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              textAlign: "center", 
              fontWeight: "bold",
              color: "white"
            }}
          >
            Login
          </Typography>
          
          {error && (
            <Typography 
              color="error" 
              sx={{ 
                textAlign: "center", 
                mb: 2 
              }}
            >
              {error}
            </Typography>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              sx={{ 
                mb: 2,
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.9)' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'white' },
                  '&.Mui-focused fieldset': { borderColor: 'white', borderWidth: 1 },
                }
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              sx={{ 
                mb: 2,
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.9)' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'white' },
                  '&.Mui-focused fieldset': { borderColor: 'white', borderWidth: 1 },
                }
              }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth
              sx={{ 
                mt: 2,
                backgroundColor: "white",
                color: "black",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                }
              }}
            >
              Log In
            </Button>
          </form>
          
          <Typography 
            sx={{ 
              mt: 2, 
              textAlign: "center",
              color: "white"
            }}
          >
            Don’t have an account?{" "}
            <Link 
              href="/register" 
              sx={{ 
                color: "orange", 
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}