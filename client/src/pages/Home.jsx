import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Stack, Paper } from "@mui/material";
import { Link } from "react-router-dom";

const Home = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10 }}>
        <Paper elevation={6} sx={{ p: 5, maxWidth: 600, width: "100%", textAlign: "center" }}>
          <Typography variant="h3" color="primary" fontWeight={700} gutterBottom>
            Welcome to the Speech Emotion Recognition App!
          </Typography>
          <Typography variant="h6" color="text.secondary" mb={4}>
            Analyze speech emotions, generate reports, and manage appointments with ease.
          </Typography>
          {!role && (
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button component={Link} to="/login" variant="contained" color="primary" size="large">
                LOGIN
              </Button>
              <Button component={Link} to="/signup" variant="outlined" color="primary" size="large">
                SIGNUP
              </Button>
            </Stack>
          )}
          {role === "patient" && (
            <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
              <Button component={Link} to="/book-appointment" variant="contained" color="secondary">
                Book Appointment
              </Button>
              <Button component={Link} to="/dashboard-patient" variant="outlined" color="secondary">
                View Reports
              </Button>
            </Stack>
          )}
          {role === "doctor" && (
            <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
              <Button component={Link} to="/view-appointments" variant="contained" color="secondary">
                View Appointments
              </Button>
              <Button component={Link} to="/upload" variant="outlined" color="secondary">
                Upload Report
              </Button>
              <Button component={Link} to="/dashboard-doctor" variant="outlined" color="secondary">
                View Reports
              </Button>
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Home;
