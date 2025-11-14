import { api } from "../api-client";
import { authService } from "./auth-service";
import {
  API_ENDPOINTS,
  buildUrlWithParams,
  formatNepaliMonth,
  PERIOD_TYPES,
} from "../api-endpoints";

// Types updated to match your actual API response
export interface Farmer {
  id: number;
  memberCode: string;
  username: string;
  phoneNumber: string;
}

export interface FarmersResponse {
  success: boolean;
  data: Farmer[];
  message: string;
  errorCode: string | null;
}

// Updated to match your farmer records API response
export interface FarmerMilkRecord {
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

// Response interface for farmer records API
export interface FarmerRecordsApiResponse {
  success: boolean;
  data: FarmerMilkRecord[];
  message?: string;
  errorCode?: string | null;
}

export interface FarmerSummary {
  totalOweAmount: number;
  totalLiter: number;
  avgSnf: number;
  avgFat: number;
  avgRate: number;
}

// Updated to match actual API response
export interface RankedFarmer {
  memberCode: string;
  farmerName: string;
  avgRate: number;
  avgSnf: number;
  avgFat: number;
  totalLiters: number;
  totalAmount: number;
}

export interface FarmerRankingData {
  top5: RankedFarmer[];
  bottom5: RankedFarmer[];
}

export interface FarmerRankingResponse {
  success: boolean;
  data: FarmerRankingData;
  message: string;
  errorCode: string | null;
}

// Updated to match actual API response
export interface FarmerOverviewData {
  nepaliMonth: string;
  period: string;
  totalMilkLiters: number;
  totalActiveFarmers: number;
  totalAmountPaid: number;
  averageSnf: number;
  averageFat: number;
  averageRate: number;
}

export interface FarmerOverviewResponse {
  success: boolean;
  data: FarmerOverviewData;
  message: string;
  errorCode: string | null;
}

export interface FarmerRecordsResponse {
  records: FarmerMilkRecord[];
  summary: FarmerSummary;
}

// Period type to match backend enum
export type PeriodType = "FIRST_HALF" | "SECOND_HALF" | "FULL_MONTH";

// Upload response interface
export interface FarmerUploadResponse {
  success: boolean;
  data: {
    uploadBatchId: string;
    status: string;
    message: string;
    totalRecords: number;
    processedRecords: number;
    successRecords: number;
    failedRecords: number;
    errors: string[];
  };
  message: string;
  errorCode: string | null;
}

// Uploaded farmer info interface
export interface UploadedFarmer {
  id: number;
  memberCode: string;
  phoneNumber: string;
  name: string;
  createdAt: string;
}

// Uploaded farmers response interface
export interface UploadedFarmersResponse {
  success: boolean;
  data: UploadedFarmer[];
  message: string;
  errorCode: string | null;
}

// Farmer Service Functions
export const farmerService = {
  // Upload farmer records file
  uploadFarmerRecords: async (file: File): Promise<FarmerUploadResponse> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.uploadFile<FarmerUploadResponse>(
        API_ENDPOINTS.FARMERS.UPLOAD,
        formData
      );
      return response;
    } catch (error: any) {
      console.error("Error uploading farmer records:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Get uploaded farmers list
  getUploadedFarmers: async (): Promise<UploadedFarmer[]> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      console.log("Fetching uploaded farmers from API...");
      const response = await api.get<UploadedFarmersResponse>(
        API_ENDPOINTS.FARMERS.GET_UPLOADED
      );

      console.log("Uploaded farmers API response:", response);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch uploaded farmers");
      }
    } catch (error: any) {
      console.error("Error fetching uploaded farmers:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Get all farmers - Updated to match your API response
  getAllFarmers: async (): Promise<Farmer[]> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      console.log("Fetching farmers from API...");
      const response = await api.get<FarmersResponse>(
        API_ENDPOINTS.FARMERS.GET_ALL
      );

      console.log("Farmers API response:", response);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch farmers");
      }
    } catch (error: any) {
      console.error("Error fetching farmers:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Get farmer milk records - Updated to match your API response
  getFarmerMilkRecords: async (
    memberCode: string,
    nepaliYear: string,
    nepaliMonth: string
  ): Promise<FarmerRecordsResponse> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      const nepaliMonthParam = formatNepaliMonth(nepaliYear, nepaliMonth);

      const url = buildUrlWithParams(
        API_ENDPOINTS.MILK_RECORDS.FARMER_RECORDS,
        {
          memberCode,
          nepaliMonth: nepaliMonthParam,
        }
      );

      console.log("Fetching farmer milk records from:", url);

      const response = await api.get<FarmerRecordsApiResponse>(url);

      console.log("Farmer records API response:", response);

      if (response.success) {
        // Calculate summary from the records
        const records = response.data;
        const summary: FarmerSummary = {
          totalOweAmount: records.reduce((sum, r) => sum + r.amount, 0),
          totalLiter: records.reduce((sum, r) => sum + r.volume, 0),
          avgSnf:
            records.length > 0
              ? records.reduce((sum, r) => sum + r.snf, 0) / records.length
              : 0,
          avgFat:
            records.length > 0
              ? records.reduce((sum, r) => sum + r.fat, 0) / records.length
              : 0,
          avgRate:
            records.length > 0
              ? records.reduce((sum, r) => sum + r.rate, 0) / records.length
              : 0,
        };

        return { records, summary };
      } else {
        throw new Error(response.message || "Failed to fetch farmer records");
      }
    } catch (error: any) {
      console.error("Error fetching farmer milk records:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Get farmer ranking (top/bottom performers)
  getFarmerRanking: async (
    nepaliYear: string,
    nepaliMonth: string,
    period: "first" | "second" | "full"
  ): Promise<FarmerRankingResponse> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      const nepaliMonthParam = formatNepaliMonth(nepaliYear, nepaliMonth);
      let periodParam: PeriodType = "FULL_MONTH";

      if (period === "first") periodParam = "FIRST_HALF";
      else if (period === "second") periodParam = "SECOND_HALF";

      const url = buildUrlWithParams(API_ENDPOINTS.FARMERS.GET_RANKING, {
        nepaliMonth: nepaliMonthParam,
        period: periodParam,
      });

      const response = await api.get<FarmerRankingResponse>(url);
      return response;
    } catch (error: any) {
      console.error("Error fetching farmer ranking:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Get farmer overview (dairy center stats)
  getFarmerOverview: async (
    nepaliYear: string,
    nepaliMonth: string,
    period: "first" | "second" | "full"
  ): Promise<FarmerOverviewResponse> => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        throw new Error("Please login first");
      }

      const nepaliMonthParam = formatNepaliMonth(nepaliYear, nepaliMonth);
      let periodParam: PeriodType = "FULL_MONTH";

      if (period === "first") periodParam = "FIRST_HALF";
      else if (period === "second") periodParam = "SECOND_HALF";

      const url = buildUrlWithParams(API_ENDPOINTS.FARMERS.GET_OVERVIEW, {
        nepaliMonth: nepaliMonthParam,
        period: periodParam,
      });

      const response = await api.get<FarmerOverviewResponse>(url);
      return response;
    } catch (error: any) {
      console.error("Error fetching farmer overview:", error);
      if (error.status === 401 || error.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }
      throw error;
    }
  },

  // Get farmer by member code
  getFarmerByMemberCode: async (memberCode: string): Promise<Farmer | null> => {
    try {
      const farmers = await farmerService.getAllFarmers();
      return farmers.find((farmer) => farmer.memberCode === memberCode) || null;
    } catch (error) {
      console.error("Error fetching farmer by member code:", error);
      throw error;
    }
  },

  // Get farmer by ID
  getFarmerById: async (id: number): Promise<Farmer | null> => {
    try {
      const farmers = await farmerService.getAllFarmers();
      return farmers.find((farmer) => farmer.id === id) || null;
    } catch (error) {
      console.error("Error fetching farmer by ID:", error);
      throw error;
    }
  },
};
