"use client"

import { useState, useMemo, useEffect } from "react"
import { formatAmount } from "@/lib/format"
import { NepaliDatePicker } from "@/components/nepali-date-picker"
import NepaliDate from "nepali-date-converter"
import { milkRecordService, type MilkRecord, type FarmerSummary } from "@/lib/services/milk-record-service"
import { authService } from "@/lib/services/auth-service"
import { Loader2, AlertCircle } from "lucide-react"

const RECORDS_PER_PAGE = 50

const NEPALI_MONTHS = [
  "Baishakh", "Jestah", "Aashadh", "Shravan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Phalgun", "Chaitra"
]

export default function MilkRecordsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState("monthPeriod")
  const [nepaliDate, setNepaliDate] = useState("")
  const [nepaliMonth, setNepaliMonth] = useState("")
  const [nepaliYear, setNepaliYear] = useState("")
  const [period, setPeriod] = useState("")

  // API state for date-based records
  const [records, setRecords] = useState<MilkRecord[]>([])

  // API state for period-based farmer summaries
  const [farmerSummaries, setFarmerSummaries] = useState<FarmerSummary[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set today's Nepali date
    const todayNepali = new NepaliDate()
    const todayFormatted = `${String(todayNepali.getDate()).padStart(2, "0")}/${String(todayNepali.getMonth() + 1).padStart(2, "0")}/${todayNepali.getYear()}`
    setNepaliDate(todayFormatted)

    // Set current Nepali month and year
    setNepaliMonth(String(todayNepali.getMonth() + 1).padStart(2, "0"))
    setNepaliYear(String(todayNepali.getYear()))
    setPeriod(todayNepali.getDate() < 16 ? "first" : "second")
  }, [])

  // Load records when date changes and filter type is dateRange
  useEffect(() => {
    if (filterType === "dateRange" && nepaliDate) {
      loadMilkRecordsByDate(nepaliDate)
    }
  }, [nepaliDate, filterType])

  // Load farmer summaries when period filters change and filter type is monthPeriod
  useEffect(() => {
    if (filterType === "monthPeriod" && nepaliMonth && nepaliYear) {
      loadFarmerSummary()
    }
  }, [nepaliMonth, nepaliYear, period, filterType])

  const loadMilkRecordsByDate = async (date: string) => {
    if (!authService.isAuthenticated()) {
      setError('Please login first')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Loading records for date:', date)
      const data = await milkRecordService.getMilkRecordsByDate(date)
      console.log('Loaded records:', data)

      setRecords(data)
      setFarmerSummaries([]) // Clear summaries when loading records
    } catch (err: any) {
      console.error('Error loading milk records:', err)
      setError(err.message || 'Failed to load milk records')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const loadFarmerSummary = async () => {
    if (!authService.isAuthenticated()) {
      setError('Please login first')
      return
    }

    if (!nepaliMonth || !nepaliYear) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const apiPeriod: "first" | "second" | "full" = period === "" ? "full" : (period as "first" | "second" | "full")

      console.log('Loading farmer summary for:', { nepaliYear, nepaliMonth, period: apiPeriod })
      const data = await milkRecordService.getFarmerSummary(nepaliYear, nepaliMonth, apiPeriod)
      console.log('Loaded farmer summaries:', data)

      setFarmerSummaries(data)
      setRecords([]) // Clear records when loading summaries
    } catch (err: any) {
      console.error('Error loading farmer summary:', err)
      setError(err.message || 'Failed to load farmer summary')
      setFarmerSummaries([])
    } finally {
      setLoading(false)
    }
  }

  // Convert API records to display format for date range view
  const displayRecords = useMemo(() => {
    if (filterType === "dateRange") {
      return records.map((record, index) => ({
        id: record.id,
        sn: index + 1,
        farmerName: record.farmerName,
        memberCode: record.memberCode,
        time: record.collectionTime,
        totalLiter: record.volume,
        snf: record.snf.toFixed(2),
        fat: record.fat.toFixed(2),
        rate: Math.round(record.rate),
        totalAmount: Math.round(record.amount),
      }))
    }
    return []
  }, [records, filterType])

  // Convert farmer summaries to display format for period view
  const displaySummaries = useMemo(() => {
    if (filterType === "monthPeriod") {
      return farmerSummaries.map((summary, index) => ({
        id: summary.memberCode,
        sn: index + 1,
        farmerName: summary.farmerName,
        memberCode: summary.memberCode,
        totalLiter: summary.totalLiters,
        snf: summary.avgSnf.toFixed(2),
        fat: summary.avgFat.toFixed(2),
        rate: Math.round(summary.avgRate),
        totalAmount: Math.round(summary.totalAmount),
      }))
    }
    return []
  }, [farmerSummaries, filterType])

  // Use appropriate data based on filter type
  const displayData = filterType === "dateRange" ? displayRecords : displaySummaries
  const totalPages = Math.ceil(displayData.length / RECORDS_PER_PAGE)
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE
  const endIndex = startIndex + RECORDS_PER_PAGE
  const paginatedRecords = displayData.slice(startIndex, endIndex)

  // Calculate summary metrics based on filter type
  const summaryMetrics = useMemo(() => {
    if (filterType === "dateRange" && records.length > 0) {
      const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
      const totalLiter = records.reduce((sum, r) => sum + r.volume, 0)
      const avgSnf = (records.reduce((sum, r) => sum + r.snf, 0) / records.length).toFixed(2)
      const avgFat = (records.reduce((sum, r) => sum + r.fat, 0) / records.length).toFixed(2)
      const avgRate = Math.round(records.reduce((sum, r) => sum + r.rate, 0) / records.length)

      return { totalAmount, totalLiter, avgSnf, avgFat, avgRate }
    }

    if (filterType === "monthPeriod" && farmerSummaries.length > 0) {
      const totalAmount = farmerSummaries.reduce((sum, s) => sum + s.totalAmount, 0)
      const totalLiter = farmerSummaries.reduce((sum, s) => sum + s.totalLiters, 0)
      const avgSnf = (farmerSummaries.reduce((sum, s) => sum + s.avgSnf, 0) / farmerSummaries.length).toFixed(2)
      const avgFat = (farmerSummaries.reduce((sum, s) => sum + s.avgFat, 0) / farmerSummaries.length).toFixed(2)
      const avgRate = Math.round(farmerSummaries.reduce((sum, s) => sum + s.avgRate, 0) / farmerSummaries.length)

      return { totalAmount, totalLiter, avgSnf, avgFat, avgRate }
    }

    return {
      totalAmount: 0,
      totalLiter: 0,
      avgSnf: "0.00",
      avgFat: "0.00",
      avgRate: 0
    }
  }, [records, farmerSummaries, filterType])

  const handleDateChange = (date: string) => {
    setNepaliDate(date)
    setCurrentPage(1)
    // loadMilkRecordsByDate will be called by useEffect
  }

  const handleFilterTypeChange = (newFilterType: string) => {
    setFilterType(newFilterType)
    setCurrentPage(1)
    setError(null)

    if (newFilterType === "monthPeriod") {
      // Clear previous data
      setRecords([])
      // loadFarmerSummary will be called by useEffect
    } else {
      setFarmerSummaries([])
    }
  }

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    setCurrentPage(1)
    // loadFarmerSummary will be called by useEffect
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Milk Records</h1>
        <p className="text-gray-500 mt-1">View and manage milk collection records</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* <div className="mb-6"> */}
        {/* <label className="block text-sm font-medium text-gray-700 mb-3">Filter Type</label> */}
        {/* <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={filterType === "dateRange"}
                onChange={() => handleFilterTypeChange("dateRange")}
                className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Single Date (Detailed View)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={filterType === "monthPeriod"}
                onChange={() => handleFilterTypeChange("monthPeriod")}
                className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Month & Period (Summary View)</span>
            </label>
          </div> */}
        {/* </div> */}

        {filterType === "dateRange" && (
          <div className="flex gap-6 items-end">
            <div className="flex-1 max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date (dd/mm/yyyy)
              </label>
              <NepaliDatePicker
                value={nepaliDate}
                onChange={handleDateChange}
                placeholder="Select Nepali date"
              />
              {nepaliDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {nepaliDate}
                </p>
              )}
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading records...</span>
              </div>
            )}
          </div>
        )}

        {filterType === "monthPeriod" && (
          <div className="flex gap-6 items-end">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nepali Month
              </label>
              <select
                value={nepaliMonth}
                onChange={(e) => {
                  setNepaliMonth(e.target.value)
                  setCurrentPage(1)
                }}
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
                onChange={(e) => {
                  setNepaliYear(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2078">2078</option>
                <option value="2079">2079</option>
                <option value="2080">2080</option>
                <option value="2081">2081</option>
                <option value="2082">2082</option>
                <option value="2083">2083</option>
              </select>
            </div>

            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Month</option>
                <option value="first">First Half (1-15)</option>
                <option value="second">Second Half (16-30)</option>
              </select>
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading summaries...</span>
              </div>
            )}

            {nepaliMonth && nepaliYear && (
              <div className="text-xs text-gray-500">
                <p>Format: {nepaliMonth}/{nepaliYear}</p>
                <p>Month: {NEPALI_MONTHS[parseInt(nepaliMonth) - 1]}</p>
                {period && <p>Period: {period === 'first' ? 'First Half (1-15)' : period === 'second' ? 'Second Half (16-30)' : 'Full Month'}</p>}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
          <p className="text-sm font-medium text-blue-600 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-blue-900">₹{formatAmount(summaryMetrics.totalAmount)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
          <p className="text-sm font-medium text-green-600 mb-1">Total Liter</p>
          <p className="text-2xl font-bold text-green-900">{formatAmount(summaryMetrics.totalLiter)}L</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-6">
          <p className="text-sm font-medium text-amber-600 mb-1">Avg SNF</p>
          <p className="text-2xl font-bold text-amber-900">{formatAmount(Number(summaryMetrics.avgSnf))}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
          <p className="text-sm font-medium text-purple-600 mb-1">Avg Fat</p>
          <p className="text-2xl font-bold text-purple-900">{formatAmount(Number(summaryMetrics.avgFat))}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg border border-rose-200 p-6">
          <p className="text-sm font-medium text-rose-600 mb-1">Avg Rate</p>
          <p className="text-2xl font-bold text-rose-900">₹{formatAmount(summaryMetrics.avgRate)}</p>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {filterType === "dateRange"
                ? `Detailed Records for ${nepaliDate}`
                : `Farmer Summary for ${NEPALI_MONTHS[parseInt(nepaliMonth) - 1]} ${nepaliYear} ${period ? `(${period} half)` : ''}`
              }
            </h3>
            <span className="text-sm text-gray-500">
              {displayData.length} {filterType === "dateRange" ? "records" : "farmers"} found
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">SN</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Farmer Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Member Code
                </th>
                {filterType === "dateRange" && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Time
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {filterType === "dateRange" ? "Volume" : "Total Liter"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {filterType === "dateRange" ? "SNF" : "Avg SNF"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {filterType === "dateRange" ? "Fat" : "Avg Fat"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {filterType === "dateRange" ? "Rate" : "Avg Rate"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={filterType === "dateRange" ? 9 : 8} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-gray-600">Loading {filterType === "dateRange" ? "records" : "summaries"}...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={filterType === "dateRange" ? 9 : 8} className="px-6 py-8 text-center text-gray-500">
                    {error ? `Failed to load ${filterType === "dateRange" ? "records" : "summaries"}` : `No ${filterType === "dateRange" ? "records" : "farmers"} found for the selected ${filterType === "dateRange" ? "date" : "period"}.`}
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{record.sn}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.farmerName}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{record.memberCode}</td>
                    {filterType === "dateRange" && (
                      <td className="px-6 py-4 text-sm text-gray-600">{(record as any).time}</td>
                    )}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatAmount(record.totalLiter)}L</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.snf}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.fat}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{formatAmount(record.rate)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{formatAmount(record.totalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && displayData.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, displayData.length)} of {displayData.length} {filterType === "dateRange" ? "records" : "farmers"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page
                  if (totalPages <= 5) {
                    page = i + 1
                  } else {
                    const start = Math.max(1, currentPage - 2)
                    const end = Math.min(totalPages, start + 4)
                    page = start + i
                    if (page > end) return null
                  }

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
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
