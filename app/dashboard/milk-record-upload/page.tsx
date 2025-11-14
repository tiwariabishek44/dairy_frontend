"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { NepaliDatePicker } from "@/components/nepali-date-picker"
import {
  parseFileOptimized,
  estimateFileStats,
  validateFile,
  formatFileSize,
  type MilkRecord,
  type FileStats,
  type ParseProgress,
} from "@/lib/excel-parser-optimized"
import {
  MemoryMonitor,
  checkMemoryAvailability,
  checkMemoryPressure,
  clearMemory,
  getMemoryInfo,
} from "@/lib/memory-manager"
import { milkRecordService } from "@/lib/services/milk-record-service"
import NepaliDate from "nepali-date-converter"
import { AlertCircle, CheckCircle, Upload, X, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"

export default function MilkRecordUploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [filterDate, setFilterDate] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingPhase, setProcessingPhase] = useState<ParseProgress["phase"]>("reading")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState("")
  const [filteredRecords, setFilteredRecords] = useState<MilkRecord[]>([])
  const [fileStats, setFileStats] = useState<FileStats | null>(null)
  const [hasFiltered, setHasFiltered] = useState(false)
  const [error, setError] = useState("")
  const [memoryWarning, setMemoryWarning] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const memoryMonitor = useRef<MemoryMonitor>(new MemoryMonitor())

  // Check memory on mount
  useEffect(() => {
    const memCheck = checkMemoryAvailability()
    if (!memCheck.canProcessLargeFile && memCheck.hasMemoryAPI) {
      setMemoryWarning(
        "Low memory detected. Large file processing may be limited."
      )
    }
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles?.length > 0) {
      handleFileLoad(droppedFiles[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileLoad(files[0])
    }
  }

  const handleFileLoad = async (selectedFile: File) => {
    setError("")
    setMemoryWarning("")
    setSuccessMessage("")

    // Validate file
    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      setError(validation.error || "Invalid file")
      return
    }

    // Estimate file stats
    const estimate = estimateFileStats(selectedFile)
    if (!estimate.canHandle) {
      setError(estimate.warning || "File too large")
      return
    }

    if (estimate.warning) {
      setMemoryWarning(estimate.warning)
    }

    // Check memory before processing
    const memCheck = checkMemoryPressure()
    if (memCheck.isHigh && memCheck.warning) {
      setMemoryWarning(memCheck.warning)
    }

    setFile(selectedFile)
    resetFilter()

    // Auto-set today's Nepali date and filter
    const todayNepali = new NepaliDate()
    const todayFormatted = `${String(todayNepali.getDate()).padStart(2, "0")}/${String(todayNepali.getMonth() + 1).padStart(2, "0")}/${todayNepali.getYear()}`

    setFilterDate(todayFormatted)

    // Start parsing with today's date filter
    await parseFileWithFilter(selectedFile, todayFormatted)
  }

  const parseFileWithFilter = async (file: File, dateFilter: string) => {
    setIsProcessing(true)
    setError("")
    memoryMonitor.current.start()

    try {
      console.log(`[OPTIMIZED PARSER] Starting parse for ${file.name}`)
      console.log(`[MEMORY] ${getMemoryInfo()}`)

      const result = await parseFileOptimized(
        file,
        dateFilter,
        (progress: ParseProgress) => {
          setProcessingProgress(progress.progress)
          setProcessingMessage(progress.message)
          setProcessingPhase(progress.phase)
        }
      )

      const memStats = memoryMonitor.current.stop()
      console.log(
        `[OPTIMIZED PARSER] Complete in ${result.stats.processingTime}ms`
      )
      console.log(
        `[MEMORY] Peak: ${memStats.peakMB}MB, Increase: ${memStats.increaseMB}MB`
      )
      console.log(
        `[STATS] Total: ${result.stats.totalRecords}, Filtered: ${result.stats.filteredRecords}, Dates: ${result.stats.uniqueDates}`
      )

      setFilteredRecords(result.records)
      setFileStats(result.stats)
      setHasFiltered(true)

      // Check memory after processing
      const memCheck = checkMemoryPressure()
      if (memCheck.isHigh && memCheck.warning) {
        setMemoryWarning(memCheck.warning)
      }
    } catch (err: any) {
      console.error("[PARSE ERROR]", err)
      setError(err.message || "Error parsing file")
      setFilteredRecords([])
      setFileStats(null)
      setHasFiltered(true)
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
      setProcessingMessage("")
    }
  }

  const resetFilter = () => {
    setFilterDate("")
    setFilteredRecords([])
    setFileStats(null)
    setHasFiltered(false)
    setProcessingProgress(0)
    setError("")
    setSuccessMessage("")

    // Clear memory
    clearMemory(filteredRecords)
  }

  const handleFilter = async () => {
    if (!file || !filterDate) {
      setError("Please select a file and date")
      return
    }

    console.log(`[USER FILTER] Filtering for date: ${filterDate}`)
    await parseFileWithFilter(file, filterDate)
  }

  // Convert filtered records array to XLSX file
  const convertRecordsToXLSXFile = (records: MilkRecord[], date: string): File => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Convert records array to worksheet
    const worksheet = XLSX.utils.json_to_sheet(records)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Milk Records")

    // Generate XLSX file as array buffer
    const xlsxBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

    // Create blob from buffer
    const blob = new Blob([xlsxBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    // Create filename with date
    const filename = `filtered_records_${date.replace(/\//g, "-")}.xlsx`

    // Return File object
    return new File([blob], filename, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  }

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected")
      return
    }

    if (filteredRecords.length === 0) {
      setError("No filtered records to upload. Please select a date with records.")
      return
    }

    // Clear any previous messages
    setError("")
    setSuccessMessage("")
    setIsProcessing(true)
    setProcessingMessage("Preparing upload...")
    setProcessingPhase("parsing")
    setProcessingProgress(20)

    // Defer the actual upload to let the UI update first
    setTimeout(async () => {
      try {
        console.log(`[UPLOAD] Uploading ${filteredRecords.length} filtered records for date: ${filterDate}`)

        // Convert filtered records to XLSX file
        setProcessingMessage("Converting filtered records to Excel...")
        setProcessingProgress(40)
        const xlsxFile = convertRecordsToXLSXFile(filteredRecords, filterDate)
        console.log(`[UPLOAD] Created XLSX file: ${xlsxFile.name} (${xlsxFile.size} bytes)`)

        setProcessingMessage("Uploading Excel file to server...")
        setProcessingProgress(50)

        // Upload the XLSX file as multipart/form-data (same as original upload)
        const response = await milkRecordService.uploadMilkRecords(xlsxFile)

        console.log("[UPLOAD] Response:", response)
        setProcessingProgress(100)
        setProcessingMessage("Complete!")

        if (response.success) {
          const { data } = response

          // Wait a bit to show 100% progress, then close modal and show success
          setTimeout(() => {
            setIsProcessing(false)
            setProcessingProgress(0)
            setProcessingMessage("")

            // Show success message
            setSuccessMessage(
              `${data.message} | Total: ${data.totalRecords.toLocaleString()} | Processed: ${data.processedRecords.toLocaleString()} | Success: ${data.successRecords.toLocaleString()} | Failed: ${data.failedRecords.toLocaleString()} | Batch ID: ${data.uploadBatchId}`
            )

            // Clear and reset after showing message for 8 seconds
            setTimeout(() => {
              clearMemory(filteredRecords)
              setFile(null)
              setFileStats(null)
              resetFilter()
              if (fileInputRef.current) {
                fileInputRef.current.value = ""
              }
            }, 8000) // Show success message for 8 seconds
          }, 800) // Show 100% for 800ms before closing modal
        } else {
          // Close modal and show error
          setIsProcessing(false)
          setProcessingProgress(0)
          setProcessingMessage("")
          setError(response.message || "Upload failed")
        }
      } catch (err: any) {
        console.error("[UPLOAD ERROR]", err)
        // Close modal and show error
        setIsProcessing(false)
        setProcessingProgress(0)
        setProcessingMessage("")
        setError(err.message || "Upload failed. Please try again.")
      }
    }, 100) // 100ms delay to ensure UI updates
  }

  const handleRemoveFile = () => {
    clearMemory(filteredRecords)
    setFile(null)
    setFileStats(null)
    resetFilter()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 mb-1">
                  Milk Record Upload (Filtered by Date)
                </h1>
                <p className="text-sm text-slate-600">
                  Upload records for specific date • Filter before uploading
                </p>
              </div>
            </div>

            {/* Date Picker */}
            {file && !isProcessing && (
              <div className="w-72">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter by Date
                </label>
                <NepaliDatePicker
                  value={filterDate}
                  onChange={setFilterDate}
                  onApply={handleFilter}
                  placeholder="Select date"
                />
              </div>
            )}
          </div>
        </div>

        {/* Memory Warning */}
        {memoryWarning && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">{memoryWarning}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">Upload Successful!</p>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Upload Zone */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-slate-200 hover:border-blue-300"
              }`}
          >
            <div className="w-12 h-12 mx-auto mb-4 bg-slate-100 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-base font-medium text-slate-900 mb-1">
              Drop your file here
            </p>
            <p className="text-sm text-slate-600 mb-4">
              or click to browse
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select File
            </button>
            <p className="text-xs text-slate-500 mt-3">
              CSV, XLSX, XLS • Max 100MB • Only filtered date records are uploaded
            </p>
          </div>

          {/* Selected File Info */}
          {file && (
            <div className="mt-4 flex items-center justify-between p-3 border rounded-md bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">
                    {file.name}
                  </div>
                  <div className="text-xs text-slate-600">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                disabled={isProcessing}
                className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Results */}
        {hasFiltered && !isProcessing && fileStats && (
          <div className="mb-6">
            {fileStats.filteredRecords > 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Records Found
                    </div>
                    <div className="text-2xl font-bold text-green-800">
                      {fileStats.filteredRecords.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">
                      Date: {filterDate}
                    </div>
                    {fileStats.totalRecords > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        {(
                          (fileStats.filteredRecords / fileStats.totalRecords) *
                          100
                        ).toFixed(2)}
                        % of {fileStats.totalRecords.toLocaleString()} total
                      </div>
                    )}
                    <div className="text-xs text-green-600 mt-1">
                      Processed in {fileStats.processingTime}ms
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-medium text-amber-900 text-sm">
                      No Records Found
                    </div>
                    <div className="text-sm text-amber-800">
                      No records for date: <strong>{filterDate}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        {hasFiltered && !isProcessing && fileStats && fileStats.filteredRecords > 0 && (
          <button
            onClick={handleUpload}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload {fileStats.filteredRecords.toLocaleString()} Records for {filterDate}
          </button>
        )}
      </div>

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 w-full">
            <div className="flex flex-col items-center space-y-4">
              {/* Animated Progress Circle */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="#2563eb"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={276.46}
                    strokeDashoffset={276.46 * (1 - processingProgress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">
                    {processingProgress}%
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="text-center w-full">
                <p className="font-semibold text-slate-900 mb-1">
                  {processingPhase === "reading" && "Reading file..."}
                  {processingPhase === "parsing" && "Processing data..."}
                  {processingPhase === "filtering" && "Filtering records..."}
                  {processingPhase === "complete" && "Complete!"}
                </p>
                <p className="text-sm text-slate-600">{processingMessage}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
