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
import {
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  X,
  FileSpreadsheet,
  Calendar,
  Filter,
  Database,
  Clock,
  Sun,
  Moon,
  Layers,
  ArrowRight,
  RefreshCw,
  FileText
} from "lucide-react"
import * as XLSX from "xlsx"

// Shift types
type ShiftType = "morning" | "evening"

export default function MilkRecordUploadPage() {
  // ----------------------------------------------------------------------
  // LOGIC & STATE (UNCHANGED)
  // ----------------------------------------------------------------------
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [filterDate, setFilterDate] = useState("")

  // Initialize shift based on current time
  const getCurrentShift = (): ShiftType => {
    const now = new Date()
    const hour = now.getHours()
    return hour >= 0 && hour < 12 ? "morning" : "evening"
  }

  const [selectedShift, setSelectedShift] = useState<ShiftType>(getCurrentShift())
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingPhase, setProcessingPhase] = useState<ParseProgress["phase"] | "uploading">("reading")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState("")
  const [filteredRecords, setFilteredRecords] = useState<MilkRecord[]>([])
  const [dateFilteredRecords, setDateFilteredRecords] = useState<MilkRecord[]>([])
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

  // Shift statistics
  const [morningCount, setMorningCount] = useState(0)
  const [eveningCount, setEveningCount] = useState(0)

  // Check memory on mount
  useEffect(() => {
    const memCheck = checkMemoryAvailability()
    if (!memCheck.canProcessLargeFile && memCheck.hasMemoryAPI) {
      setMemoryWarning("Low memory detected. Large file processing may be limited.")
    }
  }, [])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (uploadProgressInterval.current) clearInterval(uploadProgressInterval.current)
      if (timerInterval.current) clearInterval(timerInterval.current)
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
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [isProcessing])

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

    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      setError(validation.error || "Invalid file")
      return
    }

    const estimate = estimateFileStats(selectedFile)
    if (!estimate.canHandle) {
      setError(estimate.warning || "File too large")
      return
    }

    if (estimate.warning) {
      setMemoryWarning(estimate.warning)
    }

    const memCheck = checkMemoryPressure()
    if (memCheck.isHigh && memCheck.warning) {
      setMemoryWarning(memCheck.warning)
    }

    setFile(selectedFile)
    resetFilter()

    const todayNepali = new NepaliDate()
    const todayFormatted = `${String(todayNepali.getDate()).padStart(2, "0")}/${String(todayNepali.getMonth() + 1).padStart(2, "0")}/${todayNepali.getYear()}`
    setFilterDate(todayFormatted)

    // Set shift based on current time when loading file
    const currentShift = getCurrentShift()
    setSelectedShift(currentShift)

    await parseFileWithFilter(selectedFile, todayFormatted)
  }

  const filterByShift = (records: MilkRecord[], shift: ShiftType): MilkRecord[] => {
    return records.filter((record) => {
      const timeStr = record.Coll_time.trim()
      const timeParts = timeStr.split(":")
      if (timeParts.length < 2) return false
      const hour = parseInt(timeParts[0], 10)
      if (isNaN(hour)) return false
      if (shift === "morning") return hour >= 0 && hour < 12
      else if (shift === "evening") return hour >= 12 && hour < 24
      return false
    })
  }

  const calculateShiftStats = (records: MilkRecord[]) => {
    const morning = filterByShift(records, "morning")
    const evening = filterByShift(records, "evening")
    setMorningCount(morning.length)
    setEveningCount(evening.length)
  }

  const applyShiftFilter = (shift: ShiftType) => {
    setSelectedShift(shift)
    const shiftFiltered = filterByShift(dateFilteredRecords, shift)
    setFilteredRecords(shiftFiltered)
  }

  const parseFileWithFilter = async (file: File, dateFilter: string) => {
    setIsProcessing(true)
    setError("")
    memoryMonitor.current.start()

    try {
      const result = await parseFileOptimized(
        file,
        dateFilter,
        (progress: ParseProgress) => {
          setProcessingProgress(progress.progress)
          setProcessingMessage(progress.message)
          setProcessingPhase(progress.phase)
        }
      )

      setDateFilteredRecords(result.records)
      calculateShiftStats(result.records)
      const shiftFiltered = filterByShift(result.records, selectedShift)
      setFilteredRecords(shiftFiltered)
      setFileStats(result.stats)
      setHasFiltered(true)

      const memCheck = checkMemoryPressure()
      if (memCheck.isHigh && memCheck.warning) {
        setMemoryWarning(memCheck.warning)
      }
    } catch (err: any) {
      setError(err.message || "Error parsing file")
      setFilteredRecords([])
      setDateFilteredRecords([])
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
    setDateFilteredRecords([])
    setFileStats(null)
    setHasFiltered(false)
    setSelectedShift(getCurrentShift()) // Reset to current time-based shift
    setMorningCount(0)
    setEveningCount(0)
    setProcessingProgress(0)
    setError("")
    setSuccessMessage("")
    clearMemory(filteredRecords)
  }

  const handleFilter = async () => {
    if (!file || !filterDate) {
      setError("Please select a file and date")
      return
    }
    // Keep current selected shift instead of resetting to morning
    await parseFileWithFilter(file, filterDate)
  }

  const convertRecordsToXLSXFile = (records: MilkRecord[], date: string): File => {
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(records)
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

  const startUploadProgressAnimation = () => {
    let currentProgress = 50
    const maxProgress = 95
    uploadProgressInterval.current = setInterval(() => {
      const remaining = maxProgress - currentProgress
      const increment = Math.max(0.5, remaining * 0.05)
      currentProgress = Math.min(maxProgress, currentProgress + increment)
      setProcessingProgress(Math.round(currentProgress))

      if (currentProgress < 60) setProcessingMessage("Sending data to server...")
      else if (currentProgress < 75) setProcessingMessage("Server processing records...")
      else if (currentProgress < 85) setProcessingMessage("Validating records...")
      else setProcessingMessage("Finalizing upload...")
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
      setError("No records found for the selected date and shift.")
      return
    }

    setError("")
    setSuccessMessage("")
    setIsProcessing(true)
    setProcessingPhase("uploading")
    setProcessingProgress(10)
    setProcessingMessage("Preparing upload...")

    try {
      setProcessingMessage("Converting records to Excel...")
      setProcessingProgress(25)
      await new Promise(resolve => setTimeout(resolve, 300))

      const xlsxFile = convertRecordsToXLSXFile(filteredRecords, `${filterDate}_${selectedShift}`)

      setProcessingProgress(40)
      setProcessingMessage("Uploading to server...")
      startUploadProgressAnimation()

      const response = await milkRecordService.uploadMilkRecords(xlsxFile)

      stopUploadProgressAnimation()
      setProcessingProgress(100)
      setProcessingMessage("Upload complete!")

      setSuccessMessage(
        `✅ Successfully uploaded ${response.data.successRecords} records! 
        ${response.data.failedRecords > 0 ? `(${response.data.failedRecords} failed)` : ""}`
      )

      setTimeout(() => {
        handleRemoveFile()
      }, 3000)

    } catch (err: any) {
      stopUploadProgressAnimation()
      setIsProcessing(false)
      if (err.status === 408 || err.data?.isTimeout) {
        setSuccessMessage("⏳ Upload is taking longer than expected. The server is still processing.")
        setError("")
      } else {
        setError(`❌ ${err.message || "Upload failed. Please try again."}`)
      }
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
      setProcessingMessage("")
    }
  }

  const handleRemoveFile = () => {
    clearMemory(filteredRecords)
    setFile(null)
    setFileStats(null)
    resetFilter()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ----------------------------------------------------------------------
  // NEW UI COMPONENT RENDER
  // ----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">

      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Title / Left */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600" />
              Milk Records Upload
            </h1>
            <p className="mt-2 text-slate-700 text-lg">
              Process, filter, and upload collection data efficiently.
            </p>
          </div>

          {/* Filter / Right (top-right on wide screens) */}
          <div className="w-full md:w-auto">
            <div className="bg-white rounded-lg shadow-sm border border-slate-300 px-5 py-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">Filter Date:</span>
                </div>

                <div className="nepali-datepicker-wrapper min-w-[200px]">
                  <NepaliDatePicker
                    value={filterDate}
                    onChange={setFilterDate}
                    onApply={handleFilter}
                    placeholder="Select date (YYYY/MM/DD)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      <div className="max-w-6xl mx-auto space-y-4 mb-8">
        {successMessage && (
          <div className="rounded-xl bg-green-50 p-4 border border-green-300 shadow-sm flex gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-green-900">Upload Successful</h3>
              <p className="text-sm text-green-800 mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-300 shadow-sm flex gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Operation Failed</h3>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        )}

        {memoryWarning && (
          <div className="rounded-xl bg-amber-50 p-4 border border-amber-300 shadow-sm flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-900">{memoryWarning}</p>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        {!file ? (
          // STATE 1: NO FILE (Big Dropzone)
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center w-full h-96 rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer group
              ${isDragging
                ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                : "border-slate-400 bg-white hover:bg-slate-50 hover:border-blue-400"
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors mb-4">
              <UploadCloud className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload Excel File</h3>
            <p className="text-slate-600 max-w-sm text-center mb-6">
              Drag and drop your milk collection file here, or click to browse.
              <br />
              <span className="text-xs text-slate-500 mt-2 block">Supports .xlsx, .csv, .xls, .dbf</span>
            </p>
            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-lg shadow-blue-200 transition-all">
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.dbf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          // STATE 2: FILE LOADED (Dashboard Layout)
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* LEFT COLUMN: Configuration */}
            <div className="lg:col-span-4 space-y-6">

              {/* File Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-300 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileSpreadsheet className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Current File</p>
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    disabled={isProcessing}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
                >
                  Change File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.dbf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Results & Actions */}
            <div className="lg:col-span-8">
              {hasFiltered ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                  {/* Combined Shift Selector + Results */}
                  <div className="bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden">
                    {/* Shift Selector Tabs - Compact & Professional */}
                    <div className="border-b border-slate-300 bg-slate-100 px-6 py-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Select Shift</h3>
                        <div className="flex gap-2">
                          {[
                            { id: 'morning', label: 'Morning', count: morningCount },
                            { id: 'evening', label: 'Evening', count: eveningCount },
                          ].map((shift) => (
                            <button
                              key={shift.id}
                              onClick={() => applyShiftFilter(shift.id as ShiftType)}
                              className={`
                                px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                                ${selectedShift === shift.id
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-white text-slate-700 border border-slate-400 hover:bg-slate-50'
                                }
                              `}
                            >
                              {shift.label}
                              <span className={`ml-2 text-xs ${selectedShift === shift.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                ({shift.count})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Results Section - Compact */}
                    <div className="p-6">
                      {filteredRecords.length > 0 ? (
                        <div className="space-y-6">
                          {/* Summary */}
                          <div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg border border-slate-300">
                            <div>
                              <p className="text-sm text-slate-700 mb-1">Records Found</p>
                              <p className="text-2xl font-bold text-slate-900">
                                {filteredRecords.length.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-700 mb-1">Shift</p>
                              <p className="text-sm font-semibold text-slate-900 capitalize">{selectedShift}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-700 mb-1">Date</p>
                              <p className="text-sm font-semibold text-slate-900">{filterDate}</p>
                            </div>
                          </div>

                          {/* Upload Button */}
                          <button
                            onClick={handleUpload}
                            disabled={isProcessing}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <UploadCloud className="w-5 h-5" />
                            Upload Records
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-200 rounded-full mb-3">
                            <AlertCircle className="w-8 h-8 text-slate-500" />
                          </div>
                          <h3 className="text-base font-semibold text-slate-900 mb-2">No Records Found</h3>
                          <p className="text-sm text-slate-700 mb-4">
                            No records available for <span className="font-medium">{filterDate}</span> in the <span className="font-medium capitalize">{selectedShift}</span> shift.
                          </p>
                          <button
                            onClick={() => setSelectedShift(selectedShift === 'morning' ? 'evening' : 'morning')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Switch to {selectedShift === 'morning' ? 'Evening' : 'Morning'} shift
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                // Empty State for Right Column
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-400 bg-slate-100">
                  <Calendar className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-slate-600 font-medium">Select a date to preview records</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modern Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-slate-300">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-slate-200 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                <circle
                  className={`stroke-current transition-all duration-300 ${processingPhase === "uploading" ? "text-green-500" : "text-blue-500"}`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * processingProgress) / 100}
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-800">
                {Math.round(processingProgress)}%
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {processingPhase === "reading" && "Reading File..."}
              {processingPhase === "parsing" && "Analyzing Data..."}
              {processingPhase === "uploading" && "Uploading..."}
            </h3>

            <p className="text-slate-600 text-sm mb-6 min-h-[20px]">{processingMessage}</p>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200 rounded-full text-xs font-mono text-slate-700">
              <Clock className="w-3 h-3" />
              {formatElapsedTime(elapsedTime)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}