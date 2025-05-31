import React, { useEffect, useState, useCallback } from "react";
import { getUserReports, getReport, API } from "../api"; // Import getUserReports, getReport and API
import { Box, Typography, Grid, Paper, Button, CircularProgress, Alert } from "@mui/material";
import { Save } from '@mui/icons-material'; // Import Save icon
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

export default function DashboardPatient() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, tokenValid } = useAuth(); // Get user and tokenValid from useAuth

  const fetchReports = useCallback(async () => {
    if (!tokenValid) {
      // If token is not valid, clear reports and set error
      setReports([]);
      setError('Authentication required to fetch reports.');
      setLoading(false);
      return;
    }

    // Get user role from auth context
    const role = user?.role; // Access role from the user object provided by useAuth

    if (role !== 'patient') {
       // Only fetch for patients in this dashboard
       setReports([]);
       setError('Access denied. This page is for patients only.');
       setLoading(false);
       return;
    }

    try {
      console.log('[DashboardPatient] Fetching reports...');
      setLoading(true);
      setError(''); // Clear previous errors
      // Use the correct API function
      const response = await getUserReports();
      console.log('[DashboardPatient] Fetched reports response:', response);

      // Check if response.reports is an array before setting state
      if (response && Array.isArray(response.reports)) {
        console.log('[DashboardPatient] Reports data:', response.reports);
        setReports(response.reports);
      } else if (response && response.reports === null) {
         console.log('[DashboardPatient] Reports data is null, setting empty array.');
         setReports([]); // Handle case where reports is explicitly null
      }
      else {
        console.error('[DashboardPatient] Unexpected API response format:', response);
        setError('Received unexpected data format from server.');
        setReports([]); // Ensure reports is an array even on unexpected format
      }
    } catch (err) {
      console.error('[DashboardPatient] Failed to fetch reports:', err);
      // Check for 401 Unauthorized specifically if needed, though API interceptor handles redirect
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
        // No need to navigate here, AuthContext handles the redirect
      } else {
        setError(err.response?.data?.error || 'Failed to fetch reports. Please try again later.');
      }
      setReports([]); // Ensure reports is empty on error
    } finally {
      setLoading(false);
      console.log('[DashboardPatient] Fetch reports finished.');
    }
  }, [tokenValid, user?.role]); // Dependencies for useCallback

  const handleDownload = useCallback(async (reportId) => {
    console.log('handleDownload called with reportId:', reportId);
    if (!tokenValid) {
      console.log('Token not valid, navigating to login');
      // navigate('/login'); // Removed navigation as this is not needed in this component
      setError('Authentication required to download.');
      return;
    }

    try {
      console.log('Attempting to download PDF for report:', reportId);
      
      // First get the report details to get the PDF path
      console.log('Fetching report details...');
      const report = await getReport(reportId);
      console.log('Report details response:', report);
      
      if (!report.pdfPath) {
        setError('PDF not available for this report');
        return;
      }

      // Extract the filename from the path
      const filename = report.pdfPath.split('/').pop();
      console.log('PDF filename:', filename);
      
      // Download the PDF using axios with blob response type
      console.log('Making request to download PDF...');
      const response = await API.get(`/reports/${reportId}/pdf`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all status codes less than 500
        }
      });

      console.log('PDF download API response:', response);

      console.log('Response headers:', response.headers);
      console.log('Response status:', response.status);
      
      if (response.status !== 200) {
        const errorText = await response.data.text();
        console.error('Error response:', errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF file');
      }

      // Create a blob from the PDF data
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = window.URL.createObjectURL(file);
      console.log('Created file URL:', fileURL);
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = filename || `report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(fileURL);
      console.log('PDF download completed successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      // No need to navigate to login here, AuthContext handles it
      setError(`Failed to download PDF: ${error.message}`);
    }
  }, [tokenValid]); // Added tokenValid to dependency array

  useEffect(() => {
    console.log('[DashboardPatient] useEffect triggered.', { tokenValid, userRole: user?.role });
    fetchReports();
  }, [fetchReports]); // Dependency for useEffect (fetchReports is memoized)

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
                    onClick={() => handleDownload(r._id)}
                    variant="outlined"
                    sx={{ mt: 2 }}
                  >
                    Download PDF
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
