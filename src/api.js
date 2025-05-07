import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }
};

// Schedule services
export const scheduleService = {
  getSchedule: async () => {
    const response = await api.get('/schedule');
    return response.data;
  },
  
  updateSchedule: async (scheduleData) => {
    const response = await api.put('/schedule', scheduleData);
    return response.data;
  }
};

// Time Off services
export const timeOffService = {
  getAllTimeOff: async () => {
    const response = await api.get('/timeoff');
    return response.data;
  },
  
  addTimeOff: async (timeOffData) => {
    const response = await api.post('/timeoff', timeOffData);
    return response.data;
  },
  
  updateTimeOff: async (id, timeOffData) => {
    const response = await api.put(`/timeoff/${id}`, timeOffData);
    return response.data;
  },
  
  deleteTimeOff: async (id) => {
    const response = await api.delete(`/timeoff/${id}`);
    return response.data;
  }
};