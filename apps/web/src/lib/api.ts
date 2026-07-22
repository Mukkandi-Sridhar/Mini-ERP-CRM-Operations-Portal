/// <reference types="vite/client" />
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL,
  withCredentials: true, // for httpOnly refresh cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = localStorage.getItem('access_token');

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshTokenPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (!refreshTokenPromise) {
        refreshTokenPromise = axios
          .post(`${baseURL}/api/auth/refresh`, {}, { withCredentials: true })
          .then((res) => {
            const newToken = res.data.accessToken;
            setAccessToken(newToken);
            return newToken;
          })
          .catch((refreshErr) => {
            setAccessToken(null);
            window.location.href = '/login';
            throw refreshErr;
          })
          .finally(() => {
            refreshTokenPromise = null;
          });
      }

      try {
        const newToken = await refreshTokenPromise;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  },
);

