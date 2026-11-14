
import axios from "axios";
import API_BASE_URL from "./apiConfig";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Automatically attach JWT token to requests
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Resource APIs
export const getAllResources = () =>
  API.get("/resources");

export const getMyResources = () =>
  API.get("/resources/mine");

export const addResource = (resource) =>
  API.post("/resources", resource);

export const getResourceById = (id) =>
  API.get(`/resources/${id}`);

export const updateResource = (id, resource) =>
  API.put(`/resources/${id}`, resource);

export const deleteResource = (id) =>
  API.delete(`/resources/${id}`);

// Image upload API
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return API.post("/images", formData);
};

// Borrowing request APIs
export const createResourceRequest = (request) =>
  API.post("/requests", request);

export const getAllRequests = () =>
  API.get("/requests");

export const getRequestsByEmail = () =>
  API.get('/requests/by-email')

// Resource Owner Dashboard API
export const getOwnerRequests = () =>
  API.get("/requests/owner");


// Admin request management APIs
export const approveRequest = (id) =>
  API.put(`/requests/${id}/approve`);

export const rejectRequest = (id) =>
  API.put(`/requests/${id}/reject`);

// Return a borrowed resource
export const returnResource = (id) =>
  API.put(`/requests/${id}/return`);
