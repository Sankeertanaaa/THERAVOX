import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookAppointment } from '../api';
import { API } from '../api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';

function BookAppointment() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch list of doctors
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await API.get('/users/doctors');
      if (response.data && Array.isArray(response.data)) {
        setDoctors(response.data);
      } else {
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      if (error.response?.status === 401) {
        setError('Please log in to access this feature');
        // Optionally redirect to login
        // navigate('/login');
      } else {
        setError('Failed to fetch doctors list');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!selectedDoctor || !date || !time) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      await bookAppointment(selectedDoctor, date, time, notes);
      setSuccess('Appointment booked successfully!');
      
      // Clear form
      setSelectedDoctor('');
      setDate('');
      setTime('');
      setNotes('');

      // Redirect to appointments history after 2 seconds
      setTimeout(() => {
        navigate('/view-appointments');
      }, 2000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      if (error.response?.status === 401) {
        setError('Please log in to book an appointment');
        // Optionally redirect to login
        // navigate('/login');
      } else {
        setError(error.response?.data?.error || 'Failed to book appointment');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Book an Appointment
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

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Doctor</InputLabel>
                <Select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  label="Select Doctor"
                >
                  {Array.isArray(doctors) && doctors.map((doctor) => (
                    <MenuItem key={doctor._id} value={doctor._id}>
                      Dr. {doctor.name} - {doctor.specialization}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Appointment Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: today }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="time"
                label="Appointment Time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific concerns or information you'd like to share with the doctor"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Book Appointment'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default BookAppointment;
