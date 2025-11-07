"use client"

import { formatNepaliDate, getNepaliPeriod } from "@/lib/nepali-date"
import { TrendingUp, Users, Milk, DollarSign, Droplets, Flame } from "lucide-react"

export default function AnalyticsPage() {
  const now = new Date()
  const nepaliDisplay = formatNepaliDate(now)
  const currentPeriod = getNepaliPeriod(now)

  const kpis = [
    {
      label: "Total Milk Collected",
      value: "12,450 L",
      icon: Milk,
      color: "bg-blue-500",
    },
    {
      label: "Total Active Farmers",
      value: "156",
      icon: Users,
      color: "bg-green-500",
    },
    {
      label: "Total Amount Owed",
      value: "₹1,85,600",
      icon: DollarSign,
      color: "bg-red-500",
    },
  ]

  const averageMetrics = [
    {
      label: "Average SNF",
      value: "8.2 %",
      unit: "Solids Not Fat",
      icon: Droplets,
      color: "bg-cyan-500",
    },
    {
      label: "Average Fat",
      value: "4.5 %",
      unit: "Milk Fat",
      icon: Flame,
      color: "bg-orange-500",
    },
    {
      label: "Average Rate",
      value: "₹32/L",
      unit: "Price per Liter",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ]

  const topFarmers = [
    { name: "Rajesh Kumar", snf: "8.8%", fat: "4.8%", rate: "₹35/L", totalLiter: "520 L" },
    { name: "Priya Singh", snf: "8.6%", fat: "4.6%", rate: "₹34/L", totalLiter: "480 L" },
    { name: "Vikram Patel", snf: "8.5%", fat: "4.5%", rate: "₹33/L", totalLiter: "450 L" },
    { name: "Anita Verma", snf: "8.4%", fat: "4.4%", rate: "₹32/L", totalLiter: "420 L" },
    { name: "Suresh Yadav", snf: "8.3%", fat: "4.3%", rate: "₹31/L", totalLiter: "390 L" },
  ]

  const lowFarmers = [
    { name: "Mohan Das", snf: "7.2%", fat: "3.8%", rate: "₹25/L", totalLiter: "180 L" },
    { name: "Harish Nair", snf: "7.3%", fat: "3.9%", rate: "₹26/L", totalLiter: "195 L" },
    { name: "Dinesh Kumar", snf: "7.4%", fat: "4.0%", rate: "₹27/L", totalLiter: "210 L" },
    { name: "Kavya Reddy", snf: "7.5%", fat: "4.1%", rate: "₹28/L", totalLiter: "225 L" },
    { name: "Ramesh Singh", snf: "7.6%", fat: "4.2%", rate: "₹29/L", totalLiter: "240 L" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-4 mt-3">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
            {nepaliDisplay}
          </span>
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
            {currentPeriod}
          </span>
        </div>
        <p className="text-gray-600 mt-2">Overview of dairy center performance and statistics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{kpi.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                </div>
                <div className={`${kpi.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Average Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {averageMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">{metric.label}</h3>
                <div className={`${metric.color} p-2 rounded-lg`}>
                  <Icon className="text-white" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-gray-500 text-sm mt-1">{metric.unit}</p>
            </div>
          )
        })}
      </div>

      {/* Top 5 Farmers Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Farmers</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Farmer Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SNF</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fat</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Liter</th>
              </tr>
            </thead>
            <tbody>
              {topFarmers.map((farmer, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{farmer.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{farmer.snf}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{farmer.fat}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{farmer.rate}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">{farmer.totalLiter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low 5 Farmers Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Low 5 Farmers</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Farmer Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SNF</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fat</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Liter</th>
              </tr>
            </thead>
            <tbody>
              {lowFarmers.map((farmer, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{farmer.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{farmer.snf}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{farmer.fat}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{farmer.rate}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-orange-600">{farmer.totalLiter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
