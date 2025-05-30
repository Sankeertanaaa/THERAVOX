import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Sort as SortIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { API, getReports } from '../api';
import { useAuth } from '../context/AuthContext';
import { generateSummary } from '../utils/summaryGenerator';

function DashboardDoctor() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    minAge: '',
    maxAge: '',
    gender: '',
    sortBy: 'latest'
  });

  const fetchReports = async (currentFilters) => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching reports with filters:', currentFilters);
      
      // Construct query parameters from filters
      const params = new URLSearchParams();
      if (currentFilters.minAge) params.append('minAge', currentFilters.minAge);
      if (currentFilters.maxAge) params.append('maxAge', currentFilters.maxAge);
      if (currentFilters.gender) params.append('gender', currentFilters.gender);
      if (currentFilters.sortBy) params.append('sortBy', currentFilters.sortBy);

      const url = params.toString() ? `/reports/doctor?${params.toString()}` : '/reports/doctor';
      console.log('Making request to:', url);

      const response = await API.get(url);
      console.log('API Response:', response.data);
      
      if (response.data && Array.isArray(response.data.reports)) {
        console.log('Setting reports:', response.data.reports);
        setReports(response.data.reports);
      } else {
        console.error('Unexpected API response format:', response.data);
        setError('Received unexpected data format from server.');
        setReports([]);
      }

    } catch (err) {
      console.error('Error fetching reports:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
      setError(err.response?.data?.error || 'Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Initial fetch with filters:', filters);
    fetchReports(filters);
  }, []); // Only fetch on component mount

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filtering and Sorting is now handled server-side (mostly)
  // Client-side filter/sort logic below is kept as a fallback or for refinement if needed,
  // but the primary filtering is intended to happen in fetchReports via API call.
  const displayedReports = reports; // Use reports directly as server-side filtering/sorting applied

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: 'success',
      sad: 'error',
      angry: 'error',
      neutral: 'info',
      anxious: 'warning',
      excited: 'success'
    };
    return colors[emotion.toLowerCase()] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Patient Reports
          </Typography>
          <IconButton
            // Refresh button now refetches with current filters
            onClick={() => fetchReports(filters)}
            color="primary"
            sx={{
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Card>
          <CardContent>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Age Filter Inputs (Text Fields) */}
              <Grid xs={12} sm={4}>
                 <TextField
                    fullWidth
                    label="Min Age"
                    name="minAge"
                    type="number"
                    value={filters.minAge}
                    onChange={handleFilterChange}
                    inputProps={{ min: 12, max: 82 }}
                 />
              </Grid>
              <Grid xs={12} sm={4}>
                 <TextField
                    fullWidth
                    label="Max Age"
                    name="maxAge"
                    type="number"
                    value={filters.maxAge}
                    onChange={handleFilterChange}
                    inputProps={{ min: 12, max: 82 }}
                 />
              </Grid>
              {/* Gender Filter (Dropdown) */}
              <Grid xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    label="Gender"
                    name="gender"
                    value={filters.gender}
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Genders</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {/* Sort By (Dropdown) */}
               {/* Note: Sorting is currently client-side, but server-side is preferred for large datasets */}
              <Grid xs={12} sm={4}>
                 <FormControl fullWidth>
                   <InputLabel>Sort By</InputLabel>
                   <Select
                     label="Sort By"
                     name="sortBy"
                     value={filters.sortBy}
                     onChange={handleFilterChange}
                   >
                     <MenuItem value="latest">Latest First</MenuItem>
                     <MenuItem value="oldest">Oldest First</MenuItem>
                   </Select>
                 </FormControl>
              </Grid>
            </Grid>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Emotions</TableCell>
                    <TableCell>Summary</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Use displayedReports which is reports after server-side filtering/sorting */}
                  {displayedReports.map((report) => (
                    <TableRow key={report._id} hover>
                      <TableCell>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      {/* Access patient details from the populated 'patient' field */}
                      <TableCell>{report.patient?.name || 'N/A'}</TableCell>
                      <TableCell>{report.patient?.age || 'N/A'}</TableCell>
                      <TableCell>{report.patient?.gender || 'N/A'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {/* Check if emotions is an array before mapping */}
                          {Array.isArray(report.emotions) ? report.emotions.map((emotion, index) => (
                            <Chip
                              key={index}
                              label={emotion}
                              color={getEmotionColor(emotion)}
                              size="small"
                            />
                          )) : 'N/A'}
                        </Stack>
                      </TableCell>
                      <TableCell>{generateSummary(report)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Display message if no reports found after filtering/loading */}
                  {!loading && !error && displayedReports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No reports found matching criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default DashboardDoctor;
