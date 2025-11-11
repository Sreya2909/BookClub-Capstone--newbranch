// src/components/auth/RegisterForm.js
import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosConfig";

export default function RegisterForm({ onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation functions
  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLettersAndNumbers =
    /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const noConsecutiveDigits = !/(\d)\1{2,}/.test(password); // No 3+ consecutive same digits
  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;

  // Check all password requirements
  const isPasswordValid =
    hasMinLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasLettersAndNumbers &&
    noConsecutiveDigits;

  // Check username availability with debounce
  const checkUsernameAvailability = async (usernameToCheck) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      // Check if username exists by trying to query it
      const response = await api.get(
        `/check-username/?username=${usernameToCheck}`
      );
      setUsernameAvailable(response.data.available);
    } catch (err) {
      // If endpoint call fails, log for debugging and fall back to registration-time check
      console.error("Username availability check failed", err);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    // Only reset availability immediately for short names
    if (newUsername.length < 3) {
      setUsernameAvailable(null);
    }
  };

  // Debounce username availability checks using useEffect
  useEffect(() => {
    if (!username || username.length < 3) return;
    const timer = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate username
    if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    // Validate password requirements
    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    try {
      await register(username, password);
      navigate("/login", {
        state: { message: "Registration successful! Please log in." },
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.error ||
        "Registration failed. Username may be taken.";
      setError(errorMsg);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 500 }}>
      <Typography variant="h5" gutterBottom>
        Sign Up
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={handleUsernameChange}
          margin="normal"
          required
          helperText={
            checkingUsername
              ? "Checking availability..."
              : usernameAvailable === true
              ? "✓ Username available"
              : usernameAvailable === false
              ? "✗ Username already taken"
              : "Minimum 3 characters"
          }
          error={usernameAvailable === false}
          color={usernameAvailable === true ? "success" : "primary"}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          helperText="Must meet all requirements below"
        />

        {/* Password Requirements Checklist */}
        {password && (
          <Box sx={{ mt: 1, mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Password Requirements:
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  {hasMinLength ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : (
                    <CancelIcon fontSize="small" color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="At least 6 characters"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  {hasUpperCase ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : (
                    <CancelIcon fontSize="small" color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="At least one uppercase letter (A-Z)"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  {hasLowerCase ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : (
                    <CancelIcon fontSize="small" color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="At least one lowercase letter (a-z)"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  {hasNumber ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : (
                    <CancelIcon fontSize="small" color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="At least one number (0-9)"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  {hasLettersAndNumbers ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : (
                    <CancelIcon fontSize="small" color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="Combination of letters and numbers"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  {noConsecutiveDigits ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : (
                    <CancelIcon fontSize="small" color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="No consecutive repeating digits (e.g., 111, 222)"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
            </List>
          </Box>
        )}

        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          required
          error={confirmPassword && !passwordsMatch}
          helperText={
            confirmPassword && !passwordsMatch
              ? "✗ Passwords do not match"
              : confirmPassword && passwordsMatch
              ? "✓ Passwords match"
              : ""
          }
          color={confirmPassword && passwordsMatch ? "success" : "primary"}
        />

        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 2, width: "100%" }}
          disabled={
            !isPasswordValid || !passwordsMatch || usernameAvailable === false
          }
        >
          Register
        </Button>
      </form>

      <Typography sx={{ mt: 2, textAlign: "center" }}>
        Already have an account?{" "}
        <Button onClick={onSwitchToLogin} color="primary">
          Log in
        </Button>
      </Typography>
    </Box>
  );
}
