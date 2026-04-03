import axios from 'axios';
import { getCookie, setCookie, removeCookie } from 'typescript-cookie';

const API_URL = 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = getCookie('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip auth routes to prevent loops
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getCookie('refreshToken');
      if (!refreshToken) {
        removeAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccess, refreshToken: newRefresh } = data;

        setCookie('accessToken', newAccess, { expires: 1/24 }); // ~1 hour
        setCookie('refreshToken', newRefresh, { expires: 7 }); // 7 days

        api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        processQueue(null, newAccess);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const setAuth = (accessToken: string, refreshToken: string) => {
  setCookie('accessToken', accessToken, { expires: 1/24 }); // ~1 hour
  setCookie('refreshToken', refreshToken, { expires: 7 }); // 7 days
};

export const removeAuth = () => {
  removeCookie('accessToken');
  removeCookie('refreshToken');
};
