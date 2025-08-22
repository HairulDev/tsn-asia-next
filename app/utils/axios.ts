import axios from "axios";
import { getToken } from "./cookie";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
