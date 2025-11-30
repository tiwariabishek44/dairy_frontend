"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { AlertCircle, CheckCircle, Upload, X, Users, List, FileUp, RefreshCw, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { farmerService, type UploadedFarmer } from "@/lib/services/farmer-service"

type TabType = "upload" | "list"

export default function FarmerRecordUploadPage() {
  const [activeTab, setActiveTab] = useState<TabType>("upload")
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [farmers, setFarmers] = useState<UploadedFarmer[]>([])
  const [isLoadingFarmers, setIsLoadingFarmers] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [elapsedTime, setElapsedTime] = useState(0)
  const itemsPerPage = 50
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerInterval = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
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

  const handleFileLoad = (selectedFile: File) => {
    setError("")
    setSuccessMessage("")

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload a CSV, XLSX, or XLS file.")
      return
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError("File size exceeds 100MB limit.")
      return
    }

    setFile(selectedFile)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected")
      return
    }

    setError("")
    setSuccessMessage("")
    setIsProcessing(true)
    setProcessingMessage("Preparing upload...")
    setProcessingProgress(20)

    // Defer the actual upload to let the UI update first
    setTimeout(async () => {
      try {
        console.log(`[FARMER UPLOAD] Uploading file: ${file.name}`)

        setProcessingMessage("Uploading Excel file to server...")
        setProcessingProgress(50)

        // Upload using farmer service
        const response = await farmerService.uploadFarmerRecords(file)

        console.log("[FARMER UPLOAD] Response:", response)
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
              setFile(null)
              setSuccessMessage("")
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
        console.error("[FARMER UPLOAD ERROR]", err)
        // Close modal and show error
        setIsProcessing(false)
        setProcessingProgress(0)
        setProcessingMessage("")
        setError(err.message || "Upload failed. Please try again.")
      }
    }, 100) // 100ms delay to ensure UI updates
  }

  const handleRemoveFile = () => {
    setFile(null)
    setError("")
    setSuccessMessage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const loadFarmers = async () => {
    setIsLoadingFarmers(true)
    setError("")
    setCurrentPage(1) // Reset to first page when loading
    try {
      const data = await farmerService.getUploadedFarmers()
      setFarmers(data)
    } catch (err: any) {
      console.error("[LOAD FARMERS ERROR]", err)
      setError(err.message || "Failed to load farmers")
    } finally {
      setIsLoadingFarmers(false)
    }
  }

  useEffect(() => {
    if (activeTab === "list") {
      loadFarmers()
    }
  }, [activeTab])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Sort farmers by member code
  const sortedFarmers = [...farmers].sort((a, b) => {
    // Convert to numbers for proper numeric sorting
    const numA = parseInt(a.memberCode) || 0
    const numB = parseInt(b.memberCode) || 0
    return numA - numB
  })

  // Pagination calculations
  const totalPages = Math.ceil(sortedFarmers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentFarmers = sortedFarmers.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-1">
                Farmer Records Management
              </h1>
              <p className="text-sm text-slate-600">
                Upload and manage farmer records
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab("upload")
                  setError("")
                  setSuccessMessage("")
                }}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === "upload"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <FileUp className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={() => {
                  setActiveTab("list")
                  setError("")
                  setSuccessMessage("")
                }}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === "list"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <List className="w-4 h-4" />
                Farmer List
              </button>
            </nav>
          </div>
        </div>

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

        {/* Upload Tab Content */}
        {activeTab === "upload" && (
          <>
            {/* Upload Zone */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                  ? "border-green-400 bg-green-50"
                  : "border-slate-200 hover:border-green-300"
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
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select File
                </button>
                <p className="text-xs text-slate-500 mt-3">
                  CSV, XLSX, XLS • Max 100MB
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

            {/* Upload Button */}
            {file && !isProcessing && (
              <button
                onClick={handleUpload}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Farmer Records
              </button>
            )}
          </>
        )}

        {/* Farmer List Tab Content */}
        {activeTab === "list" && (
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Header with refresh button */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Uploaded Farmers</h2>
                <p className="text-sm text-slate-600">
                  Total: {farmers.length} farmers
                  {farmers.length > 0 && ` • Showing ${startIndex + 1}-${Math.min(endIndex, farmers.length)}`}
                </p>
              </div>
              <button
                onClick={loadFarmers}
                disabled={isLoadingFarmers}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingFarmers ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Loading state */}
            {isLoadingFarmers && (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
                <p className="text-slate-600">Loading farmers...</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoadingFarmers && farmers.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">No farmers uploaded yet</p>
                <p className="text-sm text-slate-500">Upload farmer records to see them here</p>
              </div>
            )}

            {/* Table */}
            {!isLoadingFarmers && farmers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentFarmers.map((farmer) => (
                      <tr key={farmer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {farmer.memberCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {farmer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {farmer.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(farmer.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!isLoadingFarmers && farmers.length > 0 && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                {/* Previous Button */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                  {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                          ...
                        </span>
                      )
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page as number)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition ${currentPage === page
                          ? "bg-green-600 text-white"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
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
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 border-r-green-600 animate-spin"
                  style={{ animationDuration: '0.8s' }}
                />
              </div>

              {/* Status */}
              <div className="text-center w-full">
                <p className="text-lg font-bold text-green-700 mb-2">
                  Uploading Farmer Records...
                </p>
                <p className="text-sm text-gray-600 mb-3">{processingMessage}</p>

                {/* Timer Display */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-mono font-semibold text-gray-700">
                    {formatElapsedTime(elapsedTime)}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Please wait, this may take a moment
                  <span className="inline-flex ml-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
