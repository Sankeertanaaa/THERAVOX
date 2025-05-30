import React, { useEffect, useState } from "react";
import { API } from "../api";
import { Box, Typography, Paper } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";

const DoctorAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const res = await API.get("/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalyticsData(res.data.reports);
      setLoading(false);
    };
    fetchAnalytics();
  }, [token]);

  if (loading) {
    return <Typography align="center" sx={{ mt: 8 }}>Loading...</Typography>;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Analytics
      </Typography>
      <Paper elevation={4} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Average Pitch Trends
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="patient.email" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgPitch" stroke="#1976d2" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
      <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Emotion Frequency Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="patient.email" />
            <YAxis />
            <Tooltip />
            <Legend />
            {analyticsData.length > 0 &&
              Object.keys(analyticsData[0].emotionCount[0]).map((emotion) => (
                <Bar key={emotion} dataKey={emotion} fill="#82ca9d" />
              ))}
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default DoctorAnalytics;
