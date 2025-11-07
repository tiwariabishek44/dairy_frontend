// excel-parser.ts
// Utility for parsing Excel files to handle .xlsx and .xls formats
// This uses the xlsx library which you'll need to install: npm install xlsx

import * as XLSX from "xlsx";

export interface MilkRecord {
  Sr_no: string;
  Coll_Date: string;
  Ne_date: string;
  Ses_code: string;
  Coll_time: string;
  Mem_code: string;
  Category: string;
  Volume_lt: string;
  Fat_per: string;
  Clr: string;
  Snf: string;
  Protien: string;
  Kg_fat: string;
  Kg_snf: string;
  Rate: string;
  Kg_rate: string;
  Snf_rate: string;
  Ts_comm: string;
  Amount: string;
  Remark: string;
}

/**
 * Parse Excel or CSV file and return milk records
 * @param file - File object from input
 * @param filterDate - Optional date to filter by (format: dd/mm/yyyy)
 * @returns Promise<MilkRecord[]>
 */
export async function parseFile(
  file: File,
  filterDate?: string
): Promise<MilkRecord[]> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  if (fileExtension === "csv") {
    return parseCSVFile(file, filterDate);
  } else if (fileExtension === "xlsx" || fileExtension === "xls") {
    return parseExcelFile(file, filterDate);
  } else {
    throw new Error("Unsupported file format. Please use CSV or Excel files.");
  }
}

/**
 * Parse CSV file
 */
async function parseCSVFile(
  file: File,
  filterDate?: string
): Promise<MilkRecord[]> {
  const text = await file.text();
  const lines = text.split("\n");
  const records: MilkRecord[] = [];

  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line
      .split(",")
      .map((val) => val.trim().replace(/^"|"$/g, ""));

    // Ne_date is at index 2 (column 3) - format should be dd/mm/yyyy
    const neDate = values[2] ? values[2].trim() : "";

    // If filterDate provided, only include matching records
    if (filterDate && neDate !== filterDate) continue;

    if (values.length >= 19) {
      records.push(createMilkRecord(values));
    }
  }

  return records;
}

/**
 * Parse Excel file (.xlsx or .xls)
 */
async function parseExcelFile(
  file: File,
  filterDate?: string
): Promise<MilkRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON (skip header)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          dateNF: "dd/mm/yyyy",
        });

        const records: MilkRecord[] = [];

        // Skip header row (index 0)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;

          // Convert all values to strings and preserve original format
          const values = row.map((val) => {
            if (val === null || val === undefined) return "";
            return String(val).trim();
          });

          // Ne_date is at index 2 (column 3) - should be in dd/mm/yyyy format
          const neDate = values[2] ? values[2].trim() : "";

          // If filterDate provided, only include matching records
          if (filterDate && neDate !== filterDate) continue;

          if (values.length >= 19) {
            records.push(createMilkRecord(values));
          }
        }

        resolve(records);
      } catch (error) {
        reject(new Error(`Error parsing Excel file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Create MilkRecord object from array of values
 */
function createMilkRecord(values: string[]): MilkRecord {
  return {
    Sr_no: values[0] || "",
    Coll_Date: values[1] || "",
    Ne_date: values[2] || "",
    Ses_code: values[3] || "",
    Coll_time: values[4] || "",
    Mem_code: values[5] || "",
    Category: values[6] || "",
    Volume_lt: values[7] || "",
    Fat_per: values[8] || "",
    Clr: values[9] || "",
    Snf: values[10] || "",
    Protien: values[11] || "",
    Kg_fat: values[12] || "",
    Kg_snf: values[13] || "",
    Rate: values[14] || "",
    Kg_rate: values[15] || "",
    Snf_rate: values[16] || "",
    Ts_comm: values[17] || "",
    Amount: values[18] || "",
    Remark: values[19] || "",
  };
}

/**
 * Validate if file has correct structure
 */
export async function validateFileStructure(file: File): Promise<boolean> {
  try {
    const records = await parseFile(file);

    // Check if we got at least some valid records
    if (records.length === 0) {
      return false;
    }

    // Validate first record has all required fields
    const firstRecord = records[0];
    const requiredFields: (keyof MilkRecord)[] = [
      "Sr_no",
      "Coll_Date",
      "Ne_date",
      "Ses_code",
      "Coll_time",
      "Mem_code",
      "Category",
      "Volume_lt",
      "Fat_per",
      "Clr",
    ];

    return requiredFields.every((field) => firstRecord[field] !== undefined);
  } catch (error) {
    return false;
  }
}

/**
 * Get unique dates from file
 */
export async function getUniqueDates(file: File): Promise<string[]> {
  const records = await parseFile(file);
  const dates = new Set<string>();

  records.forEach((record) => {
    if (record.Ne_date) {
      dates.add(record.Ne_date);
    }
  });

  return Array.from(dates).sort();
}

/**
 * Get file statistics
 */
export async function getFileStats(file: File): Promise<{
  totalRecords: number;
  dateRange: { earliest: string; latest: string } | null;
  uniqueDates: number;
}> {
  const records = await parseFile(file);
  const dates = records
    .map((r) => r.Ne_date)
    .filter(Boolean)
    .sort();

  return {
    totalRecords: records.length,
    dateRange:
      dates.length > 0
        ? { earliest: dates[0], latest: dates[dates.length - 1] }
        : null,
    uniqueDates: new Set(dates).size,
  };
}
