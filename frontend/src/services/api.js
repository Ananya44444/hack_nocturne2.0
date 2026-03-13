import axios from 'axios';

const getBaseUrl = () =>
  localStorage.getItem('healthbridge_backend') || 'http://localhost:8000';

const getAuth = () => ({
  hospitalId: localStorage.getItem('healthbridge_hosp_id') || 'HOSP_001',
  apiKey: localStorage.getItem('healthbridge_api_key') || 'key_001',
});

const API = axios.create({ timeout: 10000 });

// Dynamically set base URL on every request
API.interceptors.request.use(config => {
  config.baseURL = getBaseUrl();
  const auth = getAuth();
  if (auth.hospitalId) config.headers['X-Hospital-ID'] = auth.hospitalId;
  if (auth.apiKey) config.headers['X-API-Key'] = auth.apiKey;
  return config;
});

// Response interceptor for consistent error handling
API.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error:', err.response?.status, err.message);
    return Promise.reject(err);
  }
);

export default API;
