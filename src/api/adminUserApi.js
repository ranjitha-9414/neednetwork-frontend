
import axios from "axios";
import API_BASE_URL from "./apiConfig";

const ADMIN_API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Attach JWT token to every request
ADMIN_API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Get all registered users or search by name/email
export const getAdminUsers = (search = "") =>
  ADMIN_API.get("/admin/users", {
    params: search ? { search } : {},
  });

// Get individual user details
export const getAdminUserById = (id) =>
  ADMIN_API.get(`/admin/users/${id}`);

// Get resources posted by a user
export const getAdminUserResources = (id) =>
  ADMIN_API.get(`/admin/users/${id}/resources`);

// Activate or deactivate a user account
export const updateAdminUserStatus = (id, active) =>
  ADMIN_API.put(`/admin/users/${id}/status`, {
    active,
  });

  export const getAdminUserActivityHistory = (id) =>
  ADMIN_API.get(`/admin/users/${id}/activity-history`);

  export const getAllAdminActivityHistory = () =>
  ADMIN_API.get("/admin/users/activity-history");