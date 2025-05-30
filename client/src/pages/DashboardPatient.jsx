import React, { useEffect, useState } from "react";
import { getUserReports, API } from "../api"; // Import getUserReports and API
import { Box, Typography, Grid, Paper, Button, CircularProgress, Alert } from "@mui/material";

export default function DashboardPatient() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(''); // Clear previous errors
        // Use the correct API function
        const response = await getUserReports();
        // Check if response.reports is an array before setting state
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
        // Check for 401 Unauthorized specifically if needed, though API interceptor handles redirect
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
    fetchReports();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
       <Box sx={{ p: 4 }}>
         <Alert severity="error">{error}</Alert>
       </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Your Reports
      </Typography>
      {reports.length === 0 ? (
        <Typography variant="h6" align="center" color="text.secondary">
          No reports found. Start a new session to generate a report.
        </Typography>
      ) : (
        <Grid container spacing={3} justifyContent="center">
          {reports.map((r, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Session {idx + 1}
                </Typography>
                <Typography><b>Emotions:</b> {Array.isArray(r.emotions) ? r.emotions.join(", ") : r.emotions}</Typography>
                <Typography><b>Transcript:</b> {r.transcript ? r.transcript.slice(0, 100) + (r.transcript.length > 100 ? '...' : '') : 'N/A'}</Typography>
                <Typography><b>Pitch:</b> {r.pitch || 'N/A'} Hz</Typography>
                <Typography><b>Pace:</b> {r.pace || 'N/A'} wpm</Typography>
                {r.pdfPath && (
                  <Button
                    href={`/api/reports/${r._id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    sx={{ mt: 2 }}
                  >
                    View Full Report
                  </Button>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
