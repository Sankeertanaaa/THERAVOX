import React, { useState, useEffect } from 'react';
import { API } from '../api';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Chip
} from '@mui/material';
import { Save } from '@mui/icons-material';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await API.get('/reports/user');
        setReports(response.data.reports || response.data);
      } catch (err) {
        setError('Failed to fetch reports');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Medical Reports
      </Typography>
      {reports.length === 0 ? (
        <Alert severity="info">No reports available yet.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Emotion(s)</TableCell>
                <TableCell>Summary</TableCell>
                <TableCell>PDF</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {report.emotions && report.emotions.length > 0 ? (
                      report.emotions.map((emotion, idx) => (
                        <Chip key={idx} label={emotion} sx={{ mr: 0.5 }} />
                      ))
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>{report.summary}</TableCell>
                  <TableCell>
                    {report.pdfPath || report.pdfUrl ? (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={async () => {
                          try {
                            const pdfUrl = `/api/reports/${report._id}/pdf`;
                            console.log('Downloading PDF from:', pdfUrl);
                            
                            // Fetch the PDF with credentials and Authorization header
                            const token = localStorage.getItem("token"); // Get the token
                            const response = await fetch(pdfUrl, {
                              credentials: 'include',
                              headers: {
                                'Accept': 'application/pdf',
                                'Authorization': `Bearer ${token}` // Add Authorization header
                              }
                            });

                            if (!response.ok) {
                              throw new Error(`HTTP error! status: ${response.status}`);
                            }

                            // Get the blob from the response
                            const blob = await response.blob();
                            
                            // Create a URL for the blob
                            const url = window.URL.createObjectURL(blob);
                            
                            // Create a temporary link element
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `report-${report._id}.pdf`);
                            
                            // Append to body, click, and remove
                            document.body.appendChild(link);
                            link.click();
                            
                            // Clean up
                            link.parentNode.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Error downloading PDF:', error);
                            alert('Failed to download PDF. Please try again.');
                          }
                        }}
                        startIcon={<Save />}
                      >
                        Download PDF
                      </Button>
                    ) : (
                      'Not available'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default Reports; 