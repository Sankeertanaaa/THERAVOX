import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API } from "../api";
import { FcGoogle } from "react-icons/fc";
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Divider, 
  Stack, 
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText
} from "@mui/material";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
    specialization: "",
    age: "",
    gender: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user makes changes
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate required fields based on role
    if (form.role === 'doctor' && !form.specialization) {
      setError("Specialization is required for doctors");
      setLoading(false);
      return;
    }

    if (form.role === 'patient') {
      if (!form.age) {
        setError("Age is required for patients");
        setLoading(false);
        return;
      }
      if (!form.gender) {
        setError("Gender is required for patients");
        setLoading(false);
        return;
      }
    }

    try {
      const response = await API.post("/auth/signup", form);
      setSuccess("Signup successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error('Signup error:', err);
      setError(
        err.response?.data?.error ||
        (err.response?.data?.errors
          ? err.response.data.errors.map((e) => e.msg).join(", ")
          : "Signup failed. Please check your input and try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${API.defaults.baseURL}/auth/google`;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Paper elevation={6} sx={{ p: 5, maxWidth: 500, width: "100%" }}>
        <Typography variant="h4" align="center" gutterBottom>
          Create an Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSignup}>
          <Stack spacing={3}>
            <TextField
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              fullWidth
              error={error.includes('Name')}
              helperText={error.includes('Name') ? error : ''}
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              fullWidth
              error={error.includes('Email')}
              helperText={error.includes('Email') ? error : ''}
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              fullWidth
              error={error.includes('Password')}
              helperText={error.includes('Password') ? error : ''}
            />

            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Password Requirements:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="At least 6 characters long" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Must contain at least one letter" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Must contain at least one number" />
                </ListItem>
              </List>
            </Box>

            <TextField
              select
              label="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              fullWidth
            >
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
            </TextField>

            {form.role === 'patient' && (
              <>
                <TextField
                  label="Age"
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  required
                  fullWidth
                  inputProps={{ min: 1, max: 120 }}
                  error={error.includes('Age')}
                  helperText={error.includes('Age') ? error : ''}
                />

                <TextField
                  select
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                  fullWidth
                  error={error.includes('Gender')}
                  helperText={error.includes('Gender') ? error : ''}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </>
            )}

            {form.role === 'doctor' && (
              <TextField
                select
                label="Specialization"
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                required
                fullWidth
                error={error.includes('Specialization')}
                helperText={error.includes('Specialization') ? error : ''}
              >
                <MenuItem value="Psychiatrist">Psychiatrist</MenuItem>
                <MenuItem value="Counselor">Counselor</MenuItem>
                <MenuItem value="Therapist">Therapist</MenuItem>
              </TextField>
            )}

            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 3 }}>or</Divider>

        <Button
          onClick={handleGoogleSignup}
          startIcon={<FcGoogle />}
          variant="outlined"
          fullWidth
          sx={{ mb: 2 }}
        >
          Continue with Google
        </Button>

        <Typography align="center">
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#1976d2", textDecoration: "underline" }}>
            Click here to login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Signup;
