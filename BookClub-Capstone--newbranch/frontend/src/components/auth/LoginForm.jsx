// src/components/auth/LoginForm.js
import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginForm({ onSwitchToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // AuthContext.login expects (username, password)
      await login(username, password);
      navigate("/home"); // Redirect to home on success
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 400 }}>
      <Typography variant="h5" gutterBottom>
        Login
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <form onSubmit={handleLogin}>
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
        />
        <Button type="submit" variant="contained" sx={{ mt: 2, width: "100%" }}>
          Log In
        </Button>
      </form>
      <Typography sx={{ mt: 2, textAlign: "center" }}>
        Don’t have an account?{" "}
        <Button onClick={onSwitchToRegister} color="primary">
          Sign up
        </Button>
      </Typography>
    </Box>
  );
}
