import { api } from "../api-client";
import { authService } from "./auth-service";
import { API_ENDPOINTS } from "../api-endpoints";

// Notice type
export interface Notice {
  id: number;
  title: string;
  content: string;
  postedBy: number;
  postedAt: string;
}

// Create notice request
export interface CreateNoticeRequest {
  title: string;
  content: string;
}

// Get all notices response
export interface NoticesResponse {
  success: boolean;
  data: Notice[];
  message: string;
  errorCode: string | null;
}

// Create notice response
export interface CreateNoticeResponse {
  success: boolean;
  data: Notice;
  message: string;
  errorCode: string | null;
}

// Notice Service Functions
export const noticeService = {
  // Get all active notices
  getAllNotices: async (): Promise<Notice[]> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      console.log("Fetching notices from API...");
      const response = await api.get<NoticesResponse>(
        API_ENDPOINTS.NOTICES.GET_ALL
      );

      console.log("Notices API response:", response);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch notices");
      }
    } catch (error: any) {
      console.error("Error fetching notices:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Create a new notice
  createNotice: async (
    notice: CreateNoticeRequest
  ): Promise<CreateNoticeResponse> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      console.log("Creating notice:", notice);
      const response = await api.post<CreateNoticeResponse>(
        API_ENDPOINTS.NOTICES.CREATE,
        notice
      );

      console.log("Create notice response:", response);

      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || "Failed to create notice");
      }
    } catch (error: any) {
      console.error("Error creating notice:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },
};
