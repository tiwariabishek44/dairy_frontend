"use client"

import { Plus } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { formatNepaliMonth } from "@/lib/nepali-date"

const nepaliNames = [
  "राज कुमार",
  "सुरेश शर्मा",
  "राजेश पांडे",
  "विकास गुप्ता",
  "संजय पोखरेल",
  "अमित शर्मा",
  "हरिश पांडे",
  "मोहन कुमार",
  "प्रकाश खत्री",
  "दिपक नेपाली",
  "रमेश सिंह",
  "भीम बहादुर",
  "गोपाल शर्मा",
  "विष्णु पांडे",
  "जीवन कुमार",
  "नारायण सिंह",
  "कृष्ण गुप्ता",
  "रजत शर्मा",
  "सुनील खत्री",
  "उमेश पोखरेल",
  "आनंद कुमार",
  "चंद्र शर्मा",
  "देव सिंह",
  "एडिन्द्र पांडे",
  "फुल बहादुर",
  "गंगा शर्मा",
  "हरि पांडे",
  "राज सिंह",
  "सुमन गुप्ता",
  "प्रेम कुमार",
  "विजय शर्मा",
  "संगीत खत्री",
  "आशीष पोखरेल",
  "कमल सिंह",
  "धर्म पांडे",
  "सोमनाथ शर्मा",
  "बृजेश कुमार",
  "शंभू सिंह",
  "पारस गुप्ता",
  "लोकेश खत्री",
  "माधव पांडे",
  "नीरज शर्मा",
  "अनिल सिंह",
  "आदित्य कुमार",
  "ब्रजेश गुप्ता",
  "संगीता पोखरेल",
  "तरुण शर्मा",
  "उपेन्द्र सिंह",
  "कुमार पांडे",
  "सत्य गुप्ता",
]

export default function FarmersPage() {
  const [farmers, setFarmers] = useState(() => {
    const initialFarmers = []
    for (let i = 1; i <= 75; i++) {
      initialFarmers.push({
        id: i,
        memberCode: String(i).padStart(3, "0"),
        name: nepaliNames[i % nepaliNames.length],
        phone: `98765432${String(i).padStart(2, "0")}`,
        active: i % 5 !== 0,
      })
    }
    return initialFarmers
  })

  const [selectedFarmerId, setSelectedFarmerId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [monthFilter, setMonthFilter] = useState("")
  const [halfFilter, setHalfFilter] = useState("")

  useEffect(() => {
    const today = new Date()
    const currentMonth = today.getMonth().toString()
    const currentDay = today.getDate()
    const currentHalf = currentDay <= 15 ? "first" : "second"

    setMonthFilter(currentMonth)
    setHalfFilter(currentHalf)
  }, [])

  const ITEMS_PER_PAGE = 50

  const mockMilkHistory = [
    { date: "2025-10-31", time: "07:30", totalLiter: 35, snf: 8.2, fat: 3.8, rate: 28, totalRs: 980 },
    { date: "2025-10-30", time: "07:45", totalLiter: 32, snf: 8.0, fat: 3.9, rate: 28, totalRs: 896 },
    { date: "2025-10-29", time: "07:15", totalLiter: 38, snf: 8.3, fat: 3.7, rate: 28, totalRs: 1064 },
    { date: "2025-10-28", time: "08:00", totalLiter: 30, snf: 7.9, fat: 4.0, rate: 27, totalRs: 810 },
    { date: "2025-10-27", time: "07:20", totalLiter: 36, snf: 8.1, fat: 3.8, rate: 28, totalRs: 1008 },
    { date: "2025-10-26", time: "07:50", totalLiter: 33, snf: 8.2, fat: 3.9, rate: 28, totalRs: 924 },
    { date: "2025-10-25", time: "07:35", totalLiter: 34, snf: 8.1, fat: 3.8, rate: 28, totalRs: 952 },
  ]

  const selectedFarmer = farmers.find((f) => f.id === selectedFarmerId)

  const filteredMilkHistory = useMemo(() => {
    return mockMilkHistory.filter((record) => {
      const recordDate = new Date(record.date)
      const day = recordDate.getDate()

      if (monthFilter !== "" && monthFilter !== "all") {
        const recordMonth = recordDate.getMonth()
        const filterMonth = Number.parseInt(monthFilter)
        if (recordMonth !== filterMonth) return false
      }

      if (halfFilter === "first" && day > 15) return false
      if (halfFilter === "second" && day <= 15) return false

      return true
    })
  }, [monthFilter, halfFilter])

  const summary = {
    totalOweAmount: filteredMilkHistory.reduce((sum, r) => sum + r.totalRs, 0),
    totalLiter: filteredMilkHistory.reduce((sum, r) => sum + r.totalLiter, 0),
    avgSnf: (
      filteredMilkHistory.reduce((sum, r) => sum + Number.parseFloat(r.snf), 0) / filteredMilkHistory.length
    ).toFixed(2),
    avgFat: (
      filteredMilkHistory.reduce((sum, r) => sum + Number.parseFloat(r.fat), 0) / filteredMilkHistory.length
    ).toFixed(2),
    avgRate: (filteredMilkHistory.reduce((sum, r) => sum + r.rate, 0) / filteredMilkHistory.length).toFixed(0),
  }

  const displayedNepaliMonth =
    monthFilter && monthFilter !== "all"
      ? formatNepaliMonth(new Date(`2025-${String(Number(monthFilter) + 1).padStart(2, "0")}-01T00:00:00`))
      : ""

  if (selectedFarmerId) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-start gap-6">
          <button
            onClick={() => setSelectedFarmerId(null)}
            className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{selectedFarmer?.name}</h1>
            <p className="text-gray-600 mt-1 text-base">Member Code: {selectedFarmer?.memberCode}</p>
            <p className="text-gray-600">Phone: {selectedFarmer?.phone}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Filter Records</h3>
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month (Nepali Format: mm/yyyy)</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Months</option>
                {[...Array(12)].map((_, i) => {
                  const testDate = new Date(2025, i, 1)
                  return (
                    <option key={i} value={String(i)}>
                      {formatNepaliMonth(testDate)}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={halfFilter}
                onChange={(e) => setHalfFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Days</option>
                <option value="first">First Half (1-15)</option>
                <option value="second">Second Half (16-31)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5">
            <p className="text-gray-700 text-sm font-semibold">Total Owe Amount</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">₹{summary.totalOweAmount}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-5">
            <p className="text-gray-700 text-sm font-semibold">Total Liter</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{summary.totalLiter}L</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-5">
            <p className="text-gray-700 text-sm font-semibold">Avg SNF</p>
            <p className="text-3xl font-bold text-orange-900 mt-2">{summary.avgSnf}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-5">
            <p className="text-gray-700 text-sm font-semibold">Avg Fat</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">{summary.avgFat}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-5">
            <p className="text-gray-700 text-sm font-semibold">Avg Rate</p>
            <p className="text-3xl font-bold text-red-900 mt-2">₹{summary.avgRate}</p>
          </div>
        </div>

        {/* Milk History Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Milk History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Liter</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SNF</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fat</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Rs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMilkHistory.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-900">{record.date}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{record.time}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 font-semibold">{record.totalLiter}L</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{record.snf}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{record.fat}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">₹{record.rate}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 font-semibold">₹{record.totalRs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const paginatedFarmers = farmers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const totalPages = Math.ceil(farmers.length / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farmers Record</h1>
          <p className="text-gray-600 mt-2">View and manage farmer profiles</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors font-medium">
          <Plus size={20} />
          Add Farmer
        </button>
      </div>

      {/* Farmers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Member Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contact Number</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedFarmers.map((farmer) => (
              <tr key={farmer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-gray-900 font-medium">{farmer.memberCode}</td>
                <td className="px-6 py-3 text-gray-900">{farmer.name}</td>
                <td className="px-6 py-3 text-gray-600">{farmer.phone}</td>
                <td className="px-6 py-3">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      farmer.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {farmer.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-3">
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
      </div>

      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-6 py-4">
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
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
