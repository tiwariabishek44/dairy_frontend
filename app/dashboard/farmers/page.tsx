"use client"

import { useState, useMemo, useEffect } from "react"
import NepaliDate from "nepali-date-converter"
import { Users, User, Phone, Shield, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"
import { farmerService, type Farmer, type FarmerMilkRecord, type FarmerSummary } from "@/lib/services/farmer-service"
import { authService } from "@/lib/services/auth-service"
import { formatAmount } from "@/lib/format"

const NEPALI_MONTHS = [
  "Baishakh", "Jestah", "Aashadh", "Shravan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Phalgun", "Chaitra"
]

export default function FarmersPage() {
  // API state for farmers
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Nepali date filters for farmer details
  const [nepaliMonth, setNepaliMonth] = useState("")
  const [nepaliYear, setNepaliYear] = useState("")
  const [period, setPeriod] = useState("")

  // API state for farmer milk records
  const [milkRecords, setMilkRecords] = useState<FarmerMilkRecord[]>([])
  const [recordsSummary, setRecordsSummary] = useState<FarmerSummary>({
    totalOweAmount: 0,
    totalLiter: 0,
    avgSnf: 0,
    avgFat: 0,
    avgRate: 0,
  })
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)

  const ITEMS_PER_PAGE = 50

  // Load farmers on component mount
  useEffect(() => {
    loadFarmers()
  }, [])

  const loadFarmers = async () => {
    if (!authService.isAuthenticated()) {
      setError('Please login first')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Loading farmers...')
      const farmersData = await farmerService.getAllFarmers()
      console.log('Loaded farmers:', farmersData)

      setFarmers(farmersData)
    } catch (err: any) {
      console.error('Error loading farmers:', err)
      setError(err.message || 'Failed to load farmers')
      setFarmers([])
    } finally {
      setLoading(false)
    }
  }

  const selectedFarmer = farmers.find((f) => f.id === selectedFarmerId)

  // Initialize date filters when viewing farmer details
  useEffect(() => {
    if (selectedFarmerId) {
      const todayNepali = new NepaliDate()
      setNepaliMonth(String(todayNepali.getMonth() + 1).padStart(2, "0"))
      setNepaliYear(String(todayNepali.getYear()))
      setPeriod(todayNepali.getDate() < 16 ? "first" : "second")
    }
  }, [selectedFarmerId])

  // Load farmer milk records when filters change
  useEffect(() => {
    if (selectedFarmer && nepaliMonth && nepaliYear) {
      loadFarmerMilkRecords()
    }
  }, [selectedFarmer, nepaliMonth, nepaliYear])

  const loadFarmerMilkRecords = async () => {
    if (!selectedFarmer || !nepaliMonth || !nepaliYear) return

    try {
      setRecordsLoading(true)
      setRecordsError(null)

      console.log('Loading farmer milk records for:', {
        memberCode: selectedFarmer.memberCode,
        nepaliYear,
        nepaliMonth
      })

      const response = await farmerService.getFarmerMilkRecords(
        selectedFarmer.memberCode,
        nepaliYear,
        nepaliMonth
      )

      console.log('Loaded farmer milk records:', response)

      setMilkRecords(response.records)
      setRecordsSummary(response.summary)
    } catch (err: any) {
      console.error('Error loading farmer milk records:', err)
      setRecordsError(err.message || 'Failed to load farmer milk records')
      setMilkRecords([])
      setRecordsSummary({
        totalOweAmount: 0,
        totalLiter: 0,
        avgSnf: 0,
        avgFat: 0,
        avgRate: 0,
      })
    } finally {
      setRecordsLoading(false)
    }
  }

  // Filter records by period (first/second half)
  const filteredMilkRecords = useMemo(() => {
    if (!period) return milkRecords

    return milkRecords.filter((record) => {
      const recordParts = record.nepaliDate.split("/")
      const recordDay = parseInt(recordParts[0])

      if (period === "first" && recordDay > 15) return false
      if (period === "second" && recordDay <= 15) return false

      return true
    })
  }, [milkRecords, period])

  // Calculate summary for filtered records
  const filteredSummary = useMemo(() => {
    if (filteredMilkRecords.length === 0) {
      return {
        totalOweAmount: 0,
        totalLiter: 0,
        avgSnf: "0.00",
        avgFat: "0.00",
        avgRate: "0",
      }
    }

    return {
      totalOweAmount: filteredMilkRecords.reduce((sum, r) => sum + r.amount, 0),
      totalLiter: filteredMilkRecords.reduce((sum, r) => sum + r.volume, 0),
      avgSnf: (filteredMilkRecords.reduce((sum, r) => sum + r.snf, 0) / filteredMilkRecords.length).toFixed(1),
      avgFat: (filteredMilkRecords.reduce((sum, r) => sum + r.fat, 0) / filteredMilkRecords.length).toFixed(1),
      avgRate: (filteredMilkRecords.reduce((sum, r) => sum + r.rate, 0) / filteredMilkRecords.length).toFixed(1),
    }
  }, [filteredMilkRecords])

  // Individual farmer detail view
  if (selectedFarmerId) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Enhanced Header with Back Button and Farmer Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-6">
                <button
                  onClick={() => setSelectedFarmerId(null)}
                  className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  ← Back to Farmers
                </button>
                <div className="flex-1">
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedFarmer?.username}</h1>
                      <div className="flex items-center gap-6 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-medium">Member Code: {selectedFarmer?.memberCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm font-medium">{selectedFarmer?.phoneNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nepali Date Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Filter Milk Records by Nepali Date</h3>
              <div className="flex gap-6 items-end">
                <div className="flex-1 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nepali Month
                  </label>
                  <select
                    value={nepaliMonth}
                    onChange={(e) => setNepaliMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {NEPALI_MONTHS.map((month, index) => (
                      <option key={index} value={String(index + 1).padStart(2, "0")}>
                        {month} ({String(index + 1).padStart(2, "0")})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nepali Year
                  </label>
                  <select
                    value={nepaliYear}
                    onChange={(e) => setNepaliYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2081">2081</option>
                    <option value="2082">2082</option>
                    <option value="2083">2083</option>
                  </select>
                </div>

                <div className="flex-1 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Month</option>
                    <option value="first">First Half (1-15)</option>
                    <option value="second">Second Half (16-30)</option>
                  </select>
                </div>

                {/* Loading indicator for records */}
                {recordsLoading && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading records...</span>
                  </div>
                )}

                {nepaliMonth && nepaliYear && (
                  <div className="text-xs text-gray-500">
                    <p>Format: {nepaliMonth}/{nepaliYear}</p>
                    <p>Month: {NEPALI_MONTHS[parseInt(nepaliMonth) - 1]}</p>
                  </div>
                )}
              </div>

              {/* Error message for records */}
              {recordsError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{recordsError}</span>
                </div>
              )}
            </div>

            {/* Summary Section - Same style as milk records */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
                <p className="text-sm font-medium text-blue-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900">₹{formatAmount(filteredSummary.totalOweAmount)}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
                <p className="text-sm font-medium text-green-600 mb-1">Total Liter</p>
                <p className="text-2xl font-bold text-green-900">{formatAmount(filteredSummary.totalLiter)}L</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-6">
                <p className="text-sm font-medium text-amber-600 mb-1">Avg SNF</p>
                <p className="text-2xl font-bold text-amber-900">{formatAmount(Number(filteredSummary.avgSnf))}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
                <p className="text-sm font-medium text-purple-600 mb-1">Avg Fat</p>
                <p className="text-2xl font-bold text-purple-900">{formatAmount(Number(filteredSummary.avgFat))}</p>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg border border-rose-200 p-6">
                <p className="text-sm font-medium text-rose-600 mb-1">Avg Rate</p>
                <p className="text-2xl font-bold text-rose-900">₹{formatAmount(Number(filteredSummary.avgRate))}</p>
              </div>
            </div>

            {/* Milk History Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Milk Collection History for {NEPALI_MONTHS[parseInt(nepaliMonth) - 1]} {nepaliYear} {period ? `(${period} half)` : ''}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {recordsLoading ? 'Loading...' : `${filteredMilkRecords.length} records found`}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Date (Nepali)</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Volume</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">SNF</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Fat</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recordsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            <span className="text-gray-600">Loading milk records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredMilkRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          {recordsError ? 'Failed to load records' : 'No milk collection records found for the selected period.'}
                        </td>
                      </tr>
                    ) : (
                      filteredMilkRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 font-mono">{record.nepaliDate}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{record.collectionTime}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatAmount(record.volume)}L</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatAmount(record.snf)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatAmount(record.fat)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">₹{formatAmount(record.rate)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{formatAmount(record.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main farmers list view
  const paginatedFarmers = farmers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const totalPages = Math.ceil(farmers.length / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Enhanced Main Header */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">

                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Farmers Record</h1>
                  <p className="text-lg text-gray-600">Manage and view farmer profiles and their milk collection data</p>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadFarmers}
                disabled={loading}
                className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Farmers Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">All Farmers</h3>
                <span className="text-sm text-gray-500">
                  {loading ? 'Loading...' : `${farmers.length} total farmers`}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-gray-600">Loading farmers...</span>
                </div>
              </div>
            ) : farmers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">
                  {error ? 'Failed to load farmers' : 'No farmers found'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Member Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Contact Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedFarmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">{farmer.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{farmer.memberCode}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{farmer.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{farmer.phoneNumber}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedFarmerId(farmer.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && farmers.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, farmers.length)}</span> of{" "}
                <span className="font-semibold">{farmers.length}</span> farmers
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
