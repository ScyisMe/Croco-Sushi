import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const isServer = typeof window === "undefined";
const API_URL = isServer
  ? process.env.INTERNAL_API_URL || "http://backend:8000"
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Створюємо axios інстанс
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor для додавання токенів
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Отримуємо токен з localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor для обробки помилок
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Якщо 401 (Unauthorized) - пробуємо оновити токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post("/api/v1/auth/refresh", {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem("access_token", access_token);

          // Повторюємо оригінальний запит з новим токеном
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError: any) {
        // Якщо refresh не вдався - виходимо
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

