// Web Worker for parsing Excel/CSV files in background thread
// This prevents UI freezing during heavy processing

import * as XLSX from "xlsx";

// TypeScript Interfaces
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

interface ParseMessage {
  type: "parse";
  fileData: ArrayBuffer;
  fileName: string;
  filterDate?: string;
  chunkSize?: number;
  normalizeMemberCode?: boolean;
}

interface ProgressMessage {
  type: "progress";
  progress: number;
  message: string;
  phase: "reading" | "parsing" | "filtering" | "complete";
}

interface ResultMessage {
  type: "result";
  records: MilkRecord[];
  stats: {
    totalRecords: number;
    filteredRecords: number;
    uniqueDates: number;
    dateRange: { earliest: string; latest: string } | null;
    processingTime: number;
  };
}

interface ErrorMessage {
  type: "error";
  error: string;
}

/**
 * Normalize member code by removing leading zeros
 * Examples: "0003" -> "3", "0125" -> "125", "3" -> "3"
 */
function normalizeMemberCode(memCode: string): string {
  if (!memCode) return memCode;

  // Convert to string and remove leading zeros
  const normalized = String(memCode).replace(/^0+/, "");

  // If all zeros, return "0"
  return normalized || "0";
}

// Listen for messages from main thread
self.onmessage = async (e: MessageEvent<ParseMessage>) => {
  const {
    type,
    fileData,
    fileName,
    filterDate,
    chunkSize = 1000,
    normalizeMemberCode: shouldNormalize = true,
  } = e.data;

  if (type === "parse") {
    try {
      const startTime = performance.now();

      // Send initial progress
      postProgress(0, "Starting file processing...", "reading");

      // Parse the file based on extension
      const extension = fileName.split(".").pop()?.toLowerCase();
      let allRecords: MilkRecord[] = [];
      let filteredRecords: MilkRecord[] = [];
      const allDates = new Set<string>();

      if (extension === "csv") {
        const result = await parseCSVInChunks(
          fileData,
          filterDate,
          chunkSize,
          shouldNormalize
        );
        allRecords = result.allRecords;
        filteredRecords = result.filteredRecords;
        result.dates.forEach((d) => allDates.add(d));
      } else if (extension === "xlsx" || extension === "xls") {
        const result = await parseExcelInChunks(
          fileData,
          filterDate,
          chunkSize,
          shouldNormalize
        );
        allRecords = result.allRecords;
        filteredRecords = result.filteredRecords;
        result.dates.forEach((d) => allDates.add(d));
      } else if (extension === "dbf") {
        // Add DBF parsing
        const result = await parseDBFInChunks(
          fileData,
          filterDate,
          chunkSize,
          shouldNormalize
        );
        allRecords = result.allRecords;
        filteredRecords = result.filteredRecords;
        result.dates.forEach((d) => allDates.add(d));
      } else {
        throw new Error("Unsupported file format");
      }

      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);

      // Sort dates to find range
      const sortedDates = Array.from(allDates).sort();

      // Send final result
      const result: ResultMessage = {
        type: "result",
        records: filteredRecords,
        stats: {
          totalRecords: allRecords.length,
          filteredRecords: filteredRecords.length,
          uniqueDates: allDates.size,
          dateRange:
            sortedDates.length > 0
              ? {
                  earliest: sortedDates[0],
                  latest: sortedDates[sortedDates.length - 1],
                }
              : null,
          processingTime,
        },
      };

      postMessage(result);

      // Clear memory
      allRecords = [];
      filteredRecords = [];
      allDates.clear();
    } catch (error: any) {
      const errorMsg: ErrorMessage = {
        type: "error",
        error: error.message || "Unknown error during parsing",
      };
      postMessage(errorMsg);
    }
  }
};

// CSV Parser with chunking
async function parseCSVInChunks(
  fileData: ArrayBuffer,
  filterDate: string | undefined,
  chunkSize: number,
  shouldNormalize: boolean = true
) {
  postProgress(10, "Reading CSV file...", "reading");

  const decoder = new TextDecoder("utf-8");
  const text = decoder.decode(fileData);
  const lines = text.split("\n");

  postProgress(30, "Parsing CSV data...", "parsing");

  const allRecords: MilkRecord[] = [];
  const filteredRecords: MilkRecord[] = [];
  const dates = new Set<string>();

  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted values)
    const values = parseCSVLine(line);

    // Ne_date is at index 2
    const neDate = values[2]?.trim() || "";
    if (neDate) dates.add(neDate);

    if (values.length >= 19) {
      const record = createMilkRecord(values, shouldNormalize);

      // Filter during parsing (single pass!)
      if (!filterDate || neDate === filterDate) {
        filteredRecords.push(record);
      }
    }

    // Report progress every chunk
    if (i % chunkSize === 0) {
      const progress = 30 + Math.round((i / lines.length) * 60);
      postProgress(
        progress,
        `Processing row ${i.toLocaleString()} of ${lines.length.toLocaleString()}...`,
        "parsing"
      );

      // Yield to event loop to prevent blocking
      await sleep(0);
    }
  }

  postProgress(95, "Finalizing results...", "filtering");

  return {
    allRecords: [], // Don't return all records to save memory
    filteredRecords,
    dates,
  };
}

// Excel Parser with chunking
async function parseExcelInChunks(
  fileData: ArrayBuffer,
  filterDate: string | undefined,
  chunkSize: number,
  shouldNormalize: boolean = true
) {
  postProgress(10, "Reading Excel file...", "reading");

  // Use ArrayBuffer directly (faster than binary string)
  const workbook = XLSX.read(fileData, {
    type: "array",
    cellDates: false,
    cellText: true,
  });

  postProgress(30, "Parsing Excel data...", "parsing");

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Get sheet dimensions
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const totalRows = range.e.r + 1;

  const filteredRecords: MilkRecord[] = [];
  const dates = new Set<string>();

  // Process in chunks to avoid memory overflow
  for (let row = 1; row < totalRows; row++) {
    // Skip header (row 0)
    const values: string[] = [];

    // Read row cells (assuming up to column T = 20 columns)
    for (let col = 0; col < 20; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      values.push(cell ? String(cell.v || "").trim() : "");
    }

    // Check if row is empty
    if (values.every((v) => !v)) continue;

    // Ne_date is at index 2
    const neDate = values[2]?.trim() || "";
    if (neDate) dates.add(neDate);

    if (values.length >= 19) {
      // Filter during parsing (single pass!)
      if (!filterDate || neDate === filterDate) {
        filteredRecords.push(createMilkRecord(values, shouldNormalize));
      }
    }

    // Report progress every chunk
    if (row % chunkSize === 0) {
      const progress = 30 + Math.round((row / totalRows) * 60);
      postProgress(
        progress,
        `Processing row ${row.toLocaleString()} of ${totalRows.toLocaleString()}...`,
        "parsing"
      );

      // Yield to event loop
      await sleep(0);
    }
  }

  postProgress(95, "Finalizing results...", "filtering");

  return {
    allRecords: [], // Don't return all records to save memory
    filteredRecords,
    dates,
  };
}

/**
 * Custom DBF Parser
 * Parses DBF (dBase) files manually
 */
async function parseDBFFile(
  buffer: ArrayBuffer
): Promise<{ headers: string[]; rows: (string | number | undefined)[][] }> {
  const dataView = new DataView(buffer);
  const numRecords = dataView.getUint32(4, true);
  const headerSize = dataView.getUint16(8, true);
  const recordSize = dataView.getUint16(10, true);

  const fieldDescriptors: { name: string; type: string; length: number }[] = [];
  let offset = 32;

  // Read field descriptors
  while (offset < headerSize - 1) {
    const fieldNameBytes = new Uint8Array(buffer, offset, 11);
    const fieldName = String.fromCharCode(...fieldNameBytes)
      .replace(/\0/g, "")
      .trim();
    if (fieldName === "" || fieldNameBytes[0] === 0x0d) break;

    const fieldType = String.fromCharCode(dataView.getUint8(offset + 11));
    const fieldLength = dataView.getUint8(offset + 16);

    fieldDescriptors.push({
      name: fieldName,
      type: fieldType,
      length: fieldLength,
    });
    offset += 32;
  }

  const headers = fieldDescriptors.map((f) => f.name);
  const rows: (string | number | undefined)[][] = [];

  // Read records
  let recordOffset = headerSize;
  for (let i = 0; i < numRecords; i++) {
    const deletedFlag = dataView.getUint8(recordOffset);
    if (deletedFlag === 0x2a) {
      recordOffset += recordSize;
      continue;
    }

    const row: (string | number | undefined)[] = [];
    let fieldOffset = recordOffset + 1;

    for (const field of fieldDescriptors) {
      const fieldBytes = new Uint8Array(buffer, fieldOffset, field.length);
      let value: string | number | undefined = String.fromCharCode(
        ...fieldBytes
      ).trim();

      if (field.type === "N" || field.type === "F") {
        const num = Number.parseFloat(value);
        value = isNaN(num) ? value : num;
      } else if (field.type === "D" && value.length === 8) {
        // Convert YYYYMMDD to dd/mm/yyyy
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        value = `${day}/${month}/${year}`;
      }

      row.push(value);
      fieldOffset += field.length;
    }

    rows.push(row);
    recordOffset += recordSize;
  }

  return { headers, rows };
}

// DBF Parser with chunking
async function parseDBFInChunks(
  fileData: ArrayBuffer,
  filterDate: string | undefined,
  chunkSize: number,
  shouldNormalize: boolean = true
) {
  postProgress(10, "Reading DBF file...", "reading");

  // Parse DBF file using custom parser
  const dbfData = await parseDBFFile(fileData);
  const rows = dbfData.rows;

  postProgress(30, "Parsing DBF data...", "parsing");

  const filteredRecords: MilkRecord[] = [];
  const dates = new Set<string>();

  // Process records
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Convert row array to values array (matching expected format)
    const values = row.map((val) => String(val || "").trim());

    // Ne_date is at index 2
    const neDate = values[2] || "";
    if (neDate) dates.add(neDate);

    if (values.length >= 19) {
      const milkRecord = createMilkRecord(values, shouldNormalize);

      // Filter during parsing (single pass!)
      if (!filterDate || neDate === filterDate) {
        filteredRecords.push(milkRecord);
      }
    }

    // Report progress every chunk
    if (i % chunkSize === 0) {
      const progress = 30 + Math.round((i / rows.length) * 60);
      postProgress(
        progress,
        `Processing row ${i.toLocaleString()} of ${rows.length.toLocaleString()}...`,
        "parsing"
      );

      // Yield to event loop to prevent blocking
      await sleep(0);
    }
  }

  postProgress(95, "Finalizing results...", "filtering");

  return {
    allRecords: [], // Don't return all records to save memory
    filteredRecords,
    dates,
  };
}

// Helper: Parse CSV line with proper quote handling
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

// Helper: Create MilkRecord from values
function createMilkRecord(
  values: string[],
  shouldNormalize: boolean = true
): MilkRecord {
  return {
    Sr_no: values[0] || "",
    Coll_Date: values[1] || "",
    Ne_date: values[2] || "",
    Ses_code: values[3] || "",
    Coll_time: values[4] || "",
    Mem_code: shouldNormalize
      ? normalizeMemberCode(values[5] || "")
      : values[5] || "",
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

// Helper: Post progress update
function postProgress(
  progress: number,
  message: string,
  phase: ProgressMessage["phase"]
) {
  const msg: ProgressMessage = {
    type: "progress",
    progress: Math.min(100, Math.max(0, progress)),
    message,
    phase,
  };
  postMessage(msg);
}

// Helper: Sleep to yield to event loop
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
