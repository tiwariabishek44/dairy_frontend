// Base API URL - Your backend server
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
  },

  // Farmers endpoints
  FARMERS: {
    GET_ALL: `${BASE_URL}/farmers`,
    GET_RANKING: `${BASE_URL}/farmers/ranking`, // ?nepaliMonth=2082/07&period=FIRST_HALF
    GET_OVERVIEW: `${BASE_URL}/farmers/overview`, // ?nepaliMonth=2082/07&period=FIRST_HALF
    UPLOAD: `${BASE_URL}/farmers/upload-data`,
    GET_UPLOADED: `${BASE_URL}/farmers/uploaded`,
  },

  // Milk Records endpoints
  MILK_RECORDS: {
    UPLOAD: `${BASE_URL}/milk-records/upload`,
    FARMER_SUMMARY: `${BASE_URL}/milk-records/farmer-summary`, // ?nepaliMonth=2082/07&period=FIRST_HALF
    BY_NEPALI_DATE: `${BASE_URL}/milk-records/by-nepali-date`, // ?nepaliDate=14/07/2082
    FARMER_RECORDS: `${BASE_URL}/milk-records/farmer-records`, // ?memberCode=F0013&nepaliMonth=2082/07
  },

  // Notices endpoints
  NOTICES: {
    GET_ALL: `${BASE_URL}/notices`,
    CREATE: `${BASE_URL}/notices`,
  },
} as const;

// HTTP Methods enum for consistency
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

// Common query parameters for filtering
export const QUERY_PARAMS = {
  // Date filtering for your API
  NEPALI_MONTH: "nepaliMonth", // Format: 2082/07
  PERIOD: "period", // FIRST_HALF, SECOND_HALF
  NEPALI_DATE: "nepaliDate", // Format: 14/07/2082
  MEMBER_CODE: "memberCode", // Format: F0013
} as const;

// Helper function to build URL with query parameters
export const buildUrlWithParams = (
  baseUrl: string,
  params: Record<string, any>
) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
};

// Period enum to match your backend
export const PERIOD_TYPES = {
  FIRST_HALF: "FIRST_HALF",
  SECOND_HALF: "SECOND_HALF",
} as const;

// Helper function to format Nepali month (YYYY/MM format)
export const formatNepaliMonth = (year: string, month: string) => {
  return `${year}/${month.padStart(2, "0")}`;
};

// Helper function to format Nepali date (DD/MM/YYYY format)
export const formatNepaliDate = (day: string, month: string, year: string) => {
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
};
