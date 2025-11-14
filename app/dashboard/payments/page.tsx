"use client"

import { Upload } from "lucide-react"
import { useState, useMemo } from "react"
import NepaliDate from "nepali-date-converter"

export default function PaymentsPage() {
  const now = new Date()
  const nepaliNow = new NepaliDate(now)

  const [currentMonth, setCurrentMonth] = useState(nepaliNow.getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(nepaliNow.getYear())
  const [period, setPeriod] = useState(now.getDate() < 15 ? "first" : "second")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const paymentRecords = [
    {
      id: 1,
      farmerName: "राज कुमार शर्मा",
      memberCode: "001",
      totalLiter: 450,
      milkSell: 4500,
      purchase: 1200,
      finalAmount: 3300,
    },
    {
      id: 2,
      farmerName: "प्रिया सिंह",
      memberCode: "002",
      totalLiter: 380,
      milkSell: 3800,
      purchase: 900,
      finalAmount: 2900,
    },
    {
      id: 3,
      farmerName: "अमित पटेल",
      memberCode: "003",
      totalLiter: 520,
      milkSell: 5200,
      purchase: 1500,
      finalAmount: 3700,
    },
    {
      id: 4,
      farmerName: "संजय गुप्ता",
      memberCode: "004",
      totalLiter: 410,
      milkSell: 4100,
      purchase: 1100,
      finalAmount: 3000,
    },
    {
      id: 5,
      farmerName: "विक्रम वर्मा",
      memberCode: "005",
      totalLiter: 390,
      milkSell: 3900,
      purchase: 950,
      finalAmount: 2950,
    },
    {
      id: 6,
      farmerName: "दिनेश त्रिपाठी",
      memberCode: "006",
      totalLiter: 470,
      milkSell: 4700,
      purchase: 1300,
      finalAmount: 3400,
    },
    {
      id: 7,
      farmerName: "नवीन पांडे",
      memberCode: "007",
      totalLiter: 340,
      milkSell: 3400,
      purchase: 800,
      finalAmount: 2600,
    },
    {
      id: 8,
      farmerName: "राहुल सक्सेना",
      memberCode: "008",
      totalLiter: 500,
      milkSell: 5000,
      purchase: 1400,
      finalAmount: 3600,
    },
    {
      id: 9,
      farmerName: "हरीश कुमार",
      memberCode: "009",
      totalLiter: 420,
      milkSell: 4200,
      purchase: 1000,
      finalAmount: 3200,
    },
    {
      id: 10,
      farmerName: "मोहन लाल",
      memberCode: "010",
      totalLiter: 360,
      milkSell: 3600,
      purchase: 900,
      finalAmount: 2700,
    },
    {
      id: 11,
      farmerName: "अशोक शर्मा",
      memberCode: "011",
      totalLiter: 480,
      milkSell: 4800,
      purchase: 1250,
      finalAmount: 3550,
    },
    {
      id: 12,
      farmerName: "विजय कुमार",
      memberCode: "012",
      totalLiter: 350,
      milkSell: 3500,
      purchase: 850,
      finalAmount: 2650,
    },
    {
      id: 13,
      farmerName: "सुनील वर्मा",
      memberCode: "013",
      totalLiter: 430,
      milkSell: 4300,
      purchase: 1050,
      finalAmount: 3250,
    },
    {
      id: 14,
      farmerName: "अजय गुप्ता",
      memberCode: "014",
      totalLiter: 390,
      milkSell: 3900,
      purchase: 950,
      finalAmount: 2950,
    },
    {
      id: 15,
      farmerName: "राकेश पांडे",
      memberCode: "015",
      totalLiter: 510,
      milkSell: 5100,
      purchase: 1450,
      finalAmount: 3650,
    },
    {
      id: 16,
      farmerName: "प्रदीप सिंह",
      memberCode: "016",
      totalLiter: 370,
      milkSell: 3700,
      purchase: 920,
      finalAmount: 2780,
    },
    {
      id: 17,
      farmerName: "विकास वर्मा",
      memberCode: "017",
      totalLiter: 460,
      milkSell: 4600,
      purchase: 1200,
      finalAmount: 3400,
    },
    {
      id: 18,
      farmerName: "महेंद्र शर्मा",
      memberCode: "018",
      totalLiter: 400,
      milkSell: 4000,
      purchase: 1000,
      finalAmount: 3000,
    },
    {
      id: 19,
      farmerName: "संदीप कुमार",
      memberCode: "019",
      totalLiter: 440,
      milkSell: 4400,
      purchase: 1100,
      finalAmount: 3300,
    },
    {
      id: 20,
      farmerName: "राज वर्मा",
      memberCode: "020",
      totalLiter: 380,
      milkSell: 3800,
      purchase: 950,
      finalAmount: 2850,
    },
  ]

  const filteredRecords = useMemo(() => {
    return paymentRecords.filter((record) => {
      const periodStart = period === "first" ? 1 : 16
      const periodEnd = period === "first" ? 15 : 31
      return currentMonth >= 1 && currentMonth <= 12
    })
  }, [currentMonth, period])

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRecords, currentPage])

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)

  const handleMonthChange = (e) => {
    setCurrentMonth(Number.parseInt(e.target.value))
    setCurrentPage(1)
  }

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value)
    setCurrentPage(1)
  }

  const formatAmount = (amount) => {
    return amount.toString().replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  }

  const nepaliMonthDisplay = `${String(currentMonth).padStart(2, "0")}/${currentYear}`

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Records</h1>
          <p className="text-sm text-gray-500 mt-1">{nepaliMonthDisplay}</p>
          <p className="text-muted-foreground">Track and manage farmer payments</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <Upload size={20} />
          Upload Data
        </button>
      </div>

      <div className="bg-card rounded-lg shadow p-4 flex gap-4 border border-border">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-foreground">Month:</label>
          <select
            value={currentMonth}
            onChange={handleMonthChange}
            className="px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {String(month).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-foreground">Period:</label>
          <select
            value={period}
            onChange={handlePeriodChange}
            className="px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          >
            <option value="first">First Half (1-15)</option>
            <option value="second">Second Half (16-31)</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Farmer Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Member Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Total Liter</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Milk Sell (Rs)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Purchase (Rs)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Final Amount (Rs)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-muted transition-colors">
                <td className="px-6 py-3 text-foreground font-medium">{record.farmerName}</td>
                <td className="px-6 py-3 text-muted-foreground">{record.memberCode}</td>
                <td className="px-6 py-3 text-muted-foreground">{record.totalLiter}L</td>
                <td className="px-6 py-3 text-foreground font-semibold">Rs {formatAmount(record.milkSell)}</td>
                <td className="px-6 py-3 text-muted-foreground">Rs {formatAmount(record.purchase)}</td>
                <td className="px-6 py-3 text-foreground font-bold text-green-600">
                  Rs {formatAmount(record.finalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center gap-2">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-muted"}`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
