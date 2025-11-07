"use client"
import { useState, useMemo, useEffect } from "react"
import { formatAmount } from "@/lib/format"
import { formatNepaliDate, formatNepaliMonth } from "@/lib/nepali-date"
import { NepaliDatePicker } from "@/components/nepali-date-picker"

const RECORDS_PER_PAGE = 50

const FARMER_NAMES = [
  "राजेश कुमार",
  "प्रिया शर्मा",
  "अमित पटेल",
  "विक्रम सिंह",
  "नेहा शर्मा",
  "संजय गुप्ता",
  "निशा वर्मा",
  "राज कुल्मी",
  "प्रमोद पाठक",
  "रिषि रवि",
]

export default function MilkRecordsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState("dateRange")
  const [singleDate, setSingleDate] = useState("")
  const [month, setMonth] = useState("")
  const [period, setPeriod] = useState("")

  useEffect(() => {
    const today = new Date()
    const todayString = today.toISOString().split("T")[0]
    setSingleDate(todayString)

    const monthString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
    setMonth(monthString)
    setPeriod(today.getDate() < 15 ? "first" : "second")
  }, [])

  const [records, setRecords] = useState(
    Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      sn: i + 1,
      farmerName: FARMER_NAMES[i % FARMER_NAMES.length],
      memberCode: String(i + 1).padStart(3, "0"),
      date: new Date(2025, 9, Math.floor(i / 5) + 1).toISOString().split("T")[0],
      time: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      totalLiter: Math.round(Math.random() * 60 + 20),
      snf: (Math.random() * 0.5 + 8.0).toFixed(2),
      fat: (Math.random() * 0.5 + 3.5).toFixed(2),
      rate: Math.round(Math.random() * 15 + 25),
      totalAmount: Math.round(Math.random() * 1000 + 500),
    })),
  )

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (filterType === "dateRange") {
        if (singleDate && record.date !== singleDate) return false
      } else if (filterType === "monthPeriod") {
        if (month) {
          const recordMonth = record.date.substring(0, 7)
          if (recordMonth !== month) return false

          if (period) {
            const day = Number.parseInt(record.date.split("-")[2])
            if (period === "first" && day >= 15) return false
            if (period === "second" && day < 15) return false
          }
        }
      }
      return true
    })
  }, [records, filterType, singleDate, month, period])

  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE)
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE
  const endIndex = startIndex + RECORDS_PER_PAGE
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("File uploaded:", file.name)
    }
  }

  const summaryMetrics = useMemo(() => {
    const totalAmount = filteredRecords.reduce((sum, r) => sum + r.totalAmount, 0)
    const totalLiter = filteredRecords.reduce((sum, r) => sum + r.totalLiter, 0)
    const avgSnf =
      filteredRecords.length > 0
        ? (filteredRecords.reduce((sum, r) => sum + Number.parseFloat(r.snf), 0) / filteredRecords.length).toFixed(2)
        : "0.00"
    const avgFat =
      filteredRecords.length > 0
        ? (filteredRecords.reduce((sum, r) => sum + Number.parseFloat(r.fat), 0) / filteredRecords.length).toFixed(2)
        : "0.00"
    const avgRate =
      filteredRecords.length > 0
        ? Math.round(filteredRecords.reduce((sum, r) => sum + r.rate, 0) / filteredRecords.length)
        : 0

    return { totalAmount, totalLiter, avgSnf, avgFat, avgRate }
  }, [filteredRecords])

  const displayedDate = singleDate ? formatNepaliDate(new Date(singleDate + "T00:00:00")) : ""
  const displayedNepaliMonth = month ? formatNepaliMonth(new Date(month + "-01T00:00:00")) : ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Milk Records</h1>
        <p className="text-gray-500 mt-1">View and manage milk collection records</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Filter Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={filterType === "dateRange"}
                onChange={() => {
                  setFilterType("dateRange")
                  setCurrentPage(1)
                }}
                className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Single Date</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={filterType === "monthPeriod"}
                onChange={() => {
                  setFilterType("monthPeriod")
                  setCurrentPage(1)
                }}
                className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Month & Period (Nepali)</span>
            </label>
          </div>
        </div>

        {filterType === "dateRange" && (
          <div className="flex gap-6 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date (Nepali)</label>
              <NepaliDatePicker
                value={singleDate}
                onChange={(date) => {
                  setSingleDate(date)
                  setCurrentPage(1)
                }}
              />
              {singleDate && <p className="text-xs text-gray-500 mt-1">Nepali Date: {displayedDate}</p>}
            </div>
          </div>
        )}

        {filterType === "monthPeriod" && (
          <div className="flex gap-6 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Month (Nepali: mm/yyyy)</label>
              <select
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[...Array(12)].map((_, i) => {
                  const testDate = new Date(2025, i, 1)
                  return (
                    <option key={i} value={`2025-${String(i + 1).padStart(2, "0")}`}>
                      {formatNepaliMonth(testDate)}
                    </option>
                  )
                })}
              </select>
              {displayedNepaliMonth && <p className="text-xs text-gray-500 mt-1">Selected: {displayedNepaliMonth}</p>}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="first">First Half (1-15)</option>
                <option value="second">Second Half (16-31)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
          <p className="text-sm font-medium text-blue-600 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-blue-900">₹{formatAmount(summaryMetrics.totalAmount)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
          <p className="text-sm font-medium text-green-600 mb-1">Total Liter</p>
          <p className="text-2xl font-bold text-green-900">{summaryMetrics.totalLiter}L</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-6">
          <p className="text-sm font-medium text-amber-600 mb-1">Avg SNF</p>
          <p className="text-2xl font-bold text-amber-900">{summaryMetrics.avgSnf}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
          <p className="text-sm font-medium text-purple-600 mb-1">Avg Fat</p>
          <p className="text-2xl font-bold text-purple-900">{summaryMetrics.avgFat}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg border border-rose-200 p-6">
          <p className="text-sm font-medium text-rose-600 mb-1">Avg Rate</p>
          <p className="text-2xl font-bold text-rose-900">₹{summaryMetrics.avgRate}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">SN</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Farmer Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Mem_Code
                </th>
                {filterType === "dateRange" && (
                  <>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Time
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Liter
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">SNF</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Fat</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{record.sn}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.farmerName}</td>
                  <td className="px-3 py-4 text-sm text-gray-600">{record.memberCode}</td>
                  {filterType === "dateRange" && (
                    <>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {formatNepaliDate(new Date(record.date + "T00:00:00"))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.time}</td>
                    </>
                  )}
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.totalLiter}L</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.snf}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.fat}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{record.rate}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{formatAmount(record.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} records
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
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
      </div>
    </div>
  )
}
