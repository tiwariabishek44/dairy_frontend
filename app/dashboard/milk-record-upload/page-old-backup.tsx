"use client"

import type React from "react"
import { useState, useRef } from "react"
import { NepaliDatePicker } from "@/components/nepali-date-picker"
import { parseFile, getFileStats } from "@/lib/excel-parser"
import NepaliDate from "nepali-date-converter"

// Types for milk record data
interface MilkRecord {
  Sr_no: string
  Coll_Date: string
  Ne_date: string
  Ses_code: string
  Coll_time: string
  Mem_code: string
  Category: string
  Volume_lt: string
  Fat_per: string
  Clr: string
  Snf: string
  Protien: string
  Kg_fat: string
  Kg_snf: string
  Rate: string
  Kg_rate: string
  Snf_rate: string
  Ts_comm: string
  Amount: string
  Remark: string
}

interface FileStats {
  totalRecords: number
  uniqueDates: number
}

export default function MilkRecordUploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [filterDate, setFilterDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Processing...")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [recordCount, setRecordCount] = useState(0)
  const [filteredRecords, setFilteredRecords] = useState<MilkRecord[]>([])
  const [hasFiltered, setHasFiltered] = useState(false)
  const [fileStats, setFileStats] = useState<FileStats | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setFile(selectedFile)
    resetFilter()

    // Get file statistics first
    setIsLoading(true)
    setLoadingMessage("Analyzing file...")
    try {
      const stats = await getFileStats(selectedFile)
      setFileStats(stats)

      // Auto-set today's Nepali date and filter
      const todayNepali = new NepaliDate()
      const todayFormatted = `${String(todayNepali.getDate()).padStart(2, "0")}/${String(todayNepali.getMonth() + 1).padStart(2, "0")}/${todayNepali.getYear()}`

      setFilterDate(todayFormatted)

      // Automatically filter with today's date
      setLoadingMessage("Filtering records for today...")
      const filtered = await parseFile(selectedFile, todayFormatted)

      setFilteredRecords(filtered)
      setRecordCount(filtered.length)
      setHasFiltered(true)

      console.log("Auto-filtered with today's date:", todayFormatted, "Records found:", filtered.length)

    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing file. Please ensure it's a valid CSV or Excel file with correct format.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetFilter = () => {
    setFilterDate("")
    setRecordCount(0)
    setFilteredRecords([])
    setHasFiltered(false)
    setProcessingProgress(0)
  }

  const handleFilter = async () => {
    if (!file || !filterDate) {
      alert("Please select a file and enter a date")
      return
    }

    console.log("Manual filtering with date:", filterDate)

    setIsLoading(true)
    setLoadingMessage("Filtering data...")
    setProcessingProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const filtered = await parseFile(file, filterDate)

      console.log("Filtered records:", filtered.length)

      clearInterval(progressInterval)
      setProcessingProgress(100)

      await new Promise((resolve) => setTimeout(resolve, 300))

      setFilteredRecords(filtered)
      setRecordCount(filtered.length)
      setHasFiltered(true)
    } catch (error) {
      console.error("File parsing error:", error)
      alert("Error processing file. Please ensure it's a valid CSV or Excel file with correct format.")
      setRecordCount(0)
      setFilteredRecords([])
      setHasFiltered(true)
    } finally {
      setIsLoading(false)
      setProcessingProgress(0)
    }
  }

  const handleUpload = async () => {
    if (recordCount === 0) {
      alert("No records to upload")
      return
    }

    setIsLoading(true)
    setLoadingMessage("Uploading records...")
    setProcessingProgress(0)

    try {
      const batchSize = 1000
      const batches = Math.ceil(filteredRecords.length / batchSize)

      for (let i = 0; i < batches; i++) {
        const batch = filteredRecords.slice(i * batchSize, (i + 1) * batchSize)

        // TODO: Replace with your actual API endpoint
        // await fetch('/api/upload-milk-records', { 
        //   method: 'POST', 
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ 
        //     batch, 
        //     batchNumber: i + 1, 
        //     totalBatches: batches,
        //     filterDate: filterDate,
        //     totalRecords: recordCount
        //   }) 
        // })

        await new Promise((resolve) => setTimeout(resolve, 100))

        const progress = Math.round(((i + 1) / batches) * 100)
        setProcessingProgress(progress)
      }

      setIsLoading(false)
      alert(`Successfully uploaded ${recordCount.toLocaleString()} records!`)

      // Reset form
      setFile(null)
      setFileStats(null)
      resetFilter()
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Error uploading records. Please try again.")
      setIsLoading(false)
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
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 mb-1">Milk Record Manager</h1>
                <p className="text-sm text-slate-600">Upload, filter and manage milk collection records</p>
              </div>
            </div>

            {/* Date Picker in Top Right */}
            {file && (
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

        {/* Main Upload Component */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* File Drop Zone - Always same size */}
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
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-base font-medium text-slate-900 mb-1">Drop your file here</p>
            <p className="text-sm text-slate-600 mb-4">or click to browse</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              Select File
            </button>
            <p className="text-xs text-slate-500 mt-3">CSV, XLSX, XLS files supported • Auto-filters by today's date</p>
          </div>

          {/* Selected File Info - Only show when file is selected */}
          {file && (
            <div className="mt-4 flex items-center justify-between p-3 border rounded-md bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">{file.name}</div>
                  <div className="text-xs text-slate-600">
                    {file.size > 1024 * 1024
                      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                      : `${(file.size / 1024).toFixed(2)} KB`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null)
                  setFileStats(null)
                  resetFilter()
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Remove
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

        {/* Results - shown after filtering */}
        {hasFiltered && !isLoading && (
          <div className="mb-6">
            {recordCount > 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 font-medium">Records Found</div>
                    <div className="text-2xl font-bold text-green-800">{recordCount.toLocaleString()}</div>
                    <div className="text-sm text-green-600">Date: {filterDate}</div>
                    {fileStats && (
                      <div className="text-xs text-green-600 mt-1">
                        {((recordCount / fileStats.totalRecords) * 100).toFixed(1)}% of total
                      </div>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-md flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-amber-900 text-sm">No Records Found</div>
                    <div className="text-sm text-amber-800 mb-2">
                      No records found for date: <span className="font-medium">{filterDate}</span>
                    </div>
                    <div className="text-xs text-amber-700 space-y-1">
                      <div>• Verify date format is dd/mm/yyyy in Ne_date column</div>
                      <div>• Try selecting a different date from your file</div>
                      <div>• Check if records exist for today's date</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        {hasFiltered && !isLoading && recordCount > 0 && (
          <button
            onClick={handleUpload}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Upload {recordCount.toLocaleString()} Records for {filterDate}
          </button>
        )}
      </div>

      {/* Loading Modal */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                {processingProgress > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{processingProgress}%</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-900">{loadingMessage}</p>
                {processingProgress > 0 && (
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}