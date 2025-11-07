"use client"

import type React from "react"
import { useState, useRef } from "react"
import { NepaliDatePicker } from "@/components/nepali-date-picker"
import { parseFile, getFileStats } from "@/lib/excel-parser"

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
    if (e.target.files?.length > 0) {
      handleFileLoad(e.target.files[0])
    }
  }

  const handleFileLoad = async (selectedFile: File) => {
    setFile(selectedFile)
    resetFilter()

    // Get file statistics
    setIsLoading(true)
    setLoadingMessage("Analyzing file...")
    try {
      const stats = await getFileStats(selectedFile)
      setFileStats(stats)
    } catch (error) {
      console.error("Error analyzing file:", error)
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

    console.log("Filtering with date:", filterDate)

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Milk Record Manager</h1>
                <p className="text-slate-600 text-base">Upload, filter, and manage your milk collection records efficiently</p>
              </div>
            </div>

            {/* Date Picker in Top Right */}
            {file && (
              <div className="w-80">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
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

          <div className="flex flex-wrap gap-3">
            {fileStats && (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-100 rounded-xl shadow-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Total Records:</span>
                  <span className="text-sm font-bold text-slate-900">{fileStats.totalRecords.toLocaleString()}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-purple-100 rounded-xl shadow-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Unique Dates:</span>
                  <span className="text-sm font-bold text-slate-900">{fileStats.uniqueDates}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full">
          {/* File Upload Section */}
          <div className="space-y-6">
            <div className={`bg-white rounded-3xl shadow-sm border-2 border-slate-100 ${hasFiltered && recordCount > 0 ? "p-4 md:p-6" : "p-8"}`}>
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h2 className="text-xl font-bold text-slate-900">Upload Your File</h2>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl text-center transition-all duration-300 ${isDragging
                  ? "border-blue-400 bg-blue-50 scale-[1.01]"
                  : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/50"
                  } ${hasFiltered && recordCount > 0 ? "p-6" : "p-10"}`}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className={`inline-flex items-center justify-center ${hasFiltered && recordCount > 0 ? "w-16 h-16" : "w-20 h-20"} bg-gradient-to-br from-green-400 to-green-500 rounded-2xl shadow-lg`}>
                      <svg className={`${hasFiltered && recordCount > 0 ? "w-8 h-8" : "w-10 h-10"} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-green-600 mb-1">File Ready</div>
                      <div className={`font-bold text-slate-900 mb-1 ${hasFiltered && recordCount > 0 ? "text-lg" : "text-lg"}`}>{file.name}</div>
                      <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-sm text-slate-600">
                        {file.size > 1024 * 1024
                          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                          : `${(file.size / 1024).toFixed(2)} KB`}
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
                      className="mt-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl font-semibold transition-all"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className={`inline-flex items-center justify-center ${hasFiltered && recordCount > 0 ? "w-16 h-16" : "w-20 h-20"} bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl`}>
                      <svg className={`${hasFiltered && recordCount > 0 ? "w-8 h-8" : "w-10 h-10"} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <div className={`font-bold text-slate-900 mb-2 ${hasFiltered && recordCount > 0 ? "text-lg" : "text-xl"}`}>Drop your file here</div>
                      <div className="text-slate-500 text-sm mb-4">or browse from your computer</div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`inline-flex items-center gap-2 ${hasFiltered && recordCount > 0 ? "px-4 py-2 text-sm" : "px-6 py-3"} bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:scale-105`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Browse Files
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        CSV, XLSX, XLS
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span>Max 100K+ records</span>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Results Section - Shown at bottom of file upload component */}
              {hasFiltered && !isLoading && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {recordCount > 0 ? (
                    <div className="relative overflow-hidden p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border-2 border-green-200 rounded-2xl">
                      <div className="absolute top-0 right-0 w-32 h-20 bg-green-200 rounded-full blur-3xl opacity-30"></div>
                      <div className="relative flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-green-600 mb-2">Records Found</div>
                          <div className="text-5xl font-bold text-green-700 mb-3">{recordCount.toLocaleString()}</div>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-green-200 rounded-lg">
                            <svg className="w-4 h- text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-semibold text-slate-900">{filterDate}</span>
                          </div>
                          {fileStats && (
                            <div className="mt-3 text-sm text-green-700">
                              {((recordCount / fileStats.totalRecords) * 100).toFixed(1)}% of total records
                            </div>
                          )}
                        </div>
                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-3xl flex items-center justify-center shadow-xl">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl">
                      <div className="flex items-start gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-amber-900 font-bold text-xl mb-2">No Records Found</div>
                          <div className="text-amber-800 text-base mb-4">
                            No records matched the date: <span className="font-bold">{filterDate}</span>
                          </div>
                          <div className="space-y-2 text-sm text-amber-700">
                            <div className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5"></div>
                              <span>Verify the date format in your file is: dd/mm/yyyy</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5"></div>
                              <span>Check the Ne_date column contains the correct date</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5"></div>
                              <span>Try selecting a different date from your file</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upload Button - Full Width Below */}
            {hasFiltered && !isLoading && recordCount > 0 && (
              <button
                onClick={handleUpload}
                className="w-full px-8 py-5 bg-gradient-to-r from-green-600 via-green-600 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:from-green-700 hover:via-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload {recordCount.toLocaleString()} Records</span>
                </div>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Loading Modal with White-Grey Transparent Backdrop */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4 border-2 border-slate-200">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative w-28 h-28">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                {processingProgress > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">{processingProgress}%</span>
                  </div>
                )}
              </div>

              <div className="text-center w-full">
                <p className="text-slate-900 font-bold text-2xl mb-2">Please Wait</p>
                <p className="text-slate-600 text-base mb-1">{loadingMessage}</p>
                {processingProgress === 0 && (
                  <p className="text-slate-500 text-sm">This may take a moment...</p>
                )}

                {processingProgress > 0 && (
                  <div className="mt-6 w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 h-full transition-all duration-300 ease-out rounded-full shadow-sm"
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