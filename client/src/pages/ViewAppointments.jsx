import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { API, getAppointments } from '../api';
import { useAuth } from '../context/AuthContext';

const ViewAppointments = () => {
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Use the useAuth hook

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user role from auth context
      const role = user?.role; // Access role from the user object provided by useAuth

      let url = '';
      if (!user) {
        // If user is not logged in, show error
        setError('User not logged in. Please log in.');
        setLoading(false);
        return;
      }

      if (role === 'doctor') {
        url = '/appointments/doctor';
      } else if (role === 'patient') {
        url = '/appointments/history';
      } else {
        setError('User role not recognized.');
        setLoading(false);
        return;
      }

      const response = await API.get(url); 

      console.log('Full Axios response received:', response); 

      const data = response.data; 

      if (data && typeof data === 'object' && data !== null && Array.isArray(data.upcoming) && Array.isArray(data.past)) {
        setAppointments({ upcoming: data.upcoming, past: data.past });
        setError(null);
      } else {
        console.error('Unexpected API response format for appointments:', data);
        setError('Received unexpected data format from server.');
        setAppointments({ upcoming: [], past: [] });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
      setAppointments({ upcoming: [], past: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch appointments only if user object is available
    if (user) {
      fetchAppointments();
    }
  }, [user]); // Refetch when user object changes

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await API.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update appointment status');
      console.error('Error updating appointment:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'primary';
      case 'done':
        return 'success';
      case 'not_visited':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading && !user) { // Show loading only if user is not yet loaded
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // Prevent rendering if user is not loaded yet
  if (!user) {
    return null; 
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Playfair Display, serif' }}>
        Appointments
      </Typography>

      {/* Upcoming Appointments Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Upcoming Appointments
        </Typography>
        {appointments.upcoming.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No upcoming appointments.
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Reason/Notes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.upcoming.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                    {/* Display patient name for doctor view */}
                    <TableCell>{user.role === 'doctor' ? appointment.patient?.name || 'N/A' : 'N/A'}</TableCell>
                    <TableCell>{appointment.notes || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label={appointment.status} color={getStatusColor(appointment.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      {user.role === 'doctor' && !['done', 'not_visited', 'cancelled'].includes(appointment.status) && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleStatusUpdate(appointment._id, 'done')}
                            sx={{ mr: 1 }}
                          >
                            Mark as Done
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleStatusUpdate(appointment._id, 'not_visited')}
                          >
                            Mark as Not Visited
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Past Appointments Section */}
      <Box>
        <Typography variant="h5" gutterBottom>
          Past Appointments
        </Typography>
        {appointments.past.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No past appointments.
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                   <TableCell>{user.role === 'doctor' ? 'Patient' : 'Doctor'}</TableCell>
                  <TableCell>Reason/Notes</TableCell>
                  <TableCell>Status</TableCell>
                  {user.role === 'doctor' && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.past.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                     {/* Display patient name for doctor view, doctor name for patient view */}
                     <TableCell>
                       {user.role === 'doctor' 
                         ? appointment.patient?.name || 'N/A' 
                         : appointment.doctor?.name || 'N/A'}
                     </TableCell>
                    <TableCell>{appointment.notes || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label={appointment.status} color={getStatusColor(appointment.status)} size="small" />
                    </TableCell>
                    {user.role === 'doctor' && !['done', 'not_visited', 'cancelled'].includes(appointment.status) && (
                      <TableCell>
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleStatusUpdate(appointment._id, 'done')}
                            sx={{ mr: 1 }}
                          >
                            Mark as Done
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleStatusUpdate(appointment._id, 'not_visited')}
                          >
                            Mark as Not Visited
                          </Button>
                        </>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default ViewAppointments;
