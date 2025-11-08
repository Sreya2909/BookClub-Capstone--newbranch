// src/pages/Register.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  const handleSwitchToLogin = () => {
    navigate('/login');
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
      {/* 🎥 Full-screen video */}
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
        <source src="/video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 🖤 Overlay Content */}
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
        {/* 📝 Register Form */}
        <Box
          sx={{
            maxWidth: 600,
            width: "100%",
            p: 3,
            bgcolor: "rgba(211, 211, 211, 0.8)", // Light grey transparent background
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            backdropFilter: "blur(10px)",
            color: "black", // 👈 Force all text inside this box to be black for contrast
            maxHeight: "90vh", // Limit height
            overflowY: "auto", // Make it scrollable
            overflowX: "hidden", // Prevent horizontal scroll
          }}
        >
          <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
        </Box>
      </Box>
    </Box>
  );
}