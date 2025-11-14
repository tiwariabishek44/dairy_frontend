// Memory Management Utilities
// Helps prevent memory leaks and manages large dataset processing

/**
 * Force garbage collection by clearing references
 * Note: Actual GC is controlled by browser, but we can help
 */
export function forceGarbageCollection() {
  // Clear any cached data
  if (typeof window !== "undefined") {
    // Trigger a microtask to help GC
    Promise.resolve().then(() => {
      // Browser will GC when it's ready
    });
  }
}

/**
 * Check if browser has enough memory for operation
 * Returns estimated available memory
 */
export function checkMemoryAvailability(): {
  hasMemoryAPI: boolean;
  estimatedAvailable?: number;
  totalMemory?: number;
  usedMemory?: number;
  canProcessLargeFile: boolean;
} {
  // Check if Performance Memory API is available (Chrome/Edge)
  if (
    "performance" in window &&
    "memory" in (performance as any)
  ) {
    const memory = (performance as any).memory;

    const totalMemory = memory.jsHeapSizeLimit;
    const usedMemory = memory.usedJSHeapSize;
    const available = totalMemory - usedMemory;

    // Consider file processable if at least 200MB available
    const minRequired = 200 * 1024 * 1024; // 200MB

    return {
      hasMemoryAPI: true,
      estimatedAvailable: available,
      totalMemory,
      usedMemory,
      canProcessLargeFile: available > minRequired,
    };
  }

  // Fallback: assume we can process
  return {
    hasMemoryAPI: false,
    canProcessLargeFile: true, // Optimistic
  };
}

/**
 * Monitor memory usage during operation
 */
export class MemoryMonitor {
  private startMemory: number = 0;
  private peakMemory: number = 0;
  private checkInterval: number | null = null;

  start() {
    if ("performance" in window && "memory" in (performance as any)) {
      const memory = (performance as any).memory;
      this.startMemory = memory.usedJSHeapSize;
      this.peakMemory = this.startMemory;

      // Check every 500ms
      this.checkInterval = window.setInterval(() => {
        const current = memory.usedJSHeapSize;
        if (current > this.peakMemory) {
          this.peakMemory = current;
        }
      }, 500);
    }
  }

  stop(): {
    startMB: number;
    peakMB: number;
    currentMB: number;
    increaseMB: number;
  } {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if ("performance" in window && "memory" in (performance as any)) {
      const memory = (performance as any).memory;
      const currentMemory = memory.usedJSHeapSize;

      return {
        startMB: Math.round(this.startMemory / (1024 * 1024)),
        peakMB: Math.round(this.peakMemory / (1024 * 1024)),
        currentMB: Math.round(currentMemory / (1024 * 1024)),
        increaseMB: Math.round((currentMemory - this.startMemory) / (1024 * 1024)),
      };
    }

    return {
      startMB: 0,
      peakMB: 0,
      currentMB: 0,
      increaseMB: 0,
    };
  }

  getMemoryUsage() {
    if ("performance" in window && "memory" in (performance as any)) {
      const memory = (performance as any).memory;
      return {
        usedMB: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
        totalMB: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
        percentUsed: Math.round(
          (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        ),
      };
    }
    return null;
  }
}

/**
 * Chunk large array processing to prevent memory spikes
 * Processes array in chunks with delays to allow GC
 */
export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]> | R[],
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const totalItems = items.length;

  for (let i = 0; i < totalItems; i += chunkSize) {
    const chunk = items.slice(i, Math.min(i + chunkSize, totalItems));
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + chunkSize, totalItems), totalItems);
    }

    // Small delay to allow GC and prevent UI freeze
    if (i + chunkSize < totalItems) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return results;
}

/**
 * Batch upload helper with retry logic
 */
export async function batchUploadWithRetry<T>(
  items: T[],
  batchSize: number,
  uploadFn: (batch: T[], batchNumber: number, totalBatches: number) => Promise<void>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onProgress?: (completed: number, total: number) => void;
    onBatchComplete?: (batchNumber: number, totalBatches: number) => void;
  } = {}
): Promise<{ success: boolean; errors: string[] }> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onProgress,
    onBatchComplete,
  } = options;

  const errors: string[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const batch = items.slice(i * batchSize, (i + 1) * batchSize);
    let retries = 0;
    let success = false;

    while (retries < maxRetries && !success) {
      try {
        await uploadFn(batch, i + 1, totalBatches);
        success = true;

        if (onBatchComplete) {
          onBatchComplete(i + 1, totalBatches);
        }

        if (onProgress) {
          onProgress((i + 1) * batchSize, items.length);
        }
      } catch (error: any) {
        retries++;
        if (retries >= maxRetries) {
          errors.push(
            `Batch ${i + 1} failed after ${maxRetries} retries: ${error.message}`
          );
        } else {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    // Small delay between batches
    if (i < totalBatches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Clear large arrays and objects from memory
 */
export function clearMemory(...refs: any[]) {
  refs.forEach((ref) => {
    if (Array.isArray(ref)) {
      ref.length = 0;
    } else if (typeof ref === "object" && ref !== null) {
      Object.keys(ref).forEach((key) => {
        delete ref[key];
      });
    }
  });

  // Suggest GC
  forceGarbageCollection();
}

/**
 * Get formatted memory info for logging
 */
export function getMemoryInfo(): string {
  if ("performance" in window && "memory" in (performance as any)) {
    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / (1024 * 1024));
    const total = Math.round(memory.jsHeapSizeLimit / (1024 * 1024));
    const percent = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);

    return `Memory: ${used}MB / ${total}MB (${percent}%)`;
  }

  return "Memory info not available";
}

/**
 * Warn user if memory is getting low
 */
export function checkMemoryPressure(): {
  isHigh: boolean;
  warning?: string;
} {
  if ("performance" in window && "memory" in (performance as any)) {
    const memory = (performance as any).memory;
    const percentUsed =
      (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    if (percentUsed > 90) {
      return {
        isHigh: true,
        warning:
          "Memory usage is very high (>90%). Consider closing other tabs or refreshing the page.",
      };
    } else if (percentUsed > 75) {
      return {
        isHigh: true,
        warning: "Memory usage is high (>75%). Large file operations may be slower.",
      };
    }
  }

  return { isHigh: false };
}
