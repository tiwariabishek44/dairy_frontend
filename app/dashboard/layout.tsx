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


        {/* Content Area */}
        <div className="flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  )
}
