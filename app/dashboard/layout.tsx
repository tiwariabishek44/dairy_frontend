"use client"

import type React from "react"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import { Menu } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Menu size={24} />
          </button>
          <div className="text-xl font-semibold text-gray-800">Dairy Center Admin</div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full" />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  )
}
