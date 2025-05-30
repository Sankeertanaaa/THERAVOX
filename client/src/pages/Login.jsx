import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import { FcGoogle } from "react-icons/fc";
import { Box, Button, TextField, Typography, Paper, Divider, Stack } from "@mui/material";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.user.role === "doctor") {
          navigate("/dashboard-doctor");
        } else {
          navigate("/dashboard-patient");
        }
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API.defaults.baseURL}/auth/google`;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper elevation={6} sx={{ p: 5, maxWidth: 400, width: "100%" }}>
        <Typography variant="h4" align="center" gutterBottom>Login</Typography>
        {error && <Typography color="error" align="center">{error}</Typography>}
        <form onSubmit={handleLogin}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" color="primary" fullWidth>Login</Button>
          </Stack>
        </form>
        <Divider sx={{ my: 3 }}>or</Divider>
        <Button
          onClick={handleGoogleLogin}
          startIcon={<FcGoogle />}
          variant="outlined"
          fullWidth
        >
          Continue with Google
        </Button>
        <Typography align="center" sx={{ mt: 2 }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#1976d2", textDecoration: "underline" }}>
            Click here to signup
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Login;
  