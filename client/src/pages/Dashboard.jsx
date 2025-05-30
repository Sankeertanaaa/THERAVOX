import { useEffect, useState } from "react";
import { getUserReports } from "../api";
import { Alert, CircularProgress, Box, Typography, TextField, Button } from "@mui/material";

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');

  const fetchReports = async (ageFilters = {}) => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors

      // Construct query parameters
      const params = new URLSearchParams(ageFilters).toString();
      const url = params ? `/reports/user?${params}` : '/reports/user';

      const response = await getUserReports(url); // Pass the constructed URL to getUserReports
      
      // Assuming the response structure is { reports: [...] }
      if (response && Array.isArray(response.reports)) {
         setReports(response.reports);
      } else if (response && response.reports === null) {
         setReports([]); // Handle case where reports is explicitly null
      } 
      else {
        console.error('Unexpected API response format:', response);
        setError('Received unexpected data format from server.');
        setReports([]); // Ensure reports is an array even on unexpected format
      }

    } catch (err) {
      console.error('Failed to fetch reports:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch reports. Please try again later.');
      }
      setReports([]); // Ensure reports is empty on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch without filters
    fetchReports();
  }, []);

  const handleFilterChange = () => {
    const filters = {};
    if (minAge !== '') filters.minAge = minAge;
    if (maxAge !== '') filters.maxAge = maxAge;
    fetchReports(filters);
  };

  return (
    <div className="min-h-screen bg-accent p-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Patient Reports</h1>

      {/* Age Filter Inputs */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="subtitle1">Filter by Patient Age:</Typography>
        <TextField
          label="Min Age"
          type="number"
          value={minAge}
          onChange={(e) => setMinAge(e.target.value)}
          inputProps={{ min: 12, max: 82 }}
          size="small"
          sx={{ width: 100 }}
        />
        <TextField
          label="Max Age"
          type="number"
          value={maxAge}
          onChange={(e) => setMaxAge(e.target.value)}
          inputProps={{ min: 12, max: 82 }}
          size="small"
          sx={{ width: 100 }}
        />
        <Button variant="contained" onClick={handleFilterChange} size="small">
          Apply Filter
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : reports.length === 0 ? (
        <div className="text-center text-gray-600">
          No reports found. Start a new session to generate a report or adjust filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((r, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-semibold text-lg text-dark">Session {idx + 1}</h3>
              {/* Assuming patient name is available in report data if populated on server */}
              <Typography variant="body2" color="text.secondary">Patient: {r.patient?.name || 'N/A'} (Age: {r.patient?.age || 'N/A'})</Typography>
              <p><strong>Emotions:</strong> {r.emotions?.join(", ") || 'N/A'}</p>
              <p><strong>Transcript:</strong> {r.transcript ? r.transcript.slice(0, 100) + (r.transcript.length > 100 ? '...' : '') : 'N/A'}</p>
              <p><strong>Pitch:</strong> {r.pitch || 'N/A'} Hz</p>
              <p><strong>Pace:</strong> {r.pace || 'N/A'} wpm</p>
              {r.pdfPath && (
                <a 
                  href={`/api/reports/${r._id}/pdf`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm mt-2 inline-block"
                >
                  View Full Report
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
