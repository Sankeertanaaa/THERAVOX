import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Upload from "./pages/Upload";
import DashboardPatient from "./pages/DashboardPatient";
import DashboardDoctor from "./pages/DashboardDoctor";
import ProtectedRoute from "./components/ProtectedRoute";
import RecordPage from "./pages/RecordPage";
import DoctorAnalytics from "./pages/DoctorAnalytics";
import BookAppointment from "./pages/BookAppointment";
import ViewAppointments from "./pages/ViewAppointments";
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import AppointmentHistory from './pages/AppointmentHistory';

// Component to handle default routing based on authentication
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === "doctor" ? "/dashboard-doctor" : "/dashboard-patient"} />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/record"
            element={
              <ProtectedRoute>
                <RecordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-patient"
            element={
              <ProtectedRoute>
                <DashboardPatient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-doctor"
            element={
              <ProtectedRoute>
                <DashboardDoctor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor-analytics"
            element={
              <ProtectedRoute>
                <DoctorAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book-appointment"
            element={
              <ProtectedRoute>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointment-history"
            element={
              <ProtectedRoute>
                <AppointmentHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-appointments"
            element={
              <ProtectedRoute>
                <ViewAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<h1 className="text-center mt-20 text-xl">404 - Page Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;



