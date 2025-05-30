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
import { getDoctorAppointments, updateAppointmentStatus } from '../api';

function DoctorAppointments() {
  const [tabValue, setTabValue] = useState(0);
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await getDoctorAppointments();
      setAppointments(data);
    } catch (error) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedAppointment) return;

    try {
      setStatusUpdateLoading(true);
      await updateAppointmentStatus(selectedAppointment._id, status);
      await fetchAppointments(); // Refresh the appointments list
      setDialogOpen(false);
    } catch (error) {
      setError('Failed to update appointment status');
    } finally {
      setStatusUpdateLoading(false);
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
          {(tabValue === 0 ? appointments.upcoming : appointments.past).map((appointment) => (
            <Grid xs={12} md={6} key={appointment._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      {appointment.patient.name}
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

                  {appointment.notes && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Notes: {appointment.notes}
                    </Typography>
                  )}

                  {tabValue === 0 && appointment.status === 'upcoming' && (
                    <Box display="flex" gap={2} mt={2}>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setDialogOpen(true);
                        }}
                        disabled={statusUpdateLoading}
                      >
                        Mark as Done
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setDialogOpen(true);
                        }}
                        disabled={statusUpdateLoading}
                      >
                        Not Visited
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Update Appointment Status</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark this appointment as {selectedAppointment?.status === 'upcoming' ? 'done' : 'not visited'}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleStatusUpdate(selectedAppointment?.status === 'upcoming' ? 'done' : 'not_visited')}
            variant="contained"
            color="primary"
            disabled={statusUpdateLoading}
          >
            {statusUpdateLoading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DoctorAppointments; 