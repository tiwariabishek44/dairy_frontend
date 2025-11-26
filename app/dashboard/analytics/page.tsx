"use client"

import { useState, useEffect } from "react"
import NepaliDate from "nepali-date-converter"
import { Users, Milk, DollarSign, Droplets, Flame, ArrowUp, ArrowDown, Minus, Loader2 } from "lucide-react"
import { formatAmount } from "@/lib/format"
import { farmerService, type FarmerOverviewData, type RankedFarmer } from "@/lib/services/farmer-service"

const NEPALI_MONTHS = [
  "Baishakh",
  "Jestah",
  "Aashadh",
  "Shravan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Phalgun",
  "Chaitra",
]

export default function AnalyticsPage() {
  const [performerType, setPerformerType] = useState("top") // "top" or "bottom"
  const [overviewData, setOverviewData] = useState<FarmerOverviewData | null>(null)
  const [isLoadingOverview, setIsLoadingOverview] = useState(true)
  const [overviewError, setOverviewError] = useState("")
  const [topFarmers, setTopFarmers] = useState<RankedFarmer[]>([])
  const [bottomFarmers, setBottomFarmers] = useState<RankedFarmer[]>([])
  const [isLoadingRanking, setIsLoadingRanking] = useState(true)
  const [rankingError, setRankingError] = useState("")

  // Get current Nepali date
  const todayNepali = new NepaliDate()
  const nepaliYear = todayNepali.getYear()
  const nepaliMonth = todayNepali.getMonth() + 1
  const nepaliDay = todayNepali.getDate()

  // Format: "Month Year" (e.g., "Baishakh 2081")
  const nepaliDisplay = `${NEPALI_MONTHS[todayNepali.getMonth()]} ${nepaliYear}`

  // Period based on Nepali date
  const currentPeriod = nepaliDay < 16 ? "First Half" : "Second Half"
  const currentPeriodApi = nepaliDay < 16 ? "first" : "second"

  // Fetch overview data
  useEffect(() => {
    const fetchOverviewData = async () => {
      setIsLoadingOverview(true)
      setOverviewError("")

      try {
        const response = await farmerService.getFarmerOverview(
          nepaliYear.toString(),
          nepaliMonth.toString(),
          currentPeriodApi
        )

        if (response.success) {
          setOverviewData(response.data)
        } else {
          setOverviewError(response.message || "Failed to load overview data")
        }
      } catch (error: any) {
        console.error("Error fetching overview:", error)
        setOverviewError(error.message || "Failed to load overview data")
      } finally {
        setIsLoadingOverview(false)
      }
    }

    fetchOverviewData()
  }, [nepaliYear, nepaliMonth, currentPeriodApi])

  // Fetch ranking data
  useEffect(() => {
    const fetchRankingData = async () => {
      setIsLoadingRanking(true)
      setRankingError("")

      try {
        const response = await farmerService.getFarmerRanking(
          nepaliYear.toString(),
          nepaliMonth.toString(),
          currentPeriodApi
        )

        if (response.success) {
          setTopFarmers(response.data.top5)
          setBottomFarmers(response.data.bottom5)
        } else {
          setRankingError(response.message || "Failed to load ranking data")
        }
      } catch (error: any) {
        console.error("Error fetching ranking:", error)
        setRankingError(error.message || "Failed to load ranking data")
      } finally {
        setIsLoadingRanking(false)
      }
    }

    fetchRankingData()
  }, [nepaliYear, nepaliMonth, currentPeriodApi])

  const currentFarmers = performerType === "top" ? topFarmers : bottomFarmers

  return (
    <div className="min-h-screen bg-slate-50 ">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-500 mt-1">Overview of dairy collection and performance metrics</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right bg-white border rounded-lg px-4 py-2 shadow-sm">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Nepali Date</p>
                <p className="mt-1 text-sm font-semibold text-blue-900">{nepaliDisplay}</p>
              </div>
              <div className="text-right bg-white border rounded-lg px-4 py-2 shadow-sm">
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Period</p>
                <p className="mt-1 text-sm font-semibold text-purple-900">{currentPeriod}</p>
              </div>
            </div>
          </div>

          {/* Total Metrics - First Row (3 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
              <p className="text-sm font-medium text-blue-600 mb-1">Total Milk Collected</p>
              {isLoadingOverview ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-700">Loading...</p>
                </div>
              ) : overviewError ? (
                <p className="text-sm text-red-600">Error loading data</p>
              ) : (
                <p className="text-2xl font-bold text-blue-900">
                  {formatAmount(overviewData?.totalMilkLiters || 0)}L
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
              <p className="text-sm font-medium text-green-600 mb-1">Total Active Farmers</p>
              {isLoadingOverview ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  <p className="text-sm text-green-700">Loading...</p>
                </div>
              ) : overviewError ? (
                <p className="text-sm text-red-600">Error loading data</p>
              ) : (
                <p className="text-2xl font-bold text-green-900">
                  {overviewData?.totalActiveFarmers || 0}
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
              <p className="text-sm font-medium text-purple-600 mb-1">Total Amount Owed</p>
              {isLoadingOverview ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  <p className="text-sm text-purple-700">Loading...</p>
                </div>
              ) : overviewError ? (
                <p className="text-sm text-red-600">Error loading data</p>
              ) : (
                <p className="text-2xl font-bold text-purple-900">
                  ₹{formatAmount(overviewData?.totalAmountPaid || 0)}
                </p>
              )}
            </div>
          </div>

          {/* Average Metrics - Second Row (3 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-6">
              <p className="text-sm font-medium text-amber-600 mb-1">Avg SNF</p>
              {isLoadingOverview ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                  <p className="text-sm text-amber-700">Loading...</p>
                </div>
              ) : overviewError ? (
                <p className="text-sm text-red-600">Error loading data</p>
              ) : (
                <p className="text-2xl font-bold text-amber-900">
                  {overviewData?.averageSnf?.toFixed(2) || "0.00"}%
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg border border-rose-200 p-6">
              <p className="text-sm font-medium text-rose-600 mb-1">Avg Fat</p>
              {isLoadingOverview ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                  <p className="text-sm text-rose-700">Loading...</p>
                </div>
              ) : overviewError ? (
                <p className="text-sm text-red-600">Error loading data</p>
              ) : (
                <p className="text-2xl font-bold text-rose-900">
                  {overviewData?.averageFat?.toFixed(2) || "0.00"}%
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 p-6">
              <p className="text-sm font-medium text-indigo-600 mb-1">Avg Rate</p>
              {isLoadingOverview ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <p className="text-sm text-indigo-700">Loading...</p>
                </div>
              ) : overviewError ? (
                <p className="text-sm text-red-600">Error loading data</p>
              ) : (
                <p className="text-2xl font-bold text-indigo-900">
                  ₹{overviewData?.averageRate?.toFixed(2) || "0.00"}/L
                </p>
              )}
            </div>
          </div>

          {/* Farmer Performance Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Farmer Performance</h3>
                  <p className="text-sm text-gray-600">
                    {performerType === "top"
                      ? "Highest quality milk producers"
                      : "Lowest performing farmers"
                    }
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Enhanced Toggle Buttons */}
                  <div className="inline-flex bg-gray-200 rounded-lg p-1 shadow-inner">
                    <button
                      onClick={() => setPerformerType("top")}
                      className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md transition-all duration-200 ${performerType === "top"
                        ? "bg-green-600 text-white shadow-lg transform scale-105"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                      Top Performers
                    </button>
                    <button
                      onClick={() => setPerformerType("bottom")}
                      className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md transition-all duration-200 ${performerType === "bottom"
                        ? "bg-amber-600 text-white shadow-lg transform scale-105"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                    >
                      <ArrowDown className="w-4 h-4" />
                      Bottom Performers
                    </button>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-md font-medium">
                      {currentFarmers.length} farmers
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoadingRanking ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Loading farmer rankings...</p>
                  </div>
                </div>
              ) : rankingError ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-sm text-red-600">{rankingError}</p>
                  </div>
                </div>
              ) : currentFarmers.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-gray-500">No farmers found for this period</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Member Code</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Farmer Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">SNF (%)</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Fat (%)</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Rate (₹/L)</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Liters</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentFarmers.map((farmer, index) => (
                      <tr key={farmer.memberCode} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${performerType === "top"
                            ? "bg-gradient-to-br from-green-100 to-emerald-100 text-green-700"
                            : "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700"
                            }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700">{farmer.memberCode}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-800">{farmer.farmerName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700">{farmer.avgSnf.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700">{farmer.avgFat.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700">₹{farmer.avgRate.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-gray-800">{farmer.totalLiters.toFixed(2)}L</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-gray-800">₹{formatAmount(farmer.totalAmount)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}