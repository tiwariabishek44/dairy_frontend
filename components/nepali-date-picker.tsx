"use client"

import { useState, useRef, useEffect } from "react"

interface NepaliDatePickerProps {
  value: string
  onChange: (date: string) => void
  onApply?: () => void
  placeholder?: string
}

export function NepaliDatePicker({ value, onChange, onApply, placeholder = "Select Date" }: NepaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const defaultYear = 2082 // Fixed year
  const months = [
    { num: 1, name: "Baisakh", short: "Bai" },
    { num: 2, name: "Jestha", short: "Jes" },
    { num: 3, name: "Ashadh", short: "Ash" },
    { num: 4, name: "Shrawan", short: "Shr" },
    { num: 5, name: "Bhadra", short: "Bha" },
    { num: 6, name: "Ashwin", short: "Asw" },
    { num: 7, name: "Kartik", short: "Kar" },
    { num: 8, name: "Mangsir", short: "Man" },
    { num: 9, name: "Poush", short: "Pou" },
    { num: 10, name: "Magh", short: "Mag" },
    { num: 11, name: "Falgun", short: "Fal" },
    { num: 12, name: "Chaitra", short: "Cha" },
  ]

  const daysInMonth = selectedMonth ? (selectedMonth <= 8 ? 31 : selectedMonth === 9 ? 30 : 29) : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  useEffect(() => {
    if (value) {
      const parts = value.split("/")
      if (parts.length === 3) {
        setSelectedDay(parseInt(parts[0]))
        setSelectedMonth(parseInt(parts[1]))
      }
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleClear = () => {
    setSelectedDay(null)
    setSelectedMonth(null)
    onChange("")
    setIsOpen(false)
  }

  const handleApply = () => {
    if (selectedDay && selectedMonth) {
      const day = selectedDay.toString().padStart(2, "0")
      const month = selectedMonth.toString().padStart(2, "0")
      const dateString = `${day}/${month}/${defaultYear}`
      onChange(dateString)
      setIsOpen(false)

      // Trigger the onApply callback (filter logic)
      if (onApply) {
        onApply()
      }
    }
  }

  const getDisplayDate = () => {
    if (!selectedDay || !selectedMonth) return null
    const monthName = months.find(m => m.num === selectedMonth)?.name
    return `${selectedDay} ${monthName}, ${defaultYear}`
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all duration-200 group"
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${value ? "text-gray-900" : "text-gray-400"}`}>
            {getDisplayDate() || placeholder}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[320px] bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
            <h3 className="text-white font-semibold text-sm">
              {getDisplayDate() || "Select a date"}
            </h3>
          </div>

          <div className="p-5 space-y-5">
            {/* Month Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wide">
                Month
              </label>
              <div className="grid grid-cols-4 gap-2">
                {months.map((month) => (
                  <button
                    key={month.num}
                    type="button"
                    onClick={() => setSelectedMonth(month.num)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${selectedMonth === month.num
                      ? "bg-blue-500 text-white shadow-md scale-105"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105"
                      }`}
                  >
                    {month.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wide">
                Day
              </label>
              <div className="grid grid-cols-7 gap-1.5 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square rounded-lg text-sm font-semibold transition-all duration-150 ${selectedDay === day
                      ? "bg-blue-500 text-white shadow-md scale-110"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-110"
                      }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 px-5 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedDay || !selectedMonth}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold text-sm hover:from-purple-700 hover:to-purple-800 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-purple-700 shadow-md hover:shadow-lg"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}