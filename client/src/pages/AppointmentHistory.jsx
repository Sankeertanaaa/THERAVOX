import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { getAppointmentHistory, cancelAppointment } from '../api';

function AppointmentHistory() {
  const [tabValue, setTabValue] = useState(0);
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await getAppointmentHistory();
      if (response && response.upcoming && response.past) {
        setAppointments(response);
      } else {
        setError('Invalid response format from server');
        setAppointments({ upcoming: [], past: [] });
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to fetch appointments');
      setAppointments({ upcoming: [], past: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setCancelLoading(true);
      await cancelAppointment(selectedAppointment._id);
      await fetchAppointments(); // Refresh the appointments list
      setDialogOpen(false);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Failed to cancel appointment');
    } finally {
      setCancelLoading(false);
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const currentAppointments = tabValue === 0 ? appointments.upcoming : appointments.past;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          My Appointments
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
          <Tab label="Upcoming Appointments" />
          <Tab label="Past Appointments" />
        </Tabs>

        <Grid container spacing={3}>
          {Array.isArray(currentAppointments) && currentAppointments.map((appointment) => (
            <Grid item xs={12} md={6} key={appointment._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Dr. {appointment.doctor.name}
                    </Typography>
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </Box>

                  <Typography color="textSecondary" gutterBottom>
                    Date & Time: {formatDateTime(appointment.date)}
                  </Typography>

                  <Typography color="textSecondary" gutterBottom>
                    Specialization: {appointment.doctor.specialization}
                  </Typography>

                  {appointment.notes && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Notes: {appointment.notes}
                    </Typography>
                  )}

                  {tabValue === 0 && appointment.status === 'upcoming' && (
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setDialogOpen(true);
                      }}
                      disabled={cancelLoading}
                    >
                      Cancel Appointment
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          {(!Array.isArray(currentAppointments) || currentAppointments.length === 0) && (
            <Grid item xs={12}>
              <Typography align="center" color="textSecondary">
                No {tabValue === 0 ? 'upcoming' : 'past'} appointments found
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this appointment with Dr. {selectedAppointment?.doctor.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>No, Keep It</Button>
          <Button
            onClick={handleCancelAppointment}
            variant="contained"
            color="error"
            disabled={cancelLoading}
          >
            {cancelLoading ? <CircularProgress size={24} /> : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AppointmentHistory; 