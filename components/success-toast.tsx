"use client"

import { CheckCircle } from "lucide-react"

export default function SuccessToast() {
  return (
    <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 shadow-lg">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-900">Login successful!</p>
          <p className="text-xs text-green-700">Welcome to the admin panel</p>
        </div>
      </div>
    </div>
  )
}
