import axios from "axios";

import { clearAuthStorage, readAuthStorage } from "./authStorage.js";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000/api";

const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20_000,
  headers: {
    Accept: "application/json",
  },
});

http.interceptors.request.use((config) => {
  const auth = readAuthStorage();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
      window.dispatchEvent(new CustomEvent("coffeehub:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export { apiBaseUrl };
export default http;
