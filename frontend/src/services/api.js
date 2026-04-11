import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';
const DISASTER_SERVICE_URL = 'http://localhost:5050';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const disasterClient = axios.create({
  baseURL: DISASTER_SERVICE_URL,
});

// --- BACKEND API (Port 8000) ---

export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const getHistory = async () => {
  const response = await apiClient.get('/uploads/history');
  return response.data;
};

export const analyzeUpload = async (formData) => {
  const response = await apiClient.post('/analyze-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getReports = async () => {
  const response = await apiClient.get('/reports');
  return response.data;
};

export const getReportDetail = async (reportId) => {
  const response = await apiClient.get(`/reports/${reportId}`);
  return response.data;
};

export const saveReport = async (reportData) => {
  const response = await apiClient.post('/reports', reportData);
  return response.data;
};

// --- DISASTER SERVICE (Port 5000) ---

export const predictDisaster = async (formData) => {
  const response = await disasterClient.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return {
    status: 'accepted',
    disaster_classification: response.data
  };
};

export const analyzeReportText = async (reportText) => {
  const response = await disasterClient.post('/analyze-report', { report_text: reportText });
  return response.data;
};

export const analyzeReportDocument = async (formData) => {
  const response = await disasterClient.post('/analyze-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// --- LEGACY/SPECIFIC ENDPOINTS ---

export const submitVideo = async (formData) => {
  const response = await apiClient.post('/v1/submit/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const submitAudio = async (formData) => {
  const response = await apiClient.post('/v1/submit/audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getContributorReputation = async (contributorId) => {
  const response = await apiClient.get(`/v1/contributor/${contributorId}/reputation`);
  return response.data;
};
