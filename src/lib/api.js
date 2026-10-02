// Authentication utility functions
import { toast } from "react-toastify";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://tasviet.vercel.app/api";

// Keep track of unauthorized redirects to prevent loops
let isRedirecting = false;

// Create an axios instance with credentials enabled
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Custom error class for unauthorized access
 */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized access") {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
  }
}

/**
 * Login with email and password (cookie-based)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User data
 */
export const loginWithEmail = async (email, password) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    
    // Reset redirect flag on successful login
    isRedirecting = false;
    
    // If the response includes a token in the body, we can extract it
    // This is for cases where the server sends the token in the response body
    // in addition to setting it as a cookie
    if (res.data && res.data.token) {
      // Token is already in the response data, no need to modify
    } else if (res.headers && res.headers['x-auth-token']) {
      // Some APIs send token in headers
      res.data.token = res.headers['x-auth-token'];
    }
    
    return res.data;
  } catch (error) {
    console.error("Error during email login:", error);
    // Axios error handling
    const message = error.response?.data?.error || error.message || "Login failed";
    throw new Error(message);
  }
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await api.post("/auth/logout");
    // Remove any local storage items if needed
    localStorage.removeItem("activeItem");
    localStorage.removeItem("role");
    localStorage.removeItem("authToken");
    toast.success("Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    toast.error("Error during logout");
  }
};

/**
 * Verify user authentication
 * @returns {Promise<Object>} - User role and data
 */
export const verifyAuth = async () => {
  // If we're already on the unauthorized page, don't check auth
  if (window.location.pathname === "/unauthorized") {
    throw new UnauthorizedError("Already on unauthorized page");
  }
  
  // Don't make API calls if we're already redirecting
  if (isRedirecting) {
    throw new UnauthorizedError("Authentication check already in progress");
  }
  
  try {
    // Try to get the stored token as fallback
    const token = localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const res = await api.get("/auth/verify", { headers });
    
    if (res.data && res.data.success) {
      // Ensure there is a success flag in the response
      return res.data;
    } else {
      // Add a success flag if it's missing but we got a 200 response
      return { ...res.data, success: true };
    }
  } catch (error) {
    // If 401, try fallback then throw UnauthorizedError
    if (error.response && error.response.status === 401) {
      // Try with the protected-resource endpoint as fallback
      try {
        const token = localStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const fallbackRes = await api.get("/auth/protected-resource", { headers });
        return { ...fallbackRes.data, success: true };
      } catch (fallbackError) {
        if (fallbackError.response && fallbackError.response.status === 401) {
          // Both authentication methods failed with 401
          isRedirecting = true;
          throw new UnauthorizedError("Authentication required");
        }
        throw fallbackError;
      }
    }
    
    // Rethrow as UnauthorizedError if it's a 401
    if (error.response && error.response.status === 401) {
      isRedirecting = true;
      throw new UnauthorizedError(error.response?.data?.message || "Authentication required");
    }
    
    // Log other errors
    console.error("Error verifying authentication:", error);
    const message = error.response?.data?.error || error.message || "Authentication failed";
    throw new Error(message);
  }
};

/**
 * Refresh access token using refresh token
 * @returns {Promise<Object>} - Success status and message
 */
export const refreshToken = async () => {
  // If we're already on the unauthorized page, don't refresh
  if (window.location.pathname === "/unauthorized") {
    throw new UnauthorizedError("Already on unauthorized page");
  }
  
  // Don't make API calls if we're already redirecting
  if (isRedirecting) {
    throw new UnauthorizedError("Token refresh already in progress");
  }
  
  try {
    const res = await api.post("/auth/refresh-token");
    return res.data;
  } catch (error) {
    console.error("Error refreshing token:", error);
    
    // If it's a 401, throw our custom UnauthorizedError
    if (error.response && error.response.status === 401) {
      isRedirecting = true;
      throw new UnauthorizedError("Session expired, please log in again");
    }
    
    // Let the caller handle other errors
    throw error;
  }
};

/**
 * Reset the redirect flag (call this when navigation completes)
 */
export const resetRedirectFlag = () => {
  isRedirecting = false;
};

// Admin API functions

/**
 * Fetch admin requests with optional filters
 * @param {Object} filters - Query parameters for filtering requests
 * @returns {Promise<Array>} - List of requests
 */
export const fetchAdminRequests = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`/admin/requests${params ? `?${params}` : ''}`);
  return res.data.requests;
};

/**
 * Fetch all employees for admin
 * @returns {Promise<Array>} - List of employees
 */
export const fetchAdminEmployees = async () => {
  const res = await api.get(`/admin/employees`);
  return res.data.employees;
};

/**
 * Export admin requests as CSV
 * @param {Object} filters - Query parameters for filtering requests
 * @returns {Promise<Blob>} - CSV file blob
 */
export const exportRequestsCsv = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`/admin/requests/export/csv${params ? `?${params}` : ''}`, {
    responseType: 'blob',
  });
  return res.data;
};

// Default export of all API functions
const apiExports = {
  loginWithEmail,
  logout,
  verifyAuth,
  refreshToken,
  resetRedirectFlag,
  UnauthorizedError,
  fetchAdminRequests,
  fetchAdminEmployees,
  exportRequestsCsv,
};

export default apiExports;
