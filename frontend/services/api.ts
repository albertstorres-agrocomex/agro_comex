import axios from "axios";
import { API_BASE_URL } from "../src/config/apiConfig";
import { getAccessToken, setAccessToken, clearAccessToken } from "../src/authStore";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor de request: injeta o access token no header Authorization
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta: tenta renovar o access token silenciosamente ao receber 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // O cookie HttpOnly e enviado automaticamente via withCredentials
        const { data } = await axios.post(
          `${API_BASE_URL}/api/v1/authentication/token/refresh/`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        clearAccessToken();
        // A UI tratara o redirecionamento para login quando existir
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
