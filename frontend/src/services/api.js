import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const submitPhoto = async (formData) => {
  // Direct call to Flask disaster service on port 5000
  const response = await axios.post('http://localhost:5000/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  // Wrap in disaster_classification key to match the UI's expectations
  return {
    status: 'accepted',
    disaster_classification: response.data
  };
};

export const submitVideo = async (formData) => {
  const response = await apiClient.post('/submit/video', formData);
  return response.data;
};

export const submitAudio = async (formData) => {
  const response = await apiClient.post('/submit/audio', formData);
  return response.data;
};

export const getContributorReputation = async (contributorId) => {
  const response = await apiClient.get(`/contributor/${contributorId}/reputation`);
  return response.data;
};

export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};
