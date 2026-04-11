import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const submitPhoto = async (formData) => {
  const response = await apiClient.post('/submit/photo', formData);
  return response.data;
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
