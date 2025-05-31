import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography, Button, Stack, Paper, Card, CardContent, Grid, CircularProgress, Alert } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { Save } from '@mui/icons-material';
import { /* getPatientReports, getReport, */ API } from '../api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user, tokenValid } = useAuth();
  const navigate = useNavigate();

  return (
    console.log('Rendering Home component...'),
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontFamily: 'Playfair Display, serif' }}>
            Welcome to TheraVox
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            {user?.role === "doctor" ? "Doctor's Dashboard" : "Patient's Dashboard"}
          </Typography>

          {user?.role === "doctor" && (
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

          {user?.role === "patient" && (
            <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
              <Button component={Link} to="/book-appointment" variant="contained" color="secondary">
                Book Appointment
              </Button>
              <Button component={Link} to="/appointment-history" variant="outlined" color="secondary">
                My Appointments
              </Button>
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Home;
