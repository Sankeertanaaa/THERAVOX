import axios from "axios";

// Create axios instance with default config
export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if it's not a PDF download request
      if (!error.config.url.includes('/pdf')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const signup = async (name, email, password, role) => {
  try {
    const response = await API.post("/auth/signup", { name, email, password, role });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadAudio = async (formData) => {
  try {
    const response = await API.post("/upload/audio", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getReports = async (url = "/reports/doctor") => {
  try {
    const response = await API.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNotifications = async () => {
  try {
    const response = await API.get("/notifications");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAppointments = async () => {
  try {
    const response = await API.get("/appointments/doctor");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email });
    const response = await API.post("/auth/login", { email, password });
    console.log('Login response:', response.data);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      return response.data;
    } else {
      console.error('No token in response:', response.data);
      throw new Error('No token received from server');
    }
  } catch (error) {
    console.error('Login error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export const bookAppointment = async (doctorId, date, time, notes) => {
  try {
    const response = await API.post("/appointments/book", {
      doctorId,
      date,
      time,
      notes
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAppointmentHistory = async () => {
  try {
    const response = await API.get("/appointments/history");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDoctorAppointments = async () => {
  try {
    const response = await API.get("/appointments/doctor");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPatientAppointments = async () => {
  try {
    const response = await API.get("/appointments/patient");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const response = await API.patch(`/appointments/${appointmentId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelAppointment = async (appointmentId) => {
  try {
    const response = await API.delete(`/appointments/${appointmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserReports = async () => {
  try {
    const response = await API.get("/reports/user");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPatients = async () => {
  try {
    const response = await API.get("/users/patients");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reports API
export const getPatientReports = async () => {
  try {
    const response = await API.get('/reports/user');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDoctorReports = async () => {
  try {
    const response = await API.get('/reports/doctor');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getReport = async (reportId) => {
  try {
    const response = await API.get(`/reports/${reportId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadReportPDF = async (reportId) => {
  try {
    const response = await API.get(`/reports/${reportId}/pdf`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateReportNotes = async (reportId, notes) => {
  try {
    const response = await API.put(`/reports/${reportId}/notes`, { notes });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Also export as default for backward compatibility
export default API;
