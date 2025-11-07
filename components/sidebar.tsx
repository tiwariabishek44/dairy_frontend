"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Milk, Users, Bell, CreditCard, LogOut } from "lucide-react"

const menuItems = [
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/milk-record-upload", label: "Milk Record Upload", icon: Milk },
  { href: "/dashboard/milk-records", label: "Milk Records", icon: Milk },
  { href: "/dashboard/farmers", label: "Farmers Record", icon: Users },
  { href: "/dashboard/notices", label: "Notice", icon: Bell },
  { href: "/dashboard/payments", label: "Payment Records", icon: CreditCard },
]

interface SidebarProps {
  isOpen: boolean
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-white text-slate-800 flex flex-col transition-all duration-300 ease-in-out shadow-lg border-r border-gray-200`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-2xl font-bold text-slate-900">{isOpen ? "Dairy Center" : "DC"}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center gap-4 px-4 py-3 w-full rounded-lg text-slate-600 hover:bg-red-50 transition-all hover:text-red-600">
          <LogOut size={20} />
          {isOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  )
}
