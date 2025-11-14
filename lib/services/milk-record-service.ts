import { api } from "../api-client";
import { authService } from "./auth-service";
import {
  API_ENDPOINTS,
  buildUrlWithParams,
  formatNepaliMonth,
  formatNepaliDate,
} from "../api-endpoints";

// Types updated to match your actual API response
export interface MilkRecord {
  id: number;
  memberCode: string;
  farmerName: string;
  collectionDate: string;
  nepaliDate: string;
  nepaliMonth: string;
  collectionTime: string;
  volume: number;
  snf: number;
  fat: number;
  rate: number;
  amount: number;
  remark: string | null;
  createdAt: string;
}

export interface MilkRecordsByDateResponse {
  success: boolean;
  data: MilkRecord[];
  message?: string;
  errorCode?: string | null;
}

// New interface for period summary response - matches your API
export interface FarmerSummary {
  memberCode: string;
  farmerName: string;
  totalLiters: number;
  avgSnf: number;
  avgFat: number;
  avgRate: number;
  totalAmount: number;
}

export interface FarmerSummaryResponse {
  success: boolean;
  data: FarmerSummary[];
  message?: string;
  errorCode?: string | null;
}

// Updated to match your API response
export interface UploadResponse {
  success: boolean;
  data: {
    uploadBatchId: string;
    status: string;
    message: string;
    totalRecords: number;
    processedRecords: number;
    successRecords: number;
    failedRecords: number;
    errors: string[] | null;
  };
  message: string;
  errorCode: string | null;
}

// Period type to match backend enum
export type PeriodType = "FIRST_HALF" | "SECOND_HALF" | "FULL_MONTH";

// Milk Record Service Functions
export const milkRecordService = {
  // Upload milk records file
  uploadMilkRecords: async (file: File): Promise<UploadResponse> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.uploadFile<UploadResponse>(
        API_ENDPOINTS.MILK_RECORDS.UPLOAD,
        formData
      );
      return response;
    } catch (error: any) {
      console.error("Error uploading milk records:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Get milk records by specific Nepali date - Updated to match your API
  getMilkRecordsByDate: async (nepaliDate: string): Promise<MilkRecord[]> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      const url = buildUrlWithParams(
        API_ENDPOINTS.MILK_RECORDS.BY_NEPALI_DATE,
        {
          nepaliDate: nepaliDate, // Format: 14/07/2082
        }
      );

      console.log("Fetching milk records from:", url);

      const response = await api.get<MilkRecordsByDateResponse>(url);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch milk records");
      }
    } catch (error: any) {
      console.error("Error fetching milk records by date:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Get farmer summary for a period - Updated to match your API response
  getFarmerSummary: async (
    nepaliYear: string,
    nepaliMonth: string,
    period: "first" | "second" | "full"
  ): Promise<FarmerSummary[]> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      const nepaliMonthParam = formatNepaliMonth(nepaliYear, nepaliMonth);
      let periodParam: PeriodType = "FULL_MONTH";

      if (period === "first") periodParam = "FIRST_HALF";
      else if (period === "second") periodParam = "SECOND_HALF";

      const url = buildUrlWithParams(
        API_ENDPOINTS.MILK_RECORDS.FARMER_SUMMARY,
        {
          nepaliMonth: nepaliMonthParam,
          period: periodParam,
        }
      );

      console.log("Fetching farmer summary from:", url);

      const response = await api.get<FarmerSummaryResponse>(url);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch farmer summary");
      }
    } catch (error: any) {
      console.error("Error fetching farmer summary:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Helper function to validate file before upload
  validateUploadFile: (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Only Excel (.xlsx, .xls) and CSV files are allowed",
      };
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size must be less than 50MB",
      };
    }

    return { valid: true };
  },
};
