// Optimized Excel/CSV Parser with Web Worker
// Single-pass parsing, memory-efficient, non-blocking

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

export interface FileStats {
  totalRecords: number;
  filteredRecords: number;
  uniqueDates: number;
  dateRange: { earliest: string; latest: string } | null;
  processingTime: number;
}

export interface ParseProgress {
  progress: number; // 0-100
  message: string;
  phase: "reading" | "parsing" | "filtering" | "complete";
}

export interface ParseResult {
  records: MilkRecord[];
  stats: FileStats;
}

/**
 * Optimized file parser using Web Worker for background processing
 * Features:
 * - Single-pass parsing (no double reading)
 * - Chunked processing (handles 100k+ records)
 * - Non-blocking (uses Web Worker)
 * - Memory efficient (filters during parse)
 * - Real-time progress updates
 */
export class OptimizedFileParser {
  private worker: Worker | null = null;
  private onProgressCallback: ((progress: ParseProgress) => void) | null = null;

  constructor() {
    // Worker will be created when needed
  }

  /**
   * Parse file with optional date filter
   * @param file - File to parse
   * @param filterDate - Optional date to filter (format: dd/mm/yyyy)
   * @param onProgress - Progress callback
   * @returns Promise with parsed records and stats
   */
  async parseFile(
    file: File,
    filterDate?: string,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<ParseResult> {
    this.onProgressCallback = onProgress || null;

    return new Promise((resolve, reject) => {
      try {
        // Create Web Worker
        this.worker = new Worker(
          new URL("./file-parser.worker.ts", import.meta.url),
          { type: "module" }
        );

        // Read file as ArrayBuffer (most efficient)
        const reader = new FileReader();

        reader.onload = (e) => {
          const fileData = e.target?.result as ArrayBuffer;

          // Set up worker message handler
          this.worker!.onmessage = (event: MessageEvent) => {
            const message = event.data;

            if (message.type === "progress") {
              // Progress update
              if (this.onProgressCallback) {
                this.onProgressCallback({
                  progress: message.progress,
                  message: message.message,
                  phase: message.phase,
                });
              }
            } else if (message.type === "result") {
              // Parsing complete
              if (this.onProgressCallback) {
                this.onProgressCallback({
                  progress: 100,
                  message: "Complete!",
                  phase: "complete",
                });
              }

              const result: ParseResult = {
                records: message.records,
                stats: message.stats,
              };

              // Clean up
              this.cleanup();
              resolve(result);
            } else if (message.type === "error") {
              // Error occurred
              this.cleanup();
              reject(new Error(message.error));
            }
          };

          this.worker!.onerror = (error) => {
            this.cleanup();
            reject(new Error(`Worker error: ${error.message}`));
          };

          // Send parse request to worker
          this.worker!.postMessage({
            type: "parse",
            fileData,
            fileName: file.name,
            filterDate,
            chunkSize: 1000, // Process 1000 rows at a time
          });
        };

        reader.onerror = () => {
          this.cleanup();
          reject(new Error("Failed to read file"));
        };

        // Start reading file
        reader.readAsArrayBuffer(file);
      } catch (error: any) {
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Cancel ongoing parsing operation
   */
  cancel() {
    this.cleanup();
  }

  /**
   * Clean up worker and callbacks
   */
  private cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.onProgressCallback = null;
  }
}

/**
 * Quick file stats without full parsing (estimates based on file size)
 * Used for instant feedback before heavy parsing
 */
export function estimateFileStats(file: File): {
  estimatedRecords: number;
  fileSizeMB: number;
  canHandle: boolean;
  warning?: string;
} {
  const fileSizeMB = file.size / (1024 * 1024);

  // Estimate: ~1KB per record average
  const estimatedRecords = Math.round((file.size / 1024) * 0.8);

  let canHandle = true;
  let warning: string | undefined;

  if (fileSizeMB > 100) {
    canHandle = false;
    warning = "File too large (>100MB). Processing may fail.";
  } else if (fileSizeMB > 50) {
    warning = "Large file detected. Processing may take 1-2 minutes.";
  } else if (fileSizeMB > 20) {
    warning = "Medium file size. Processing may take 30-60 seconds.";
  }

  return {
    estimatedRecords,
    fileSizeMB: Math.round(fileSizeMB * 100) / 100,
    canHandle,
    warning,
  };
}

/**
 * Validate file before parsing
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  const extension = file.name.split(".").pop()?.toLowerCase();
  const validExtensions = ["csv", "xlsx", "xls"];

  if (!extension || !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: "Invalid file type. Only CSV, XLSX, and XLS files are supported.",
    };
  }

  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size exceeds 100MB limit.",
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty.",
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Singleton instance for easy usage
let parserInstance: OptimizedFileParser | null = null;

/**
 * Parse file using singleton parser instance
 * Automatically manages worker lifecycle
 */
export async function parseFileOptimized(
  file: File,
  filterDate?: string,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParseResult> {
  // Validate first
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Create new parser instance
  const parser = new OptimizedFileParser();

  try {
    const result = await parser.parseFile(file, filterDate, onProgress);
    return result;
  } finally {
    // Cleanup happens automatically in parser
    parser.cancel();
  }
}
