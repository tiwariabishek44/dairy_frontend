import { api } from "../api-client";
import { API_ENDPOINTS } from "../api-endpoints";

// Types for authentication - Updated to match your API response
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    phoneNumber: string | null;
    email: string;
    memberCode: string | null;
    isAdmin: boolean;
  };
  message: string;
  errorCode: string | null;
}

export interface User {
  userId: number;
  username: string;
  email: string;
  phoneNumber: string | null;
  memberCode: string | null;
  isAdmin: boolean;
}

// Authentication Service
export const authService = {
  // Login function
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      // Store tokens and user data in localStorage
      if (response.success && response.data.accessToken) {
        localStorage.setItem("authToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        // Store user data (without tokens)
        const userData: User = {
          userId: response.data.userId,
          username: response.data.username,
          email: response.data.email,
          phoneNumber: response.data.phoneNumber,
          memberCode: response.data.memberCode,
          isAdmin: response.data.isAdmin,
        };
        localStorage.setItem("user", JSON.stringify(userData));
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout function
  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("authToken");
    return !!token;
  },

  // Get auth token
  getToken: (): string | null => {
    return localStorage.getItem("authToken");
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem("refreshToken");
  },

  // Check if current user is admin
  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.isAdmin || false;
  },

  // Get user display name
  getUserDisplayName: (): string => {
    const user = authService.getCurrentUser();
    return user?.username || user?.email || "User";
  },

  // Check token validity (basic check)
  isTokenValid: (): boolean => {
    const token = localStorage.getItem("authToken");
    if (!token) return false;

    try {
      // Basic JWT token check
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  },

  // Refresh access token using refresh token
  refreshAccessToken: async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return false;

      // You might need to add this endpoint to your backend
      // const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken })
      // For now, return false to trigger re-login
      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  },
};
