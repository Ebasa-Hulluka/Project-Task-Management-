import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific status codes
      if (error.response.status === 401) {
        const requestUrl = String(error.config?.url || "");
        const isAuthLoginRequest = requestUrl.includes("/api/auth/login");

        // Keep user on login page when credentials are invalid.
        if (!isAuthLoginRequest) {
          // Unauthorized - token expired or invalid
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (window.location.pathname !== "/") {
            window.location.href = "/";
          }
        }
      } else if (error.response.status === 403) {
        // Forbidden - insufficient permissions
        // Suppress repeated console errors for 403
        // The error will be handled by the calling component
      } else if (error.response.status === 404) {
        console.error("Resource not found");
      } else if (error.response.status === 500) {
        console.error("Server error. Please try again later.");
      }

      // Return the error response data
      return Promise.reject(error.response.data);
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    } else if (!error.response) {
      console.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
