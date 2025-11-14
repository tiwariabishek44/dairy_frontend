"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import NepaliDate from "nepali-date-converter"

interface NepaliDatePickerProps {
  value: string
  onChange: (date: string) => void
  onApply?: () => void
  placeholder?: string
}

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

const DAYS_IN_MONTHS = [31, 31, 32, 32, 31, 30, 29, 30, 29, 30, 29, 30]
const NEPALI_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function NepaliDatePicker({ value, onChange, onApply, placeholder = "Select Date" }: NepaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const todayNepali = new NepaliDate()

  const [currentNepaliDate, setCurrentNepaliDate] = useState(() => ({
    year: todayNepali.getYear(),
    month: todayNepali.getMonth() + 1,
    day: todayNepali.getDate(),
  }))

  const [selectedDate, setSelectedDate] = useState<{ year: number, month: number, day: number } | null>(null)

  // Parse existing value
  useEffect(() => {
    if (value) {
      const parts = value.split("/")
      if (parts.length === 3) {
        const day = parseInt(parts[0])
        const month = parseInt(parts[1])
        const year = parseInt(parts[2])
        setSelectedDate({ year, month, day })
        setCurrentNepaliDate({ year, month, day })
      }
    } else {
      setSelectedDate(null)
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

  const daysInCurrentMonth = DAYS_IN_MONTHS[currentNepaliDate.month - 1]

  const days = useMemo(() => {
    const nepaliDate = new NepaliDate(currentNepaliDate.year, currentNepaliDate.month - 1, 1)
    const gregDate = nepaliDate.toJsDate()
    const startingDayOfWeek = gregDate.getDay()

    const result = []

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      result.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      result.push(i)
    }

    return result
  }, [currentNepaliDate, daysInCurrentMonth])

  const handlePrevMonth = () => {
    setCurrentNepaliDate((prev) => {
      if (prev.month === 1) {
        return { ...prev, month: 12, year: prev.year - 1 }
      }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const handleNextMonth = () => {
    setCurrentNepaliDate((prev) => {
      if (prev.month === 12) {
        return { ...prev, month: 1, year: prev.year + 1 }
      }
      return { ...prev, month: prev.month + 1 }
    })
  }

  const handleDateSelect = (day: number) => {
    const newDate = {
      year: currentNepaliDate.year,
      month: currentNepaliDate.month,
      day
    }
    setSelectedDate(newDate)

    // Immediately update the parent component's state
    const formatted = `${String(day).padStart(2, "0")}/${String(currentNepaliDate.month).padStart(2, "0")}/${currentNepaliDate.year}`
    onChange(formatted)
  }

  const handleApply = () => {
    if (selectedDate) {
      // Date is already set in onChange, just close and trigger onApply
      setIsOpen(false)
      if (onApply) {
        onApply()
      }
    }
  }

  const handleClear = () => {
    // Clear selected date, reset calendar to today, and notify parent
    setSelectedDate(null)
    setCurrentNepaliDate({
      year: todayNepali.getYear(),
      month: todayNepali.getMonth() + 1,
      day: todayNepali.getDate(),
    })
    onChange("")
  }

  const getDisplayDate = () => {
    if (!selectedDate) return null
    const monthName = NEPALI_MONTHS[selectedDate.month - 1]
    return `${selectedDate.day} ${monthName}, ${selectedDate.year}`
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all duration-200"
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
        <div className="absolute z-50 mt-2 w-full min-w-[350px] bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-white">
            <h3 className="text-sm font-semibold text-gray-800">
              {getDisplayDate() || "Select a date"}
            </h3>
          </div>

          <div className="p-4">
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-sm">
                  {NEPALI_MONTHS[currentNepaliDate.month - 1]}
                </p>
                <p className="text-xs text-gray-500">{currentNepaliDate.year}</p>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {NEPALI_DAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {days.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => day && handleDateSelect(day)}
                  disabled={!day}
                  className={`aspect-square rounded-md text-sm font-medium transition-colors ${!day
                    ? "invisible"
                    : selectedDate &&
                      day === selectedDate.day &&
                      currentNepaliDate.month === selectedDate.month &&
                      currentNepaliDate.year === selectedDate.year
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100 text-gray-700"
                    }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 px-4 py-3 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-md font-medium text-sm hover:bg-gray-50 transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedDate}
              className={`flex-1 px-3 py-2 rounded-md font-medium text-sm transition ${selectedDate
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}