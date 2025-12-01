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
import { AlertCircle, CheckCircle, Upload, X, FileSpreadsheet, Calendar, Filter, Database, Clock } from "lucide-react"
import * as XLSX from "xlsx"

export default function MilkRecordUploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [filterDate, setFilterDate] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingPhase, setProcessingPhase] = useState<ParseProgress["phase"] | "uploading">("reading")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState("")
  const [filteredRecords, setFilteredRecords] = useState<MilkRecord[]>([])
  const [fileStats, setFileStats] = useState<FileStats | null>(null)
  const [hasFiltered, setHasFiltered] = useState(false)
  const [error, setError] = useState("")
  const [memoryWarning, setMemoryWarning] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [elapsedTime, setElapsedTime] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const memoryMonitor = useRef<MemoryMonitor>(new MemoryMonitor())
  const uploadProgressInterval = useRef<NodeJS.Timeout | null>(null)
  const timerInterval = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Check memory on mount
  useEffect(() => {
    const memCheck = checkMemoryAvailability()
    if (!memCheck.canProcessLargeFile && memCheck.hasMemoryAPI) {
      setMemoryWarning(
        "Low memory detected. Large file processing may be limited."
      )
    }
  }, [])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (uploadProgressInterval.current) {
        clearInterval(uploadProgressInterval.current)
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
    }
  }, [])

  // Start timer when processing begins
  useEffect(() => {
    if (isProcessing) {
      startTimeRef.current = Date.now()
      setElapsedTime(0)

      timerInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
    }
  }, [isProcessing])

  // Format elapsed time as MM:SS
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

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

  // Convert filtered records array to XLSX file with lowercase headers
  const convertRecordsToXLSXFile = (records: MilkRecord[], date: string): File => {
    // Convert records to have lowercase keys with underscores preserved
    const recordsWithLowercaseKeys = records.map(record => {
      const lowercaseRecord: any = {}
      Object.keys(record).forEach(key => {
        // Convert key to lowercase, keep underscores
        const normalizedKey = key.toLowerCase()
        lowercaseRecord[normalizedKey] = record[key as keyof MilkRecord]
      })
      return lowercaseRecord
    })

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(recordsWithLowercaseKeys)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Milk Records")
    const xlsxBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([xlsxBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const filename = `filtered_records_${date.replace(/\//g, "-")}.xlsx`
    return new File([blob], filename, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  }

  // Start simulated progress animation during upload
  const startUploadProgressAnimation = () => {
    let currentProgress = 50
    const maxProgress = 95

    uploadProgressInterval.current = setInterval(() => {
      const remaining = maxProgress - currentProgress
      const increment = Math.max(0.5, remaining * 0.05)
      currentProgress = Math.min(maxProgress, currentProgress + increment)
      setProcessingProgress(Math.round(currentProgress))

      if (currentProgress < 60) {
        setProcessingMessage("Sending data to server...")
      } else if (currentProgress < 75) {
        setProcessingMessage("Server processing records...")
      } else if (currentProgress < 85) {
        setProcessingMessage("Validating records...")
      } else {
        setProcessingMessage("Finalizing upload...")
      }
    }, 200)
  }

  const stopUploadProgressAnimation = () => {
    if (uploadProgressInterval.current) {
      clearInterval(uploadProgressInterval.current)
      uploadProgressInterval.current = null
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected")
      return
    }

    if (filteredRecords.length === 0) {
      setError("No records found for the selected date. Please choose a different date.")
      return
    }

    setError("")
    setSuccessMessage("")
    setIsProcessing(true)
    setProcessingPhase("uploading")
    setProcessingProgress(10)
    setProcessingMessage("Preparing upload...")

    try {
      console.log(`[UPLOAD] Uploading ${filteredRecords.length} filtered records for date: ${filterDate}`)

      setProcessingMessage("Converting records to Excel...")
      setProcessingProgress(25)
      await new Promise(resolve => setTimeout(resolve, 300))

      const xlsxFile = convertRecordsToXLSXFile(filteredRecords, filterDate)
      console.log(`[UPLOAD] Created XLSX file: ${xlsxFile.name} (${xlsxFile.size} bytes)`)

      setProcessingProgress(40)
      setProcessingMessage("Excel file ready, starting upload...")
      await new Promise(resolve => setTimeout(resolve, 200))

      setProcessingProgress(50)
      startUploadProgressAnimation()

      const response = await milkRecordService.uploadMilkRecords(xlsxFile)
      stopUploadProgressAnimation()

      console.log("[UPLOAD] Response:", response)

      if (response.success) {
        const { data } = response

        setProcessingProgress(100)
        setProcessingMessage("Upload complete!")
        await new Promise(resolve => setTimeout(resolve, 800))

        setIsProcessing(false)
        setProcessingProgress(0)
        setProcessingMessage("")

        clearMemory(filteredRecords)
        setFile(null)
        setFileStats(null)
        setFilteredRecords([])
        setHasFiltered(false)
        setFilterDate("")
        setError("")
        setMemoryWarning("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        setSuccessMessage(
          `Successfully uploaded ${data.successRecords.toLocaleString()} records for ${filterDate}. ${data.failedRecords > 0 ? `${data.failedRecords} records failed.` : ''}`
        )
      } else {
        setIsProcessing(false)
        setProcessingProgress(0)
        setProcessingMessage("")
        setError(response.message || "Upload failed")
      }
    } catch (err: any) {
      console.error("[UPLOAD ERROR]", err)
      stopUploadProgressAnimation()
      setIsProcessing(false)
      setProcessingProgress(0)
      setProcessingMessage("")
      setError(err.message || "Upload failed. Please try again.")
    }
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
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Milk Records</h1>
          <p className="text-gray-600 mt-1">Upload Excel file with milk collection data</p>
        </div>

        {/* Filter Section - Top Right */}
        {file && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">
                  Filter Date:
                </label>
              </div>
              <NepaliDatePicker
                value={filterDate}
                onChange={setFilterDate}
                onApply={handleFilter}
                placeholder="Select date"
              />
              <button
                onClick={handleFilter}
                disabled={isProcessing || !filterDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <Filter className="w-4 h-4" />
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">Success!</p>
              <p className="text-sm text-green-800 mt-1">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Memory Warning */}
      {memoryWarning && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">{memoryWarning}</p>
          </div>
        </div>
      )}

      {/* Main Upload Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8">
          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${isDragging
              ? "border-blue-500 bg-blue-50 scale-[1.01]"
              : file
                ? "border-green-300 bg-green-50/50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }`}
          >
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${file ? "bg-green-100" : "bg-gray-100"
              }`}>
              {file ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <Upload className="w-10 h-10 text-gray-400" />
              )}
            </div>

            {file ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  File Selected Successfully
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {file.name} ({formatFileSize(file.size)})
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Choose Different File
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Remove File
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drop your Excel file here
                </h3>
                <p className="text-gray-600 mb-6">
                  or click to browse from your computer
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Select Excel File
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  Supported: CSV, XLSX, XLS • Max size: 100MB
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Results Section */}
        {hasFiltered && !isProcessing && fileStats && (
          <div className="border-t border-gray-200 p-8 bg-gray-50">
            {fileStats.filteredRecords > 0 ? (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase">Total Records</p>
                        <p className="text-2xl font-bold text-gray-900">{fileStats.totalRecords.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase">Filtered Records</p>
                        <p className="text-2xl font-bold text-green-600">{fileStats.filteredRecords.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase">Selected Date</p>
                        <p className="text-2xl font-bold text-gray-900">{filterDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={isProcessing}
                  className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                  <Upload className="w-6 h-6" />
                  Upload {fileStats.filteredRecords.toLocaleString()} Records to Server
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-1">
                      No Records Found
                    </h3>
                    <p className="text-sm text-amber-800 mb-2">
                      No records found for date: <strong>{filterDate}</strong>
                    </p>
                    <p className="text-sm text-amber-700">
                      Please select a different date from the filter above.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex flex-col items-center space-y-6">
              {/* Spinner */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div
                  className={`absolute inset-0 rounded-full border-4 border-transparent animate-spin ${processingPhase === "uploading"
                    ? "border-t-green-600 border-r-green-600"
                    : "border-t-blue-600 border-r-blue-600"
                    }`}
                  style={{ animationDuration: '0.8s' }}
                />
              </div>

              {/* Status */}
              <div className="text-center w-full">
                <p className={`text-lg font-bold mb-2 ${processingPhase === "uploading" ? "text-green-700" : "text-gray-900"
                  }`}>
                  {processingPhase === "reading" && "Loading File..."}
                  {processingPhase === "parsing" && "Reading Data..."}
                  {processingPhase === "filtering" && "Finding Records..."}
                  {processingPhase === "uploading" && "Uploading to Server..."}
                  {processingPhase === "complete" && "Complete!"}
                </p>
                <p className="text-sm text-gray-600 mb-3">{processingMessage}</p>

                {/* Timer Display */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-mono font-semibold text-gray-700">
                    {formatElapsedTime(elapsedTime)}
                  </span>
                </div>

                {processingPhase === "uploading" && (
                  <p className="text-xs text-gray-500 mt-3">
                    Please wait, this may take a moment
                    <span className="inline-flex ml-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}