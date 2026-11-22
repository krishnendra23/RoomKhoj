import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_STORAGE_KEY = 'roomkhoj_auth_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data),
  getProfile: () => apiClient.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => apiClient.patch('/auth/me', payload).then((r) => r.data),
  sendOtp: () => apiClient.post('/auth/send-otp').then((r) => r.data),
  verifyOtp: (otp) => apiClient.post('/auth/verify-otp', { otp }).then((r) => r.data),
};

export const propertyApi = {
  getHomepage: (city = 'Prayagraj') =>
    apiClient.get('/properties/homepage', { params: { city } }).then((r) => r.data),
  search: (params) => apiClient.get('/properties', { params }).then((r) => r.data),
  getBySlug: (slug) => apiClient.get(`/properties/${slug}`).then((r) => r.data),
  trackContact: (id, channel) =>
    apiClient.post(`/properties/${id}/contact-click`, { channel }).then((r) => r.data),
  getMyListings: (status = 'all') =>
    apiClient.get('/properties/owner/my-listings', { params: { status } }).then((r) => r.data),
  getOwnerPropertyById: (id) =>
    apiClient.get(`/properties/owner/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/properties', payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/properties/${id}`, payload).then((r) => r.data),
  updateAvailability: (id, availability) =>
    apiClient.patch(`/properties/${id}/availability`, { availability }).then((r) => r.data),
  remove: (id) => apiClient.delete(`/properties/${id}`).then((r) => r.data),
};

export const uploadApi = {
  uploadPropertyPhotos: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    return apiClient
      .post('/uploads/property-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
      .then((r) => r.data);
  },
  deletePhoto: (publicId) =>
    apiClient.delete('/uploads/property-photos', { data: { publicId } }).then((r) => r.data),
};

export const localityApi = {
  getAll: (params = {}) => apiClient.get('/localities', { params }).then((r) => r.data),
  create: (payload) => apiClient.post('/localities', payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/localities/${id}`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/localities/${id}`).then((r) => r.data),
};

export const favouriteApi = {
  getAll: () => apiClient.get('/favourites').then((r) => r.data),
  getIds: () => apiClient.get('/favourites/ids').then((r) => r.data),
  toggle: (propertyId) => apiClient.post(`/favourites/${propertyId}`).then((r) => r.data),
};

export const reportApi = {
  create: (payload) => apiClient.post('/reports', payload).then((r) => r.data),
};

export const adminApi = {
  getStats: () => apiClient.get('/admin/stats').then((r) => r.data),
  getProperties: (params) => apiClient.get('/admin/properties', { params }).then((r) => r.data),
  moderateProperty: (id, payload) =>
    apiClient.patch(`/admin/properties/${id}/moderate`, payload).then((r) => r.data),
  deleteProperty: (id) => apiClient.delete(`/admin/properties/${id}`).then((r) => r.data),
  getUsers: (params) => apiClient.get('/admin/users', { params }).then((r) => r.data),
  updateUserStatus: (id, accountStatus) =>
    apiClient.patch(`/admin/users/${id}/status`, { accountStatus }).then((r) => r.data),
  getReports: (params) => apiClient.get('/admin/reports', { params }).then((r) => r.data),
  updateReport: (id, payload) => apiClient.patch(`/admin/reports/${id}`, payload).then((r) => r.data),
};
