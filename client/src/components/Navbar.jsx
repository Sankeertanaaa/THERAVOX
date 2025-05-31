import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  Home as HomeIcon,
  CalendarMonth as CalendarIcon,
  Assessment as ReportsIcon,
  Person as ProfileIcon,
  Login as LoginIcon,
  AppRegistration as SignupIcon,
  Logout as LogoutIcon,
  Mic as MicIcon,
  Upload as UploadIcon,
  EventNote as AppointmentsIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontFamily: 'Playfair Display, serif'
          }}
        >
          TheraVox
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user ? (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/"
                sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                Home
              </Button>

              {user.role === 'patient' && (
                <>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/book-appointment"
                    sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                  >
                    Book Appointment
                  </Button>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/appointment-history"
                    sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                  >
                    My Appointments
                  </Button>
                </>
              )}

              {user.role === 'doctor' && (
                <>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/view-appointments"
                    sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                  >
                    View Appointments
                  </Button>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/upload"
                    sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                  >
                    Upload
                  </Button>
                </>
              )}

              <Button
                color="inherit"
                component={RouterLink}
                to="/profile"
                sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                Profile
              </Button>

              {user.role === 'doctor' && <NotificationBell />}

              <Button
                color="inherit"
                onClick={handleLogout}
                sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/login"
                sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                Login
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/signup"
                sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
